/**
 * Search Example
 *
 * This example demonstrates:
 * - Using the Search SDK to search the web and scrape results
 * - Configuring search mode (discover vs scrape)
 * - Setting search filters (time range, region)
 * - Limiting search results
 *
 * Provider: DuckDuckGo
 */

import 'dotenv/config';
import { Search } from 'maxun-sdk';

async function main() {
  const searcher = new Search({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL!
  });

  try {
    const robot = await searcher.create(
      'Tech News Search',
      {
        query: 'latest AI developments 2025',
        mode: 'discover',
        filters: {
          timeRange: 'week',
        },
        limit: 10,
      }
    );

    console.log(`Search robot created: ${robot.id}`);

    const result = await robot.run();

    const searchData = result.data.searchData;

    if (typeof searchData === 'object' && !Array.isArray(searchData)) {
      const allResults: any[] = [];
      Object.values(searchData).forEach((value: any) => {
        if (Array.isArray(value)) {
          allResults.push(...value);
        } else if (value && value.results && Array.isArray(value.results)) {
          allResults.push(...value.results);
        }
      });

      console.log('Search results found:', allResults.length);

      console.log('\nSearch Results:');
      allResults.forEach((result: any, i: number) => {
        console.log(`\n  ${i + 1}. ${result.title || 'No title'}`);
        console.log(`     URL: ${result.url || 'No URL'}`);
        if (result.description) {
          console.log(`     Description: ${result.description.substring(0, 150)}...`);
        }
      });
    } else if (Array.isArray(searchData)) {
      console.log('Search results found:', searchData.length);

      console.log('\nSearch Results:');
      searchData.forEach((result: any, i: number) => {
        console.log(`\n  ${i + 1}. ${result.title || 'No title'}`);
        console.log(`     URL: ${result.url || 'No URL'}`);
      });
    } 
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

if (!process.env.MAXUN_API_KEY) {
  console.error('Error: MAXUN_API_KEY environment variable is required');
  process.exit(1);
}

main();
