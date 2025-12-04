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
  fields?: FieldMapping[];
}

export interface PaginationConfig {
  type: 'scrollDown' | 'clickNext' | 'clickLoadMore' | 'scrollUp';
  selector?: string | null;
}

export interface FieldMapping {
  originalName: string;
  customName: string;
  selector: string;
  include: boolean;
}

export interface PreviewField {
  name: string;
  selector: string;
  sampleValue: string;
}
