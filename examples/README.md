# Maxun SDK Examples

This folder contains examples demonstrating how to use the Maxun SDKs.

## Prerequisites

1. **Set up your environment:**
   ```bash
   export MAXUN_API_KEY="your_api_key_here"
   export MAXUN_BASE_URL="http://localhost:5001/api/sdk"
   ```

2. **Install dependencies:**
   ```bash
   cd maxun-sdks
   npm install
   npm run build
   ```

3. **Make sure your backend server is running:**
   ```bash
   cd maxun-cloud-recording
   npm run dev
   ```

## Running Examples

### 1. Basic Extraction
Extracts structured data from a single page:
```bash
npx tsx examples/01-basic-extraction.ts
```

**What it does:**
- Creates a robot to extract product details (title, price, availability)
- Executes the robot
- Displays the extracted data
- Cleans up by deleting the robot

### 2. List Extraction
Extracts multiple items with pagination:
```bash
npx tsx examples/02-list-extraction.ts
```

**What it does:**
- Creates a robot to extract a list of books
- Handles pagination to get multiple pages
- Limits to 20 items across 3 pages
- Shows the run history
- Cleans up

### 3. Robot Reuse
Create once, execute multiple times:
```bash
npx tsx examples/03-robot-reuse.ts
```

**What it does:**
- Creates a robot once
- Executes it 3 times to monitor price changes
- Views all run history
- Cleans up

## Example Output

Successful execution looks like:
```
=== Basic Extraction Example ===

Creating robot...
✓ Robot created: abc-123-def-456

Executing robot...
✓ Execution completed!

Results:
{
  "title": "A Light in the Attic",
  "price": "£51.77",
  "availability": "In stock"
}

Cleaning up...
✓ Robot deleted
```

## Troubleshooting

### Error: "API key is missing"
Make sure you've set the `MAXUN_API_KEY` environment variable:
```bash
export MAXUN_API_KEY="your_api_key"
```

### Error: "Cannot POST /api/sdk/robots"
Make sure:
1. Your backend server is running on port 5001
2. The SDK routes are loaded (`api/sdk.ts` should be registered)

### Error: "Failed to execute robot"
Check the backend logs for detailed error information:
```bash
# In maxun-cloud-recording folder
npm run dev
```

## Next Steps

After running these examples, you can:
1. Modify the selectors to extract different data
2. Try different websites
3. Experiment with pagination settings
4. Add scheduling or webhooks (see SDK documentation)

## Getting Your API Key

To get your API key:
1. Log into Maxun
2. Go to Settings → API Keys
3. Generate a new API key
4. Copy and export it as shown above
