# KROM Analysis Price Fetching Scripts

These scripts automate the process of fetching prices for tokens in the KROM Analysis app.

## Scripts Available

### 1. fetch-all-prices.js
Basic script that navigates to page 5 and clicks all "Get Price" buttons.

```bash
node scripts/fetch-all-prices.js
```

### 2. fetch-prices-interactive.js
Interactive script that lets you choose which page to process and whether to run in background mode.

```bash
node scripts/fetch-prices-interactive.js
```

## How It Works

1. Opens the KROM Analysis app in a browser
2. Navigates to the specified page
3. Finds all "Get Price" buttons
4. Clicks each button with a 2.5-3 second delay (to respect API rate limits)
5. Shows progress in the console

## Notes

- Each price fetch takes about 2.5 seconds due to rate limiting
- Processing 20 items takes approximately 1 minute
- The browser window stays open for 10 seconds after completion to see results
- You can run in headless mode (background) for automated processing

## Customization

To change the target page in the basic script, edit line 38:
```javascript
const targetPage = 5; // Change this number
```

## Requirements

- Node.js installed
- Playwright already installed (part of the project dependencies)