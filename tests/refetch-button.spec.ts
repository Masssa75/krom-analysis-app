import { test, expect } from '@playwright/test';

test('refetch button shows for N/A priced tokens', async ({ page }) => {
  // Go to the deployed site
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the page to load
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Look for rows with N/A price
  const rowsWithNA = await page.locator('tr').filter({
    hasText: 'N/A'
  }).all();
  
  console.log(`Found ${rowsWithNA.length} rows with N/A price`);
  
  // Check at least one row for refetch button
  if (rowsWithNA.length > 0) {
    const firstNARow = rowsWithNA[0];
    
    // Check if this row has a refetch button
    const refetchButton = firstNARow.locator('button:has-text("Refetch"), button:has-text("Get Price")');
    await expect(refetchButton).toBeVisible();
    
    console.log('✅ Refetch/Get Price button is visible for N/A priced token');
  } else {
    console.log('⚠️  No N/A priced tokens found on first page');
  }
});

test('verify N/A price display structure', async ({ page }) => {
  // Go to the deployed site
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the page to load
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Look for the price column with N/A
  const priceCell = await page.locator('td').filter({
    hasText: /^N\/A$/
  }).first();
  
  if (await priceCell.count() > 0) {
    // Check the structure - should have N/A text and a button
    const parent = priceCell.locator('..');
    const button = parent.locator('button').filter({
      hasText: /Refetch|Get Price/
    });
    
    await expect(button).toBeVisible();
    console.log('✅ Found button near N/A price display');
    
    // Check button has correct icon
    const hasIcon = await button.locator('svg').count() > 0;
    expect(hasIcon).toBeTruthy();
    console.log('✅ Button has icon');
  }
});