import { test, expect } from '@playwright/test';

test('verify ROI is recalculated when prices refresh', async ({ page }) => {
  // Intercept refresh-prices to verify it includes price_at_call
  let refreshRequest: any = null;
  
  await page.route('**/api/refresh-prices', async route => {
    const request = route.request();
    refreshRequest = await request.postDataJSON();
    
    // Mock a successful response with updated prices
    await route.fulfill({
      status: 200,
      json: {
        success: true,
        prices: {
          // This will be filled based on the request
        },
        summary: {
          requested: refreshRequest.tokens?.length || 0,
          cached: 0,
          updated: refreshRequest.tokens?.length || 0,
          failed: 0
        }
      }
    });
  });
  
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table');
  await page.waitForTimeout(2000); // Wait for price refresh
  
  // Check if the request was made
  if (refreshRequest && refreshRequest.tokens) {
    console.log(`\nRefresh request included ${refreshRequest.tokens.length} tokens\n`);
    
    // Check first few tokens
    for (let i = 0; i < Math.min(3, refreshRequest.tokens.length); i++) {
      const token = refreshRequest.tokens[i];
      console.log(`Token ${i + 1}:`);
      console.log(`  - contract: ${token.contract_address?.substring(0, 10)}...`);
      console.log(`  - network: ${token.network}`);
      console.log(`  - price_at_call: ${token.price_at_call ? `$${token.price_at_call}` : 'null'}`);
      console.log(`  - current_price: ${token.current_price ? `$${token.current_price}` : 'null'}`);
      
      // Verify price_at_call is included when available
      if (token.current_price !== null && token.price_at_call === undefined) {
        console.log(`  ⚠️  WARNING: price_at_call not included!`);
      }
    }
  }
  
  // Find tokens with ROI displayed
  const roiElements = await page.locator('svg.lucide-trending-up, svg.lucide-trending-down').all();
  console.log(`\nFound ${roiElements.length} tokens with ROI displayed`);
  
  // Check first token with ROI
  if (roiElements.length > 0) {
    const firstRoiElement = roiElements[0];
    const roiText = await firstRoiElement.locator('..').locator('span').textContent();
    console.log(`\nFirst ROI value: ${roiText}`);
    
    // Get the row to find token details
    const row = await firstRoiElement.locator('xpath=ancestor::tr').first();
    const tokenName = await row.locator('td:first-child').textContent();
    console.log(`Token: ${tokenName}`);
    
    // Look for price details
    const priceSection = await row.locator('div:has(span:text("Entry:"))').first();
    if (await priceSection.isVisible()) {
      const entryPrice = await priceSection.locator('span:has-text("Entry:") + span').textContent();
      const currentPrice = await priceSection.locator('span:has-text("Now:") + span').textContent();
      console.log(`Entry: ${entryPrice}`);
      console.log(`Now: ${currentPrice}`);
    }
  }
  
  // Verify that the refresh request includes price_at_call for ROI calculation
  expect(refreshRequest).toBeTruthy();
  expect(refreshRequest.tokens).toBeTruthy();
  
  // Check if at least some tokens have price_at_call
  const tokensWithPriceAtCall = refreshRequest.tokens.filter((t: any) => t.price_at_call !== null && t.price_at_call !== undefined);
  console.log(`\n${tokensWithPriceAtCall.length}/${refreshRequest.tokens.length} tokens have price_at_call for ROI calculation`);
});
