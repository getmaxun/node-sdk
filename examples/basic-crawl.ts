/**
 * Crawl Example
 *
 * This example demonstrates:
 * - Using the Crawl SDK to discover and scrape multiple pages
 * - Configuring crawl scope (domain, subdomain, or path)
 * - Setting limits and depth for crawling
 * - Using sitemap discovery
 * - Filtering pages with include/exclude paths
 *
 * Site: Example blog or documentation site
 */

import 'dotenv/config';
import { Crawl } from 'maxun-sdk';

async function main() {
  const crawler = new Crawl({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL!
  });

  try {
    const robot = await crawler.create(
      'YC Companies Crawler',
      'https://www.ycombinator.com/jobs',
      {
        mode: 'domain',
        limit: 10,
        maxDepth: 3,
        includePaths: [],
        excludePaths: [],
        useSitemap: true,
        followLinks: true,
        respectRobots: true
      }
    );

    console.log(`Crawl robot created: ${robot.id}`);
    console.log('Starting crawl...');

    const result = await robot.run();

    console.log('\n=== Crawl Completed ===');
    console.log('Status:', result.status);
    console.log('Run ID:', result.runId);

    if (result.data.crawlData) {
      const crawlData = result.data.crawlData;

      if (typeof crawlData === 'object' && !Array.isArray(crawlData)) {
        const allPages: any[] = [];
        Object.values(crawlData).forEach((value: any) => {
          if (Array.isArray(value)) {
            allPages.push(...value);
          }
        });

        console.log('Pages crawled:', allPages.length);

        console.log('\nCrawled URLs:');
        allPages.forEach((page: any, i: number) => {
          const url = page?.metadata?.url || page?.url || `Page ${i + 1}`;
          console.log(`  ${i + 1}. ${url}`);
          if (page.metadata?.title) {
            console.log(`     Title: ${page.metadata.title}`);
          }
          if (page.wordCount) {
            console.log(`     Words: ${page.wordCount}`);
          }
        });
      } else if (Array.isArray(crawlData)) {
        console.log('Pages crawled:', crawlData.length);

        console.log('\nCrawled URLs:');
        crawlData.forEach((page: any, i: number) => {
          const url = page?.metadata?.url || page?.url || `Page ${i + 1}`;
          console.log(`  ${i + 1}. ${url}`);
        });
      } else {
        console.log('Crawl data format:', typeof crawlData);
        console.log('Crawl data:', JSON.stringify(crawlData, null, 2));
      }
    } else {
      console.log('No crawl data found');
      console.log('Result data keys:', Object.keys(result.data));
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
