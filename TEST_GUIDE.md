# Maxun SDK Testing Guide

Complete step-by-step guide to test your Maxun SDKs.

## Prerequisites Checklist

Before testing, ensure you have:

- [ ] Backend server code (`maxun-cloud-recording`)
- [ ] PostgreSQL database running
- [ ] Node.js 18+ installed
- [ ] API key from your Maxun account

## Step 1: Prepare Backend Server

### 1.1 Navigate to Backend

```bash
cd /Users/rohitrajan/Documents/Work/maxun/maxun-cloud-recording
```

### 1.2 Verify Environment Variables

Check your `.env` file has all required variables:

```bash
cat .env
```

Required variables:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maxun
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
PORT=8080
```

### 1.3 Install Dependencies (if needed)

```bash
npm install
```

### 1.4 Start the Backend

```bash
npm run dev
```

Expected output:
```
Server running on port 8080
Database connected
```

**Keep this terminal open!**

### 1.5 Verify Backend is Running

Open a new terminal and test:

```bash
curl http://localhost:8080/api/sdk/robots \
  -H "x-api-key: test" \
  -v
```

You should get a 403 or 401 (auth error) - that's good! It means the endpoint exists.

## Step 2: Get Your API Key

### Option A: From Database

```bash
psql -U your_db_user -d maxun -c "SELECT id, email, api_key FROM users LIMIT 1;"
```

Copy the `api_key` value.

### Option B: From Your Application

1. Log in to your Maxun web app
2. Go to Settings → API Keys
3. Generate or copy existing key

### Option C: Generate Manually (for testing)

```bash
psql -U your_db_user -d maxun

UPDATE users
SET api_key = 'test_api_key_' || md5(random()::text)
WHERE id = YOUR_USER_ID
RETURNING api_key;
```

Also ensure the user has proper subscription:

```bash
UPDATE subscriptions
SET plan = 'BASIC'
WHERE user_id = YOUR_USER_ID;
```

## Step 3: Build SDK Packages

### 3.1 Navigate to SDK Directory

```bash
cd /Users/rohitrajan/Documents/Work/maxun/maxun-sdks
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Build All Packages

```bash
npm run build
```

Expected output:
```
> @maxun/core@0.1.0 build
> tsc

> @maxun/extract@0.1.0 build
> tsc

> @maxun/scrape@0.1.0 build
> tsc
```

Verify build output:
```bash
ls -la packages/core/dist
ls -la packages/extract/dist
ls -la packages/scrape/dist
```

You should see `.js` and `.d.ts` files.

## Step 4: Run the Test Script

### 4.1 Set Your API Key

```bash
export MAXUN_API_KEY="your_api_key_here"
```

Optional: Set custom backend URL if not using localhost:8080:
```bash
export MAXUN_BASE_URL="http://localhost:8080/api/sdk"
```

### 4.2 Run the Test

```bash
npx tsx test-sdk.ts
```

### 4.3 Expected Output

```
=== Maxun SDK Test ===

1. Initializing MaxunExtract...
   ✓ Extractor initialized

2. Creating extraction robot...
   ✓ Robot created with ID: robot_1234567890_abc123

3. Executing robot...
   ✓ Execution completed!

4. Results:
   Status: success
   Run ID: run-uuid-here

   Extracted Data:
   {
       "title": "A Light in the Attic",
       "price": "£51.77",
       "availability": "In stock (22 available)"
   }

   Screenshots: 0

5. Fetching run history...
   ✓ Found 1 run(s)

6. Cleaning up (deleting test robot)...
   ✓ Robot deleted

=== ✅ All Tests Passed! ===
```

## Step 5: Check Backend Logs

In your backend terminal, you should see logs like:

```
[SDK] Robot created: robot_1234567890_abc123 by user 1
[SDK] Starting execution for robot robot_1234567890_abc123, run xxx
[SDK] Run xxx completed successfully
[SDK] Robot deleted: robot_1234567890_abc123 by user 1
```

## Step 6: Manual Testing with Examples

### 6.1 Test Extract SDK

```bash
cd examples
npm install

# Edit extract-basic.ts and add your API key, or use env var
export MAXUN_API_KEY="your_key"

# Run example
npx tsx extract-basic.ts
```

### 6.2 Test Scrape SDK

```bash
npx tsx scrape-auto.ts
```

### 6.3 Test Scheduling

```bash
npx tsx scheduled.ts
```

## Troubleshooting

### Error: "Connection refused" or "ECONNREFUSED"

**Problem:** Backend server not running

**Solution:**
```bash
cd maxun-cloud-recording
npm run dev
```

### Error: "API Access not allowed"

**Problem:** User subscription is 'NONE'

**Solution:**
```sql
UPDATE subscriptions SET plan = 'BASIC' WHERE user_id = YOUR_USER_ID;
```

