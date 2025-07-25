import { test, expect } from '@playwright/test';

test('Test specific token price fetch', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForTimeout(2000);
  
  // Find BOB token and click its Get Price button
  const bobRow = page.locator('tr').filter({ hasText: 'BOB' }).first();
  const getPriceBtn = bobRow.locator('button', { hasText: 'Get Price' });
  
  if (await getPriceBtn.isVisible()) {
    console.log('Found BOB token Get Price button');
    
    // Add request listener to catch API calls
    const apiPromise = page.waitForResponse(response => 
      response.url().includes('/api/token-price') && response.status() === 200
    );
    
    await getPriceBtn.click();
    
    const response = await apiPromise;
    const responseData = await response.json();
    
    console.log('API Response for BOB:', JSON.stringify(responseData, null, 2));
    
    // Wait a bit more for UI update
    await page.waitForTimeout(5000);
    
    // Check the updated row content
    const updatedContent = await bobRow.textContent();
    console.log('Updated row content:', updatedContent);
    
    // Take a screenshot
    await page.screenshot({ path: 'bob-token-prices.png' });
  } else {
    console.log('BOB token Get Price button not found');
    
    // Check if BOB already has prices
    const bobContent = await bobRow.textContent();
    console.log('BOB row content:', bobContent);
    
    // Try to extract the contract address from the API call
    const response = await page.evaluate(async () => {
      // Get the first row with raw_data
      const rows = document.querySelectorAll('tr');
      for (const row of rows) {
        if (row.textContent?.includes('BOB')) {
          // The contract address might be in a data attribute or hidden element
          return row.textContent;
        }
      }
      return null;
    });
    
    console.log('Found BOB data:', response);
  }
});