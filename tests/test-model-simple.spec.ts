import { test, expect } from '@playwright/test';

test('check model display issue', async ({ page }) => {
  // Go to the analysis page
  await page.goto('https://lively-torrone-8199e0.netlify.app/analysis');
  
  // Wait longer for page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot to see what's happening
  await page.screenshot({ path: 'page-load-debug.png', fullPage: true });
  
  // Check if there's an error or loading state
  const bodyText = await page.locator('body').textContent();
  console.log('Page body contains:', bodyText?.substring(0, 500));
  
  // Check if table exists
  const tableExists = await page.locator('table').count();
  console.log('Table count:', tableExists);
  
  if (tableExists > 0) {
    // Get the first few rows of data
    const rows = await page.locator('tbody tr').count();
    console.log('Number of rows:', rows);
    
    if (rows > 0) {
      // Look for INUMINATI token specifically from the screenshot
      const inuminatiRow = page.locator('tr:has-text("INUMINATI")');
      if (await inuminatiRow.count() > 0) {
        console.log('Found INUMINATI row');
        
        // Click the Details button for X Analysis (should be the last Details button in the row)
        const detailsButtons = inuminatiRow.locator('button:has-text("Details")');
        const xDetailsButton = detailsButtons.last();
        await xDetailsButton.click();
        
        // Wait for panel to open
        await page.waitForTimeout(2000);
        
        // Take screenshot of the panel
        await page.screenshot({ path: 'panel-debug.png', fullPage: true });
        
        // Look for the model field
        const modelText = await page.locator('text=Model:').locator('..').textContent();
        console.log('Model section text:', modelText);
        
        // Try to find the specific model value
        const modelValue = await page.locator('span:right-of(:text("Model:"))').first().textContent();
        console.log('Model value:', modelValue);
      }
    }
  }
});