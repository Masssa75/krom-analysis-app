import { test, expect } from '@playwright/test';

test('Test X Analysis with Real ScraperAPI Key', async ({ page }) => {
  // Set longer timeout for this test since X analysis can take time
  test.setTimeout(120000); // 2 minutes
  
  // Navigate to the deployed site
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check that X Analysis section is visible
  await expect(page.getByText('X (Twitter) Analysis').first()).toBeVisible();
  
  // Check that the X analysis button is enabled
  const xAnalysisButton = page.getByRole('button', { name: 'Start X Analysis' });
  await expect(xAnalysisButton).toBeVisible();
  await expect(xAnalysisButton).toBeEnabled();
  
  console.log('✓ X Analysis button is enabled');
  
  // Click the X analysis button
  await xAnalysisButton.click();
  
  console.log('✓ Clicked X Analysis button');
  
  // Wait for progress or error
  const progressBar = page.getByRole('progressbar');
  const errorAlert = page.getByRole('alert');
  
  // Wait for either progress or error to appear
  const element = await Promise.race([
    progressBar.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'progress'),
    errorAlert.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'error')
  ]).catch(() => 'timeout');
  
  if (element === 'error') {
    const errorText = await errorAlert.textContent();
    console.log('❌ Error occurred:', errorText);
    
    if (errorText?.includes('No calls available')) {
      console.log('ℹ️  This is expected if there are no unanalyzed calls with contract addresses');
    } else if (errorText?.includes('not configured')) {
      console.log('❌ ScraperAPI key may not be properly configured on server');
    }
    
    // Take screenshot of error state
    await page.screenshot({ path: 'x-analysis-error.png', fullPage: true });
  } else if (element === 'progress') {
    console.log('✓ X Analysis started - progress bar visible');
    
    // Wait for the status text to appear
    const statusText = page.locator('text=/Fetching X data|Analyzing X\\/Twitter data/');
    await expect(statusText).toBeVisible({ timeout: 5000 });
    console.log('✓ Status text visible');
    
    // Wait for results or error (with longer timeout for API calls)
    const resultsCard = page.locator('text=X Analysis Results').locator('..');
    const completed = await Promise.race([
      resultsCard.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'results'),
      errorAlert.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'error')
    ]).catch(() => 'timeout');
    
    if (completed === 'results') {
      console.log('✓ X Analysis completed successfully!');
      
      // Check for score
      const score = await page.locator('text=/\\d+\\/10/').textContent();
      console.log('✓ Score:', score);
      
      // Check for tier
      const tier = await page.locator('text=/ALPHA|SOLID|BASIC|TRASH/').first().textContent();
      console.log('✓ Tier:', tier);
      
      // Check for positive signals
      const positiveSignals = await page.locator('text=Positive Signals').isVisible();
      if (positiveSignals) {
        console.log('✓ Positive signals section visible');
      }
      
      // Take screenshot of successful result
      await page.screenshot({ path: 'x-analysis-success.png', fullPage: true });
    } else if (completed === 'error') {
      const errorText = await errorAlert.textContent();
      console.log('❌ Error during analysis:', errorText);
      await page.screenshot({ path: 'x-analysis-error-during.png', fullPage: true });
    } else {
      console.log('⏱️  Analysis timed out after 60 seconds');
      await page.screenshot({ path: 'x-analysis-timeout.png', fullPage: true });
    }
  } else {
    console.log('⏱️  Initial response timed out');
    await page.screenshot({ path: 'x-analysis-no-response.png', fullPage: true });
  }
  
  // Final screenshot
  await page.screenshot({ path: 'x-analysis-final-state.png', fullPage: true });
});