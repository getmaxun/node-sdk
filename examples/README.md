# Maxun SDK Examples

This folder contains comprehensive examples demonstrating all features of the Maxun SDKs.

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

## Examples Overview

### Basic Examples

#### 1. Basic Extraction
Extracts structured data from a single page:
```bash
npx tsx examples/basic-extraction.ts
```

**What it does:**
- Creates a robot to extract specific fields using CSS selectors
- Executes the robot
- Displays the extracted data
- Demonstrates the simplest extraction workflow

#### 2. Simple Scraping
The simplest possible page scraping - just URL and format:
```bash
npx tsx examples/simple-scrape.ts
```

**What it does:**
- Creates a scrape robot with just a URL
- Specifies output format(s): markdown and/or HTML
- No workflow needed - metadata-only robot
- Automatically scrapes entire page content

#### 3. Form Fill & Screenshot
Demonstrates form filling with automatic input type detection:
```bash
npx tsx examples/form-fill-screenshot.ts
```

**What it does:**
- Navigates to a form page
- Fills various input fields (text, number, password, date)
- Automatically detects input types
- Values are securely encrypted during storage
- Takes screenshots (full-page and viewport)

#### 4. Chained Extraction
Multi-page workflows with navigation:
```bash
npx tsx examples/chained-extract.ts
```

**What it does:**
- Demonstrates complex workflows with multiple navigation steps
- Shows how to chain actions together
- Extracts data from different pages in sequence

### Advanced Features

#### 5. List Pagination
Different pagination strategies for extracting lists:
```bash
npx tsx examples/list-pagination.ts
```

**What it does:**
- Auto-detect pagination (recommended)
- Infinite scroll pagination
- Click "Next" button pagination
- Click "Load More" button pagination
- Limit extraction to specific number of items

#### 6. Smart List Extraction
Extract lists with specific fields and pagination:
```bash
npx tsx examples/llm-extraction.ts
```

**What it does:**
- Extracts lists with automatic pagination
- Demonstrates field extraction from list items
- Shows max items limiting
- Clean list extraction example

### Robot Management

#### 7. Robot Management
List, get, update, and delete robots:
```bash
npx tsx examples/robot-management.ts
```

**What it does:**
- Create multiple robots
- List all robots
- Get specific robot by ID
- Update robot metadata and workflow
- Get all runs and execution history
- Get specific run by ID
- Delete robots

#### 8. Scheduling
Schedule robots for periodic execution:
```bash
npx tsx examples/scheduling.ts
```

**What it does:**
- Schedule robots with simple intervals (every N minutes/hours/days/weeks/months)
- Schedule with detailed options (business hours, specific days, time ranges)
- Specify timezone for accurate scheduling
- Get current schedule information
- Update existing schedules
- Remove schedules
- Examples include: hourly, business hours only, weekly, monthly, and per-minute schedules

#### 9. Webhooks
Set up webhooks for robot events:
```bash
npx tsx examples/webhooks.ts
```

**What it does:**
- Add webhooks for run completion/failure events
- Configure custom headers
- List all webhooks
- Remove webhooks

### Complete Example

#### 10. Complete Workflow
Real-world use case combining multiple features:
```bash
npx tsx examples/complete-workflow.ts
```

**What it does:**
- Creates comprehensive extraction robot
- Sets up pagination
- Configures webhooks
- Schedules periodic execution
- Demonstrates full production workflow

## Example Output

### Basic Extraction
```
=== Basic Extraction Example ===

Creating robot...
✓ Robot created: robot_1234567890_abc123

Executing robot...
✓ Execution completed!

Results:
{
  "title": "A Light in the Attic",
  "price": "£51.77",
  "availability": "In stock"
}
```

### Robot Management
```
=== Robot Management Example ===

Creating robots...
✓ Created robot 1: robot_abc123
✓ Created robot 2: robot_xyz789

Fetching all extract robots...
✓ Found 2 extract robots:
  1. Books Extractor (robot_abc123)
  2. Product Details (robot_xyz789)

Running robot...
✓ Execution completed!
  Status: success
  Run ID: run_123
  Items extracted: 20
```

### Scheduling
```
=== Robot Scheduling Example ===

Scheduling robot to run every 6 hours...
✓ Robot scheduled successfully!

Current schedule:
  Run every: 6 HOURS
  Timezone: America/New_York

Updating schedule to run daily...
✓ Schedule updated!
```

## Key Features Demonstrated

### Extract SDK
- **List extraction with pagination**: Auto-detect or specify pagination type
- **Input type detection**: Automatic detection for form fields
- **Secure encryption**: Values automatically encrypted during storage
- **Workflow building**: Chain multiple actions (navigate, type, click, extract, screenshot)
- **Field extraction**: Extract specific fields using CSS selectors

### Scrape SDK
- **Simplest API**: Just URL and format - no workflow needed
- **Multiple formats**: Get markdown, HTML, or both
- **Quick scraping**: Perfect for simple page content extraction

### Robot Management
- **Full CRUD operations**: Create, read, update, delete robots
- **Execution history**: Get all runs, specific runs, latest run
- **Metadata updates**: Change robot names and configurations

### Scheduling
- **Flexible intervals**: Minutes, hours, days, weeks, months
- **Timezone support**: Run in any timezone
- **Easy management**: Schedule, update, and unschedule

### Webhooks
- **Event notifications**: Get notified on run completion/failure
- **Custom headers**: Add authentication and custom headers
- **Multiple webhooks**: Support for multiple webhook endpoints

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

### Error: "Connection refused"
Make sure:
1. Backend is running: `npm run dev` in maxun-cloud-recording
2. Database is running and accessible
3. Environment variables are set correctly

## Next Steps

After running these examples, you can:
1. Modify the selectors to extract different data
2. Try different websites and extraction patterns
3. Set up production schedules and webhooks
4. Build custom workflows combining multiple features
5. Integrate Maxun into your applications

## Note on Integrations

Google Sheets and Airtable integrations require OAuth authentication which must be set up through the Maxun web platform. Once configured via the UI, your robots will automatically send results to the configured integrations. The SDK does not currently support setting up integrations programmatically.

## Getting Your API Key

To get your API key:
1. Log into Maxun dashboard
2. Go to Settings → API Keys
3. Generate a new API key
4. Copy and export it as shown above

## SDK Documentation

For full SDK documentation, see:
- [Core SDK Docs](../packages/core/README.md)
- [Extract SDK Docs](../packages/extract/README.md)
- [Scrape SDK Docs](../packages/scrape/README.md)
