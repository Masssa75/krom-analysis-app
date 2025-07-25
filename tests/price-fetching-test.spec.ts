import { test, expect } from '@playwright/test';

test('Test price fetching functionality', async ({ page }) => {
  // Go to the deployed app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for content to load
  await page.waitForTimeout(3000);
  
  // Find a row with "Get Price" button
  const getPriceButton = page.getByRole('button', { name: 'Get Price' }).first();
  const hasGetPriceButton = await getPriceButton.isVisible().catch(() => false);
  
  if (hasGetPriceButton) {
    console.log('Found Get Price button, clicking it...');
    
    // Get the row containing this button
    const row = getPriceButton.locator('xpath=ancestor::tr[1]');
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'before-price-fetch.png', fullPage: false });
    
    // Click the button
    await getPriceButton.click();
    
    // Wait for the price to load (up to 30 seconds)
    await page.waitForTimeout(10000);
    
    // Take screenshot after
    await page.screenshot({ path: 'after-price-fetch.png', fullPage: false });
    
    // Check if prices are displayed
    const priceText = await row.textContent();
    console.log('Row content after fetch:', priceText);
    
    // Look for Entry, Now, and ATH values
    const hasEntry = priceText?.includes('Entry:');
    const hasNow = priceText?.includes('Now:');
    const hasATH = priceText?.includes('ATH:');
    
    console.log('Has Entry:', hasEntry);
    console.log('Has Now:', hasNow);
    console.log('Has ATH:', hasATH);
    
    // Check if the values are different
    const entryMatch = priceText?.match(/Entry:\s*\$?([\d.,]+[KMB]?)/);
    const nowMatch = priceText?.match(/Now:\s*\$?([\d.,]+[KMB]?)/);
    const athMatch = priceText?.match(/ATH:\s*\$?([\d.,]+[KMB]?)/);
    
    console.log('Entry value:', entryMatch?.[1]);
    console.log('Now value:', nowMatch?.[1]);
    console.log('ATH value:', athMatch?.[1]);
    
    // Check if Entry and Now are different
    if (entryMatch?.[1] && nowMatch?.[1]) {
      const areDifferent = entryMatch[1] !== nowMatch[1];
      console.log('Entry and Now are different:', areDifferent);
      
      if (!areDifferent) {
        console.error('WARNING: Entry and Now prices are the same!');
      }
    }
  } else {
    console.log('No Get Price buttons found, checking existing price displays...');
    
    // Find rows with price data
    const firstRow = page.locator('tr').filter({ hasText: 'Entry:' }).first();
    const rowText = await firstRow.textContent();
    console.log('First row with prices:', rowText);
  }
  
  // Also test the Clear Prices button
  const clearPricesButton = page.getByRole('button', { name: 'Clear Prices' });
  const hasClearButton = await clearPricesButton.isVisible().catch(() => false);
  console.log('Clear Prices button visible:', hasClearButton);
});