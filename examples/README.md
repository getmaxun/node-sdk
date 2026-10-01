# Examples

## Setup

```bash
cd examples
npm install                       # installs the SDK from the parent folder
cp ../ENVEXAMPLE .env             # then fill in MAXUN_API_KEY (and MAXUN_BASE_URL)
npx tsx simple-scrape.ts
```

Build the SDK first (`npm install && npm run build` in the repository root) so `maxun-sdk` resolves to your local copy.

| Variable | Description | Default |
|---|---|---|
| `MAXUN_API_KEY` | Your Maxun API key (required) | — |
| `MAXUN_BASE_URL` | SDK API URL | `https://app.maxun.dev/api/sdk/` (Cloud). Self-hosted: `http://localhost:8080/api/sdk/` |
| `MAXUN_TEAM_ID` | Team for team-scoped robots (Cloud) | — |

On self-hosted Maxun, the LLM features (prompt extraction, document extraction, `summary`, Smart Queries) also need an LLM: see `llm-extraction.ts`.

## Files

| File | Shows |
|---|---|
| [`simple-scrape.ts`](./simple-scrape.ts) | One page as Markdown, text and a screenshot |
| [`smart-queries.ts`](./smart-queries.ts) | Asking an LLM a question about a page on each run |
| [`basic-extraction.ts`](./basic-extraction.ts) | Capturing fields with CSS selectors |
| [`list-pagination.ts`](./list-pagination.ts) | Lists across pages |
| [`list-limit.ts`](./list-limit.ts) | Changing how many items a robot collects |
| [`chained-extract.ts`](./chained-extract.ts) | Text and a list from the same page |
| [`form-fill-screenshot.ts`](./form-fill-screenshot.ts) | Typing into a form and taking screenshots |
| [`llm-extraction.ts`](./llm-extraction.ts) | Building a robot from a plain-English prompt |
| [`basic-crawl.ts`](./basic-crawl.ts) | Crawling part of a site |
| [`basic-search.ts`](./basic-search.ts) | Web search in discover and scrape mode |
| [`documents.ts`](./documents.ts) | Extracting from and converting PDF/DOCX/XLSX/CSV/images |
| [`monitoring.ts`](./monitoring.ts) | Detecting changes between runs |
| [`scheduling.ts`](./scheduling.ts) | Hourly, weekly and monthly schedules |
| [`webhooks.ts`](./webhooks.ts) | Notifications when runs complete or fail |
| [`robot-management.ts`](./robot-management.ts) | Listing, finding, renaming, copying and deleting robots |
| [`team-robot.ts`](./team-robot.ts) | Robots in a team workspace |
| [`complete-workflow.ts`](./complete-workflow.ts) | A scheduled, monitored list robot with a webhook |
