import { test, expect } from '@playwright/test';

test('Test price API and market cap calculations', async ({ page }) => {
  // Test the API directly
  const response = await page.request.post('https://lively-torrone-8199e0.netlify.app/api/token-price', {
    data: {
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
      callTimestamp: Date.now() - 86400000, // 1 day ago
      network: "eth"
    }
  });
  
  const data = await response.json();
  console.log('USDC test response:', JSON.stringify(data, null, 2));
  
  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for table
  await page.waitForSelector('table', { timeout: 10000 });
  
  // Find all market cap displays
  const marketCaps = await page.locator('text=/Entry:.*\\$/').allTextContents();
  console.log('\nFound market caps:', marketCaps.slice(0, 5));
  
  // Check for unrealistic values
  marketCaps.forEach((mc, index) => {
    if (mc.includes('B') && !mc.includes('USDC') && !mc.includes('USDT')) {
      console.log(`⚠️  Suspicious market cap at index ${index}: ${mc}`);
    }
  });
  
  // Get a specific row's data
  const firstRow = page.locator('tbody tr').first();
  const ticker = await firstRow.locator('td').first().textContent();
  console.log('\nFirst token:', ticker);
  
  // Check the raw data in the DOM
  const priceData = await page.evaluate(() => {
    // Try to access React props or data attributes
    const priceDisplay = document.querySelector('[class*="price-display"]');
    return priceDisplay?.textContent || 'No price display found';
  });
  console.log('Price display content:', priceData);
});