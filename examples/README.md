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
npx tsx examples/basic-extraction.ts
```

**What it does:**
- Creates a robot to extract specific fields using CSS selectors
- Executes the robot
- Displays the extracted data

### 2. Form Fill & Screenshot
Demonstrates form filling with automatic input type detection:
```bash
npx tsx examples/form-fill-screenshot.ts
```

**What it does:**
- Navigates to a form page
- Fills various input fields (text, number, password, date)
- **Automatically detects input types** - no need to specify them manually
- Values are securely encrypted during storage
- Takes full-page and viewport screenshots
- Demonstrates `waitForLoadState` is automatically added after type actions

### 3. Chained Extraction
Multi-page workflows with navigation:
```bash
npx tsx examples/chained-extract.ts
```

**What it does:**
- Demonstrates complex workflows with multiple navigation steps
- Shows how to chain actions together
- Extracts data from different pages in sequence

### 4. Simple Scraping
The simplest possible page scraping - just URL and format:
```bash
npx tsx examples/simple-scrape.ts
```

**What it does:**
- Creates a scrape robot with just a URL
- Specifies output format(s): `.asMarkdown()` and/or `.asHTML()`
- **No workflow needed** - metadata-only robot
- Automatically scrapes entire page content

## Example Output

### Extract SDK Output
```
=== Form Fill and Screenshot Example ===

✓ Robot created: robot_1234567890_abc123

Robot workflow:
  1. Navigate to contact form
  2-7. Type into various input fields (types auto-detected)
  8. Take full-page screenshot
  9. Scroll down
  10. Take viewport screenshot
  11. Extract form values

✓ Robot created successfully

Note: Input types (text, number, date, etc.) are automatically
detected during robot creation - no need to specify them!

Executing robot to verify inputs...
✓ Robot execution completed!
```

### Scrape SDK Output
```
=== Simple Scraping Example ===

Creating scraper...
✓ Robot created: robot_1234567890_xyz789

Executing scraper...
✓ Scraping completed!

Results:
{
  "markdown": "# Page Title\n\n...",
  "html": "<html>...</html>"
}
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

## Key Features Demonstrated

### Extract SDK
- **Automatic input type detection**: No need to specify field types (text, number, email, password, date, etc.)
- **Secure encryption**: Values are automatically encrypted during storage
- **Automatic stability**: `waitForLoadState` is inserted after type actions
- **Workflow building**: Chain multiple actions together (navigate, type, click, extract, screenshot)

### Scrape SDK
- **Simplest API**: Just URL and format - no workflow needed
- **Multiple formats**: Get markdown, HTML, or both
- **Metadata-only**: Creates robots without workflow arrays
- **Quick scraping**: Perfect for simple page content extraction

## Next Steps

After running these examples, you can:
1. Modify the selectors to extract different data
2. Try different websites
3. Experiment with form filling and screenshots (Extract SDK)
4. Try different output formats (Scrape SDK)
5. Add scheduling or webhooks (see SDK documentation)

## Getting Your API Key

To get your API key:
1. Log into Maxun
2. Go to Settings → API Keys
3. Generate a new API key
4. Copy and export it as shown above
