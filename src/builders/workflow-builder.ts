/**
 * Base Workflow Builder
 * Provides common functionality for building Maxun workflows
 */

import {
  Workflow,
  WhereWhatPair,
  Where,
  What,
  RobotMeta,
  RobotType,
  RobotMode,
  Format,
} from '../types';

export abstract class WorkflowBuilder {
  protected workflow: Workflow = [];
  protected meta: Partial<RobotMeta> = {};
  protected currentStep: WhereWhatPair | null = null;
  private isFirstNavigation: boolean = true;

  constructor(protected name: string, protected robotType: RobotType) {
    this.meta.name = name;
    this.meta.robotType = robotType;
  }

  /**
   * Navigate to a URL
   */
  navigate(url: string): this {
    // Create the main step (no goto action here)
    const mainStep: WhereWhatPair = {
      where: { url },
      what: [],
    };

    // Only add about:blank on FIRST navigation
    if (this.isFirstNavigation) {
      // Create the about:blank step
      const aboutBlankStep: WhereWhatPair = {
        where: { url: 'about:blank' },
        what: [
          {
            action: 'goto',
            args: [url],
          },
          {
            action: 'waitForLoadState',
            args: ['networkidle'],
          },
        ],
      };

      // Add main step to front, about:blank to end (bottom)
      this.workflow.unshift(mainStep);
      this.workflow.push(aboutBlankStep);
      this.isFirstNavigation = false;
    } else {
      // Subsequent navigations: add to front
      this.workflow.unshift(mainStep);
    }

    this.currentStep = mainStep;
    return this;
  }

  /**
   * Click on an element
   */
  click(selector: string): this {
    this.addAction({
      action: 'click',
      args: [selector],
    });
    return this;
  }

  /**
   * Type text into an input
   * The input type will be automatically detected during validation if not provided
   */
  type(selector: string, text: string, inputType?: string): this {
    const args = inputType
      ? [selector, text, inputType]  // User specified type
      : [selector, text];             // Will be auto-detected by enricher

    this.addAction({
      action: 'type',
      args: args,
    });
    return this;
  }

  /**
   * Wait for a selector to appear
   */
  waitFor(selector: string, timeout?: number): this {
    this.addAction({
      action: 'waitForSelector',
      args: [selector, { timeout: timeout || 30000 }],
    });
    return this;
  }

  /**
   * Wait for a specific duration
   */
  wait(milliseconds: number): this {
    this.addAction({
      action: 'waitForTimeout',
      args: [milliseconds],
    });
    return this;
  }

  /**
   * Capture a screenshot
   */
  captureScreenshot(name?: string, options?: {
    fullPage?: boolean;
    type?: 'png' | 'jpeg';
    quality?: number;
    timeout?: number;
    caret?: 'hide' | 'initial';
    scale?: 'css' | 'device';
    animations?: 'disabled' | 'allow';
  }): this {
    const screenshotArgs = options ? {
      type: options.type || 'png',
      caret: options.caret || 'hide',
      scale: options.scale || 'device',
      timeout: options.timeout || 30000,
      fullPage: options.fullPage !== undefined ? options.fullPage : true,
      animations: options.animations || 'allow',
      ...(options.quality && { quality: options.quality })
    } : {
      type: 'png',
      caret: 'hide',
      scale: 'device',
      timeout: 30000,
      fullPage: true,
      animations: 'allow'
    };

    this.addAction({
      action: 'screenshot',
      name: name,
      args: [screenshotArgs]
    });
    return this;
  }

  /**
   * Scroll the page
   */
  scroll(direction: 'up' | 'down' | 'top' | 'bottom', distance?: number): this {
    this.addAction({
      action: 'scroll',
      args: [{ direction, distance }],
    });
    return this;
  }

  /**
   * Set cookies
   */
  setCookies(cookies: Array<{ name: string; value: string; domain?: string }>): this {
    if (this.currentStep) {
      this.currentStep.where.cookies = cookies;
    }
    return this;
  }

  /**
   * Set robot mode (normal or bulk)
   */
  mode(mode: RobotMode): this {
    this.meta.mode = mode;
    return this;
  }


  /**
   * Set output formats
   */
  format(formats: Format[]): this {
    this.meta.formats = formats;
    return this;
  }

  /**
   * Add a new step to the workflow
   */
  protected addStep(step: WhereWhatPair): void {
    this.currentStep = step;
    this.workflow.unshift(step);
  }

  /**
   * Add an action to the current step
   * Actions are added to the end since what[] executes top-to-bottom
   */
  protected addAction(action: What): void {
    if (!this.currentStep) {
      // Create a new step if none exists
      this.addStep({
        where: {},
        what: [action],
      });
    } else {
      // Use push to add to end - top-to-bottom execution
      this.currentStep.what.push(action);
    }
  }

  /**
   * Get the built workflow (array only)
   */
  getWorkflowArray(): Workflow {
    return this.workflow;
  }

  /**
   * Get the complete workflow structure with metadata
   */
  getWorkflow(): { meta: Partial<RobotMeta>; workflow: Workflow } {
    return {
      meta: this.meta,
      workflow: this.workflow
    };
  }

  /**
   * Get the robot metadata
   */
  getMeta(): Partial<RobotMeta> {
    return this.meta;
  }
}
