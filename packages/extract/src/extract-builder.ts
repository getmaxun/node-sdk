/**
 * Extract Workflow Builder
 * Fluent API for building extraction workflows
 */

import { WorkflowBuilder, Robot } from '@maxun/core';
import { ExtractFields, ExtractListConfig, PreviewField, FieldMapping } from './types';
import * as readlineSync from 'readline-sync';

export class ExtractBuilder extends WorkflowBuilder implements PromiseLike<Robot> {
  private extractor: any; // Will be set by MaxunExtract
  private pendingListConfig: { config: ExtractListConfig; name?: string; url: string } | null = null;

  constructor(name: string) {
    super(name, 'extract');
  }

  /**
   * Set the parent extractor (called internally)
   */
  setExtractor(extractor: any): this {
    this.extractor = extractor;
    return this;
  }

  /**
   * Capture specific text fields from the page
   */
  captureText(fields: ExtractFields, name?: string): this {
    // Pass fields directly as plain selectors
    this.addAction({
      action: 'scrapeSchema',
      args: [fields],
      name: name,
    });

    return this;
  }

  /**
   * Capture a list of items with pagination support
   * Fields are automatically detected from the list selector
   */
  captureList(config: ExtractListConfig, name?: string): this {
    // Store the config and URL for later processing
    const url = this.getCurrentUrl();
    if (!url) {
      throw new Error('captureList requires a navigate() call before it to determine the URL');
    }

    this.pendingListConfig = {
      config,
      name,
      url
    };

    return this;
  }

  /**
   * Get the current URL from the workflow
   */
  private getCurrentUrl(): string | null {
    const workflow = this.getWorkflowArray();
    if (workflow.length > 0 && workflow[0].where.url) {
      return workflow[0].where.url;
    }
    return null;
  }

  /**
   * Preview and configure list fields interactively
   */
  private async previewAndConfigureFields(): Promise<void> {
    if (!this.pendingListConfig) {
      return;
    }

    const { config, name, url } = this.pendingListConfig;

    console.log('\n🔍 Extracting sample fields from the list...\n');

    try {
      // Get the client from the extractor
      const client = this.extractor.client;
      const previewData = await client.previewListFields(url, config.selector, 2);

      const fields: PreviewField[] = previewData.fields;

      if (fields.length === 0) {
        console.log('⚠️  No fields found with the provided selector.');
        console.log('Continuing without field configuration...\n');
        this.addListActionWithoutFields(config, name);
        return;
      }

      // Display fields in a table format
      console.log(`Found ${fields.length} fields:\n`);
      console.log('┌──────┬──────────────────────┬────────────────────────────────────────────┐');
      console.log('│  #   │ Field Name           │ Sample Value                               │');
      console.log('├──────┼──────────────────────┼────────────────────────────────────────────┤');

      fields.forEach((field, index) => {
        const num = String(index + 1).padEnd(4);
        const fieldName = field.name.padEnd(20).substring(0, 20);
        const sampleValue = field.sampleValue.padEnd(44).substring(0, 44);
        console.log(`│ ${num} │ ${fieldName} │ ${sampleValue} │`);
      });

      console.log('└──────┴──────────────────────┴────────────────────────────────────────────┘\n');

      // Ask which fields to keep
      const keepInput = readlineSync.question(
        'Which fields would you like to keep? (comma-separated numbers, or "all"): '
      ).trim();

      let selectedIndices: number[];

      if (keepInput.toLowerCase() === 'all') {
        selectedIndices = fields.map((_, i) => i);
      } else {
        selectedIndices = keepInput
          .split(',')
          .map(s => parseInt(s.trim()) - 1)
          .filter(i => i >= 0 && i < fields.length);
      }

      if (selectedIndices.length === 0) {
        console.log('⚠️  No fields selected. Continuing without field configuration...\n');
        this.addListActionWithoutFields(config, name);
        return;
      }

      // Ask for custom names for each selected field
      const fieldMappings: FieldMapping[] = [];
      console.log('');

      for (const index of selectedIndices) {
        const field = fields[index];
        const customName = readlineSync.question(
          `Rename "${field.name}"? (press Enter to keep as is): `
        ).trim();

        fieldMappings.push({
          originalName: field.name,
          customName: customName || field.name,
          selector: field.selector,
          include: true
        });
      }

      console.log(`\n✅ Configured ${fieldMappings.length} fields for extraction\n`);

      // Add the scrapeList action with field mappings
      config.fields = fieldMappings;
      this.addListActionWithFields(config, name);

    } catch (error: any) {
      console.error(`\n❌ Error previewing fields: ${error.message}`);
      console.log('Continuing without field configuration...\n');
      this.addListActionWithoutFields(config, name);
    }

    // Clear pending config
    this.pendingListConfig = null;
  }

  /**
   * Add scrapeList action with field mappings
   */
  private addListActionWithFields(config: ExtractListConfig, name?: string): void {
    const { selector, pagination, fields } = config;

    const scrapeListConfig: any = {
      itemSelector: selector,
      maxItems: config.maxItems || 100,
      fields: fields
    };

    if (pagination) {
      scrapeListConfig.pagination = {
        type: pagination.type,
        selector: pagination.selector || null
      };
    }

    this.addAction({
      action: 'scrapeList',
      args: [scrapeListConfig],
      name: name,
    });
  }

  /**
   * Add scrapeList action without field mappings (fallback)
   */
  private addListActionWithoutFields(config: ExtractListConfig, name?: string): void {
    const { selector, pagination } = config;

    const scrapeListConfig: any = {
      itemSelector: selector,
      maxItems: config.maxItems || 100
    };

    if (pagination) {
      scrapeListConfig.pagination = {
        type: pagination.type,
        selector: pagination.selector || null
      };
    }

    this.addAction({
      action: 'scrapeList',
      args: [scrapeListConfig],
      name: name,
    });
  }

  /**
   * Override then to process pending list config before building
   */
  then<TResult1 = Robot, TResult2 = never>(
    onfulfilled?: ((value: Robot) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    if (!this.extractor) {
      return Promise.reject(
        new Error('Builder not properly initialized. Use extractor.create() to create a builder.')
      ).then(onfulfilled, onrejected);
    }

    // Process pending list config before building
    return this.previewAndConfigureFields()
      .then(() => this.extractor.build(this))
      .then(onfulfilled, onrejected);
  }

}
