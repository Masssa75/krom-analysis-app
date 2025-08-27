import { test, expect } from '@playwright/test';

test('Check Stage 2 display for UIUI token', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:3001');
  
  // Wait for the page to load
  await page.waitForSelector('h1:has-text("KROM")', { timeout: 10000 });
  
  // Click search button first
  await page.locator('button[aria-label="Search"]').click();
  
  // Now search for UIUI
  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.fill('UIUI');
  
  // Wait for results to load
  await page.waitForTimeout(2000);
  
  // Check what's visible in the table
  const tokenRow = page.locator('div:has-text("UIUI")').first();
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'uiui-search.png', fullPage: true });
  
  // Check if S2 score is visible
  const s2Score = await page.locator('span:has-text("S2")').count();
  console.log('S2 score labels found:', s2Score);
  
  // Check if W2 badge is visible
  const w2Badge = await page.locator('span:has-text("W2:")').count();
  console.log('W2 badges found:', w2Badge);
  
  // Get all text content from the first row
  const rowText = await tokenRow.textContent();
  console.log('First row text:', rowText);
  
  // Check the API response directly
  const apiResponse = await page.evaluate(async () => {
    const response = await fetch('/api/recent-calls?search=UIUI&limit=5');
    const data = await response.json();
    return data.data[0];
  });
  
  console.log('API Response for UIUI:');
  console.log('- ticker:', apiResponse?.ticker);
  console.log('- stage2_score:', apiResponse?.stage2_score);
  console.log('- stage2_analysis:', apiResponse?.stage2_analysis ? 'Present' : 'Missing');
  
  // Check if the Stage 2 column visibility is enabled
  const columnSettings = await page.evaluate(() => {
    return localStorage.getItem('kromFilterSections');
  });
  console.log('Column settings:', columnSettings);
});

test('Check Stage 2 display for AINU token', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.waitForSelector('h1:has-text("KROM")', { timeout: 10000 });
  
  // Click search button first
  await page.locator('button[aria-label="Search"]').click();
  
  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.fill('AINU');
  
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'ainu-search.png', fullPage: true });
  
  const apiResponse = await page.evaluate(async () => {
    const response = await fetch('/api/recent-calls?search=AINU&limit=5');
    const data = await response.json();
    return data.data[0];
  });
  
  console.log('API Response for AINU:');
  console.log('- ticker:', apiResponse?.ticker);
  console.log('- stage2_score:', apiResponse?.stage2_score);
  console.log('- stage2_analysis verdict:', apiResponse?.stage2_analysis?.verdict);
});