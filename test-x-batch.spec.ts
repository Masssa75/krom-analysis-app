import { test, expect } from '@playwright/test';

test('Test X Batch Analysis', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Click X Analysis button
  const xButton = page.getByRole('button', { name: 'Start X Analysis' });
  await expect(xButton).toBeVisible();
  await expect(xButton).toBeEnabled();
  
  console.log('Starting X batch analysis...');
  await xButton.click();
  
  // Wait for progress or results
  await page.waitForTimeout(3000);
  
  // Check for results or error
  const resultsCard = await page.locator('text=X Batch Analysis Results').isVisible();
  const errorAlert = await page.getByRole('alert').textContent().catch(() => null);
  
  if (resultsCard) {
    console.log('✓ X Batch Analysis completed!');
    
    // Get the analyzed count
    const description = await page.locator('text=/Analyzed \\d+ calls/').textContent();
    console.log('Results:', description);
    
    // Check if table has results
    const rows = await page.locator('tbody tr').count();
    console.log(`Found ${rows} analyzed tokens`);
    
    // Get first few results
    for (let i = 0; i < Math.min(3, rows); i++) {
      const row = page.locator('tbody tr').nth(i);
      const token = await row.locator('td').nth(0).textContent();
      const score = await row.locator('td').nth(1).textContent();
      const tier = await row.locator('td').nth(2).textContent();
      const legitimacy = await row.locator('td').nth(3).textContent();
      const tweets = await row.locator('td').nth(4).textContent();
      
      console.log(`${token}: Score ${score}, ${tier?.trim()}, Legitimacy: ${legitimacy}, Tweets: ${tweets}`);
    }
    
    // Check batch info
    const batchInfo = await page.locator('text=/Batch ID:/').textContent();
    console.log(batchInfo);
    
  } else if (errorAlert) {
    console.log('Error:', errorAlert);
  } else {
    console.log('No results or error found after 3 seconds');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'x-batch-analysis-result.png', fullPage: true });
});