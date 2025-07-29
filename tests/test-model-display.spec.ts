import { test, expect } from '@playwright/test';

test('investigate X analysis model display', async ({ page }) => {
  // Go to the analysis page
  await page.goto('https://lively-torrone-8199e0.netlify.app/analysis');
  
  // Wait for page to load
  await page.waitForSelector('table');
  
  // Look for a token with X analysis (has both scores)
  const tokenRow = page.locator('tr').filter({ 
    has: page.locator('td').filter({ hasText: /\d+\/10/ }).nth(1) // Second score column (X analysis)
  }).first();
  
  // Click the X Analysis Details button  
  await tokenRow.locator('button:has-text("Details")').last().click();
  
  // Wait for the detail panel to open
  await page.waitForSelector('[data-testid="analysis-detail-panel"], .fixed.right-0');
  
  // Check if X Analysis tab is visible and click it
  const xAnalysisTab = page.locator('text=X Analysis');
  if (await xAnalysisTab.isVisible()) {
    await xAnalysisTab.click();
  }
  
  // Wait a moment for content to load
  await page.waitForTimeout(1000);
  
  // Find the Technical Details section
  const technicalDetails = page.locator('text=Technical Details').locator('..').locator('..');
  
  // Look for the Model field
  const modelField = technicalDetails.locator('text=Model:').locator('..');
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'model-display-debug.png', fullPage: true });
  
  // Get the model value
  const modelValue = await modelField.locator('span.font-mono').textContent();
  console.log('Model displayed:', modelValue);
  
  // Check what data is available in the panel
  const panelContent = await page.locator('.fixed.right-0').textContent();
  console.log('Panel content contains "moonshotai":', panelContent.includes('moonshotai'));
  console.log('Panel content contains "kimi":', panelContent.includes('kimi'));
  console.log('Panel content contains "Unknown":', panelContent.includes('Unknown'));
  
  // Let's also check the network requests to see what data is being fetched
  page.on('response', response => {
    if (response.url().includes('/api/analyzed')) {
      console.log('API Response URL:', response.url());
    }
  });
  
  // Refresh to see network requests
  await page.reload();
  await page.waitForSelector('table');
  
  // Let's inspect the first few rows to see what models are in the data
  const firstFewRows = await page.locator('tbody tr').first().evaluate(row => {
    return Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim());
  });
  
  console.log('First row data:', firstFewRows);
});