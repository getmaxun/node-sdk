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
  /**
   * Optional field mapping by index (1-based)
   * Example: { 1: 'title', 2: 'price', 4: 'rating' }
   * If not provided, all fields will be extracted with auto-generated names (Label 1, Label 2, etc.)
   */
  fields?: { [index: number]: string };
}

export interface PaginationConfig {
  type: 'scrollDown' | 'clickNext' | 'clickLoadMore' | 'scrollUp';
  selector?: string | null;
}
