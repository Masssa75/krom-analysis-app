import { test, expect } from '@playwright/test';

test('Test X Batch Analysis - Complete Flow', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes for batch processing
  
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Click X Analysis button
  const xButton = page.getByRole('button', { name: 'Start X Analysis' });
  await expect(xButton).toBeVisible();
  await expect(xButton).toBeEnabled();
  
  console.log('Starting X batch analysis...');
  await xButton.click();
  
  // Wait for completion - look for either results or error
  const resultOrError = await Promise.race([
    page.locator('text=X Batch Analysis Results').waitFor({ state: 'visible', timeout: 120000 }).then(() => 'results'),
    page.getByRole('alert').waitFor({ state: 'visible', timeout: 120000 }).then(() => 'error'),
    page.waitForTimeout(120000).then(() => 'timeout')
  ]);
  
  if (resultOrError === 'results') {
    console.log('✅ X Batch Analysis completed successfully!');
    
    // Get the analyzed count
    const description = await page.locator('text=/Analyzed \\d+ calls/').textContent();
    console.log('📊 ' + description);
    
    // Check if table has results
    const rows = await page.locator('tbody tr').count();
    console.log(`📋 Found ${rows} analyzed tokens in results table`);
    
    // Get detailed results for first 5 tokens
    console.log('\n🔍 Detailed Results:');
    for (let i = 0; i < Math.min(5, rows); i++) {
      const row = page.locator('tbody tr').nth(i);
      const token = await row.locator('td').nth(0).textContent();
      const score = await row.locator('td').nth(1).textContent();
      const tier = await row.locator('td').nth(2).textContent();
      const legitimacy = await row.locator('td').nth(3).textContent();
      const tweets = await row.locator('td').nth(4).textContent();
      
      console.log(`  ${i+1}. ${token}: Score ${score}, Tier: ${tier?.trim()}, Legitimacy: ${legitimacy}, Tweets analyzed: ${tweets}`);
    }
    
    // Check batch metadata
    const batchInfo = await page.locator('text=/Batch ID:/').textContent();
    const durationInfo = await page.locator('text=/Duration:/').textContent();
    console.log('\n📦 Batch Info:');
    console.log('  ' + batchInfo);
    console.log('  ' + durationInfo);
    
    // Check for any errors
    const errorSection = await page.locator('text=Errors:').isVisible();
    if (errorSection) {
      const errorCount = await page.locator('text=Errors:').locator('..').locator('li').count();
      console.log(`\n⚠️  Found ${errorCount} errors during batch processing`);
    }
    
  } else if (resultOrError === 'error') {
    const errorText = await page.getByRole('alert').textContent();
    console.log('❌ Error occurred:', errorText);
    
    if (errorText?.includes('No calls found')) {
      console.log('ℹ️  This means all calls have already been X analyzed with the new scoring system');
    }
    
  } else {
    console.log('⏱️  Analysis timed out after 2 minutes');
    
    // Check current status
    const statusText = await page.locator('text=/Starting batch X analysis|Analyzed \\d+ calls/').textContent().catch(() => null);
    if (statusText) {
      console.log('Current status:', statusText);
    }
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'x-batch-final-result.png', fullPage: true });
  
  // Log previously analyzed calls info
  const previouslyAnalyzed = await page.locator('text=/\\d+ total calls analyzed/').textContent().catch(() => null);
  if (previouslyAnalyzed) {
    console.log('\n📈 Database Status:', previouslyAnalyzed);
  }
});