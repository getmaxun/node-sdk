/**
 * Types specific to the Extract SDK
 */

export interface ExtractFields {
  [fieldName: string]: string; // fieldName: cssSelector
}

export interface ExtractListConfig {
  selector: string; // Container selector for list items
  // Fields are auto-generated based on the selector - no manual field definition needed
  pagination?: PaginationConfig;
  maxItems?: number; // Maximum number of items to extract
}

export interface PaginationConfig {
  next?: string; // Next button selector
  maxPages?: number; // Maximum number of pages to extract
  waitAfterClick?: number; // Wait time after clicking next (ms)
}

export interface BulkExtractConfig {
  urls: string[];
  extractUrlsFromPreviousRun?: boolean;
}
