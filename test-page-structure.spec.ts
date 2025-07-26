import { test } from '@playwright/test';

test('analyze page structure', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Get first row HTML
  const firstRow = page.locator('tbody tr').first();
  const rowHTML = await firstRow.innerHTML();
  console.log('First row HTML (truncated):', rowHTML.substring(0, 500) + '...');
  
  // Count all buttons on page
  const allButtons = await page.locator('button').all();
  console.log(`\nTotal buttons on page: ${allButtons.length}`);
  
  // List first 10 button texts
  for (let i = 0; i < Math.min(10, allButtons.length); i++) {
    const btnText = await allButtons[i].textContent();
    console.log(`Button ${i + 1}: "${btnText}"`);
  }
  
  // Check for price-related elements
  const priceElements = await page.locator('text=/Entry:|Now:|ATH:|Fetch/').all();
  console.log(`\nPrice-related elements: ${priceElements.length}`);
  
  for (let i = 0; i < Math.min(5, priceElements.length); i++) {
    const text = await priceElements[i].textContent();
    console.log(`Price element ${i + 1}: "${text}"`);
  }
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'krom-app-debug.png' });
  console.log('\nScreenshot saved as krom-app-debug.png');
});