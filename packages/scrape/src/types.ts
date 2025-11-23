/**
 * Types specific to the Scrape SDK
 */

import { Format } from '@maxun/core';

export interface ScrapeListConfig {
  selector: string; // Container selector for list items
  autoDetectFields?: boolean; // Automatically detect fields within items
  fields?: { [fieldName: string]: string }; // Manual field definitions
  pagination?: ScrapePaginationConfig;
}

export interface ScrapePaginationConfig {
  next?: string; // Next button selector
  maxPages?: number; // Maximum number of pages to scrape
  waitAfterClick?: number; // Wait time after clicking next (ms)
}

export interface ScrapeConfig {
  formats?: Format[];
  autoDetect?: boolean;
}
