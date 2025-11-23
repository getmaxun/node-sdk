# Maxun SDK Setup & Testing Guide

This guide will help you set up, build, and test the Maxun SDKs.

## Prerequisites

Before you begin, ensure you have:

1. **Backend Server Running** - `maxun-cloud-recording` must be running
2. **Database Running** - PostgreSQL with all tables migrated
3. **Node.js 18+** installed
4. **API Key** - Generated from your Maxun account

## Architecture Overview

```
┌─────────────────────┐
│   Developer Code    │
│   (using SDK)       │
└──────────┬──────────┘
           │
           ├─> @maxun/extract  or  @maxun/scrape
           │
           └─> @maxun/core (API Client)
                    │
                    │ HTTP: POST /api/sdk/robots
                    │       GET  /api/sdk/robots
                    │       PUT  /api/sdk/robots/:id
                    │       etc.
                    │
           ┌────────▼────────────────────┐
           │  maxun-cloud-recording      │
           │  (Backend Server)            │
           │  - /api/sdk/* endpoints     │
           └────────┬────────────────────┘
                    │
           ┌────────▼──────────┐
           │   mx-cloud        │
           │   (Core Engine)   │
           └───────────────────┘
```

## Step 1: Start Backend Server

```bash
cd /Users/rohitrajan/Documents/Work/maxun/maxun-cloud-recording

# Make sure .env is configured
# Required: DB credentials, JWT_SECRET, etc.

# Install dependencies if needed
npm install

# Start the server
npm run dev
```

Verify server is running:
```bash
curl http://localhost:8080/api/sdk/robots \
  -H "x-api-key: your-api-key"
```

## Step 2: Build SDK Packages

```bash
cd /Users/rohitrajan/Documents/Work/maxun/maxun-sdks

# Install dependencies
npm install

# Build all packages
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` folders:
- `packages/core/dist/`
- `packages/extract/dist/`
- `packages/scrape/dist/`

## Step 3: Link Packages Locally (For Testing)

Instead of publishing to npm, you can test locally using npm link:

```bash
# Link core package
cd packages/core
npm link

# Link extract package (depends on core)
cd ../extract
npm link @maxun/core
npm link

# Link scrape package (depends on core)
cd ../scrape
npm link @maxun/core
npm link
```

## Step 4: Create a Test Project

```bash
# Create a new test directory
mkdir ~/maxun-sdk-test
cd ~/maxun-sdk-test

# Initialize npm
npm init -y

# Link the SDK packages
npm link @maxun/extract
npm link @maxun/scrape

# Install TypeScript and tsx for running TS files
npm install -D typescript tsx @types/node

# Create .env file
echo "MAXUN_API_KEY=your_api_key_here" > .env
```

## Step 5: Write Test Code

Create `test-extract.ts`:

```typescript
import { MaxunExtract } from '@maxun/extract';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: 'http://localhost:8080/api/sdk'
  });

  console.log('Creating extraction robot...');

  const robot = await extractor
    .create('Test Product Extractor')
    .navigate('https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html')
    .extract({
      title: 'h1',
      price: '.price_color',
      availability: '.availability'
    })
    .build();

  console.log('Robot created:', robot.id);

  console.log('Executing robot...');
  const result = await robot.run();

  console.log('Results:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
```

Create `test-scrape.ts`:

```typescript
import { MaxunScrape } from '@maxun/scrape';

async function main() {
  const scraper = new MaxunScrape({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: 'http://localhost:8080/api/sdk'
  });

  console.log('Creating scraping robot...');

  const robot = await scraper
    .create('Test Product Scraper')
    .navigate('https://books.toscrape.com/')
    .scrapeList({
      selector: '.product_pod',
      fields: {
        title: 'h3 a',
        price: '.price_color'
      }
    })
    .asMarkdown()
    .build();

  console.log('Robot created:', robot.id);

  console.log('Executing robot...');
  const result = await robot.run();

  console.log(`Found ${result.data.listData?.length || 0} items`);
  console.log('Sample:', JSON.stringify(result.data.listData?.[0], null, 2));
}

main().catch(console.error);
```

## Step 6: Run Tests

```bash
# Test extract SDK
npx tsx test-extract.ts

# Test scrape SDK
npx tsx test-scrape.ts
```

## Step 7: Verify Backend Logs

