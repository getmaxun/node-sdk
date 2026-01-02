# Maxun SDK

The official Node.js SDK for [Maxun](https://maxun.dev) - turn any website into an API.

Works with both Maxun Cloud and Maxun Open Source - automatically handles the differences for you.

## What can you do with Maxun SDK?

- **Extract structured data** from any website
- **Scrape entire pages** as Markdown or HTML
- **Crawl multiple pages** automatically to discover and scrape content
- **Perform web searches** and extract results as metadata or full content
- **Use AI to extract data** with natural language prompts
- **Capture screenshots** (visible area or full page)
- **Automate workflows** with clicks, form fills, and navigation
- **Schedule recurring jobs** to keep your data fresh
- **Get webhooks** when extractions complete
- **Handle pagination** automatically (scroll, click, load more)

## Quick Start
Follow the quick-start guide here: https://docs.maxun.dev/sdk/sdk-overview

## Table of Contents

1. [Extract](https://docs.maxun.dev/sdk/sdk-extract)
   - [LLM Extraction (Beta)](https://docs.maxun.dev/sdk/sdk-extract#llm-extraction-beta)
   - [Non-LLM Extraction](https://docs.maxun.dev/sdk/sdk-extract#non-llm-extraction)
   - [Auto Pagination](https://docs.maxun.dev/sdk/sdk-extract#2-auto-pagination-optional)
   - [Auto List Capture](https://docs.maxun.dev/sdk/sdk-extract#1-auto-list-capture)

2. [Scrape](https://docs.maxun.dev/sdk/sdk-scrape)

3. [Crawl](https://docs.maxun.dev/sdk/sdk-crawl)
4. [Search](https://docs.maxun.dev/sdk/sdk-search)

5. [Robot Management](https://docs.maxun.dev/sdk/sdk-robot)
   - [Scheduling](https://docs.maxun.dev/sdk/sdk-robot#scheduling)
   - [Webhooks](https://docs.maxun.dev/sdk/sdk-robot#webhooks)
   - [Runs](https://docs.maxun.dev/sdk/sdk-robot#running-robots)
   - [Error Handling](https://docs.maxun.dev/sdk/sdk-robot#error-handling)
   - [Execution History](https://docs.maxun.dev/sdk/sdk-robot#execution-history)


## Examples

Check out the [examples](./examples) directory for complete working examples:

| Example | What it does |
|---------|-------------|
| [basic-extraction.ts](./examples/basic-extraction.ts) | Extract fields from a single page |
| [list-pagination.ts](./examples/list-pagination.ts) | Scrape lists with different pagination strategies |
| [form-fill-screenshot.ts](./examples/form-fill-screenshot.ts) | Fill forms and capture screenshots |
| [chained-extract.ts](./examples/chained-extract.ts) | Execute multiple capture actions with one robot |
| [simple-scrape.ts](./examples/simple-scrape.ts) | Convert pages to Markdown/HTML/Screenshots |
| [basic-crawl.ts](./examples/basic-crawl.ts) | Crawl multiple pages automatically |
| [llm-extraction.ts](./examples/llm-extraction.ts) | AI-powered extraction with natural language |
| [scheduling.ts](./examples/scheduling.ts) | Set up robot schedules to execute runs |
| [webhooks.ts](./examples/webhooks.ts) | Configure webhook notifications |
| [robot-management.ts](./examples/robot-management.ts) | CRUD operations for robots |
| [complete-workflow.ts](./examples/complete-workflow.ts) | Create a robot combining multiple features |

