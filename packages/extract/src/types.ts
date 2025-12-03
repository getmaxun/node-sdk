/**
 * Types specific to the Extract SDK
 */

export interface ExtractFields {
  [fieldName: string]: string;
}

export interface ExtractListConfig {
  selector: string;
  pagination?: PaginationConfig;
  maxItems?: number;
}

export interface PaginationConfig {
  type: 'scrollDown' | 'clickNext' | 'clickLoadMore' | 'scrollUp';
  selector?: string | null;
}

export interface BulkExtractConfig {
  urls: string[];
  extractUrlsFromPreviousRun?: boolean;
}
