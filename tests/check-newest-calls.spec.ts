import { test, expect } from '@playwright/test';

test('check newest calls in UI', async ({ page }) => {
  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the table to load
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Get all rows in the table body
  const rows = await page.locator('tbody tr').all();
  
  console.log(`Found ${rows.length} rows in the UI`);
  
  // Get the first 5 rows' data
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const ticker = await rows[i].locator('td:nth-child(3)').textContent();
    const createdAt = await rows[i].locator('td:nth-child(11)').textContent();
    console.log(`Row ${i + 1}: ${ticker} - Created: ${createdAt}`);
  }
  
  // Check if BRAINLET (newest) is in the first row
  if (rows.length > 0) {
    const firstRowTicker = await rows[0].locator('td:nth-child(3)').textContent();
    console.log(`First row ticker: ${firstRowTicker}`);
  }
});