Check your backend logs for SDK activity:

```bash
# In maxun-cloud-recording terminal, you should see:
[SDK] Robot created: robot_xxx by user xxx
[SDK] Starting execution for robot robot_xxx, run xxx
[SDK] Run xxx completed successfully
```

## Troubleshooting

### Error: "API Access not allowed"

**Cause:** User's subscription plan is 'NONE'

**Solution:** Update user's subscription in database:
```sql
UPDATE subscriptions SET plan = 'BASIC' WHERE user_id = YOUR_USER_ID;
```

### Error: "Robot not found" or "Failed to create robot"

**Cause:** Database connection issue or missing tables

**Solution:**
1. Check database connection in backend `.env`
2. Run migrations: `npm run migrate` in backend
3. Verify `robots` table exists

### Error: "Connection refused" or "ECONNREFUSED"

**Cause:** Backend server not running

**Solution:** Start backend server:
```bash
cd maxun-cloud-recording && npm run dev
```

### Error: "No response from server"

**Cause:** Incorrect `baseUrl` in SDK config

**Solution:** Ensure baseUrl is correct:
```typescript
new MaxunExtract({
  apiKey: 'your-key',
  baseUrl: 'http://localhost:8080/api/sdk'  // ← Must include /api/sdk
});
```

### TypeScript Import Errors

**Cause:** Packages not linked properly

**Solution:** Re-link packages:
```bash
cd maxun-sdks/packages/core && npm link
cd ../extract && npm link @maxun/core && npm link
cd ../scrape && npm link @maxun/core && npm link
```

## API Endpoints Reference

The SDK uses these backend endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sdk/robots` | Create robot |
| GET | `/api/sdk/robots` | List all robots |
| GET | `/api/sdk/robots/:id` | Get robot details |
| PUT | `/api/sdk/robots/:id` | Update robot |
| DELETE | `/api/sdk/robots/:id` | Delete robot |
| POST | `/api/sdk/robots/:id/execute` | Execute robot |
| GET | `/api/sdk/robots/:id/runs` | Get runs |
| GET | `/api/sdk/robots/:id/runs/:runId` | Get specific run |
| POST | `/api/sdk/robots/:id/runs/:runId/abort` | Abort run |

All endpoints require `x-api-key` header.

## Publishing to npm (When Ready)

```bash
# 1. Update version in package.json files
cd packages/core && npm version patch
cd ../extract && npm version patch
cd ../scrape && npm version patch

# 2. Build
cd ../.. && npm run build

# 3. Login to npm
npm login

# 4. Publish packages
cd packages/core && npm publish --access public
cd ../extract && npm publish --access public
cd ../scrape && npm publish --access public
```

## Next Steps

1. **Test all features**: Try scheduling, webhooks, integrations
2. **Add error handling**: Test with invalid inputs
3. **Performance testing**: Try bulk extraction with many URLs
4. **Documentation**: Update examples with real-world use cases
5. **CI/CD**: Set up automated testing and publishing

## Support

- Backend logs: `maxun-cloud-recording/logs/`
- SDK issues: Check TypeScript compilation errors
- Database: Verify with `psql` or database GUI

## Example: Complete Workflow Test

```typescript
import { MaxunExtract } from '@maxun/extract';

async function completeWorkflowTest() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
  });

  // 1. Create robot
  const robot = await extractor
    .create('Complete Test')
    .navigate('https://example.com')
    .extract({ title: 'h1' })
    .build();

  console.log('✓ Robot created:', robot.id);

  // 2. Execute robot
  const result = await robot.run();
  console.log('✓ Execution completed');

  // 3. Schedule robot
  await robot.schedule({
    runEvery: 1,
    runEveryUnit: 'HOURS',
    timezone: 'UTC'
  });
  console.log('✓ Robot scheduled');

  // 4. Add webhook
  await robot.addWebhook({
    url: 'https://webhook.site/your-unique-url',
    events: ['run.completed']
  });
  console.log('✓ Webhook added');

  // 5. Get runs
  const runs = await robot.getRuns();
  console.log('✓ Runs retrieved:', runs.length);

  // 6. Unschedule
  await robot.unschedule();
  console.log('✓ Robot unscheduled');

  console.log('\n✅ All tests passed!');
}

completeWorkflowTest().catch(console.error);
```

Happy coding! 🚀