### Error: "Invalid API key" or 401/403

**Problem:** Wrong API key or user not found

**Solution:**
1. Verify API key exists:
   ```sql
   SELECT id, email, api_key FROM users WHERE api_key = 'your_key';
   ```

2. Generate new key if needed:
   ```sql
   UPDATE users SET api_key = 'test_' || md5(random()::text) WHERE id = YOUR_USER_ID RETURNING api_key;
   ```

### Error: "Robot not found" after creation

**Problem:** Database insertion failed

**Solution:**
1. Check backend logs for errors
2. Verify database connection
3. Check if `robots` table exists:
   ```sql
   \dt robots
   ```

### Error: Module not found or TypeScript errors

**Problem:** Build failed or packages not linked

**Solution:**
```bash
cd maxun-sdks
rm -rf packages/*/dist packages/*/node_modules node_modules
npm install
npm run build
```

### Error: Browser/Playwright errors during execution

**Problem:** Playwright not installed or browser issues

**Solution:**
```bash
cd maxun-cloud-recording
npx playwright install chromium
```

### Error: "Failed to execute robot"

**Problem:** Workflow execution error

**Solution:**
1. Check backend logs for detailed error
2. Verify the target URL is accessible
3. Check if selectors are valid

## Step 7: Test Advanced Features

### Test Scheduling

```typescript
import { MaxunExtract } from '@maxun/extract';

const extractor = new MaxunExtract({ apiKey: process.env.MAXUN_API_KEY! });

const robot = await extractor
  .create('Scheduled Test')
  .navigate('https://example.com')
  .extract({ title: 'h1' })
  .build();

// Schedule to run every hour
await robot.schedule({
  runEvery: 1,
  runEveryUnit: 'HOURS',
  timezone: 'UTC'
});

console.log('Robot scheduled!');

// Check schedule in database
// SELECT * FROM robots WHERE id = 'robot_id';
```

### Test Webhooks

```typescript
await robot.addWebhook({
  url: 'https://webhook.site/your-unique-url',  // Get URL from webhook.site
  events: ['run.completed', 'run.failed']
});

console.log('Webhook added! Check webhook.site for notifications');
```

### Test List Extraction

```typescript
const robot = await extractor
  .create('List Test')
  .navigate('https://books.toscrape.com/')
  .extractList({
    selector: '.product_pod',
    fields: {
      title: 'h3 a',
      price: '.price_color'
    },
    pagination: {
      next: '.next a',
      maxPages: 2
    }
  })
  .build();

const result = await robot.run();
console.log(`Found ${result.data.listData?.length} items`);
```

### Test Bulk Extraction

```typescript
const robot = await extractor
  .create('Bulk Test')
  .bulk({
    urls: [
      'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html',
      'https://books.toscrape.com/catalogue/tipping-the-velvet_999/index.html'
    ]
  })
  .navigate('https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html')
  .extract({
    title: 'h1',
    price: '.price_color'
  })
  .build();

const result = await robot.run({ timeout: 120000 });
console.log('Bulk extraction completed');
```

## Step 8: Verify Database

Check that robots are being created:

```sql
-- Connect to database
psql -U your_db_user -d maxun

-- Check robots
SELECT id, recording_meta->>'name' as name, recording_meta->>'type' as type, "createdAt"
FROM robots
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check runs
SELECT id, status, "robotMetaId", "startedAt", "finishedAt"
FROM runs
ORDER BY "startedAt" DESC
LIMIT 5;
```

## Success Criteria

✅ All of these should work:

1. Backend server starts without errors
2. SDK builds successfully (no TypeScript errors)
3. Test script runs and passes all steps
4. Robot is created in database
5. Robot executes successfully
6. Results are returned with extracted data
7. Robot can be deleted
8. Backend logs show `[SDK]` prefixed messages

## Next Steps After Successful Testing

1. **Test with your own websites** - Replace URLs with your target sites
2. **Test integrations** - Set up Google Sheets, Airtable, N8N
3. **Performance testing** - Try bulk extraction with many URLs
4. **Error scenarios** - Test with invalid selectors, wrong URLs
5. **Production deployment** - Deploy backend and publish SDKs to npm

## Quick Test Commands (All-in-One)

```bash
# Terminal 1 - Start Backend
cd maxun-cloud-recording && npm run dev

# Terminal 2 - Test SDK
cd maxun-sdks
npm install
npm run build
export MAXUN_API_KEY="your_key_here"
npx tsx test-sdk.ts
```

## Getting Help

If tests fail:

1. Check backend logs (Terminal 1)
2. Check error messages carefully
3. Verify all environment variables
4. Check database connectivity
5. Review the troubleshooting section above

**Backend logs location:** `maxun-cloud-recording/logs/` (if file logging is enabled)

Good luck! 🚀
