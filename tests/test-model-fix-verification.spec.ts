import { test, expect } from '@playwright/test';

test('verify X analysis model fix', async ({ page }) => {
  // Test the API endpoint directly first
  const response = await page.request.get('https://lively-torrone-8199e0.netlify.app/api/analyzed?page=1&limit=5');
  const data = await response.json();
  
  console.log('API Response contains x_analysis_model:', data.results?.[0]?.x_analysis_model !== undefined);
  
  // Now test the UI
  await page.goto('https://lively-torrone-8199e0.netlify.app/analysis');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot to see current state
  await page.screenshot({ path: 'model-fix-verification.png', fullPage: true });
  
  // Look for any token with X analysis in the table
  const tableRows = page.locator('tbody tr');
  const rowCount = await tableRows.count();
  console.log(`Found ${rowCount} rows in table`);
  
  if (rowCount > 0) {
    // Find a row with X analysis (has score in second column)
    for (let i = 0; i < Math.min(10, rowCount); i++) {
      const row = tableRows.nth(i);
      const scoreColumns = row.locator('td').filter({ hasText: /\d+\/10/ });
      const scoreCount = await scoreColumns.count();
      
      if (scoreCount >= 2) {
        console.log(`Row ${i} has X analysis - clicking Details button`);
        
        // Click the second (X analysis) Details button
        const detailsButtons = row.locator('button:has-text("Details")');
        const xDetailsButton = detailsButtons.last();
        await xDetailsButton.click();
        
        // Wait for panel to open
        await page.waitForTimeout(2000);
        
        // Look for the model field in the Technical Details section
        const modelSection = page.locator('text=Technical Details').locator('..').locator('..');
        const modelText = await modelSection.textContent();
        
        console.log('Technical Details section contains:', modelText?.substring(0, 200));
        
        // Check if we see the actual model instead of "Unknown"
        const hasKimiModel = modelText?.includes('moonshotai/kimi-k2') || modelText?.includes('kimi-k2');
        const hasUnknownModel = modelText?.includes('Model: Unknown');
        
        console.log('Contains Kimi K2 model:', hasKimiModel);
        console.log('Contains Unknown model:', hasUnknownModel);
        
        // Take a screenshot of the panel
        await page.screenshot({ path: 'model-panel-verification.png', fullPage: true });
        
        break;
      }
    }
  }
});