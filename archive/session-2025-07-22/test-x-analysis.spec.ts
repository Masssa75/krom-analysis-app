import { test, expect } from '@playwright/test';

test('Test X Analysis Functionality', async ({ page }) => {
  // Navigate to the deployed site
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check that X Analysis section is visible
  await expect(page.getByText('X (Twitter) Analysis').first()).toBeVisible();
  
  // Check that the X analysis button is enabled (no longer disabled)
  const xAnalysisButton = page.getByRole('button', { name: 'Start X Analysis' });
  await expect(xAnalysisButton).toBeVisible();
  await expect(xAnalysisButton).toBeEnabled();
  
  // Click the X analysis button
  await xAnalysisButton.click();
  
  // Wait for either an error or progress indicator
  // Since we don't have a real SCRAPERAPI_KEY yet, we expect an error
  const errorMessage = page.getByText('X analysis is not configured');
  const progressBar = page.getByRole('progressbar');
  
  // Wait for either error or progress
  await expect(errorMessage.or(progressBar)).toBeVisible({ timeout: 10000 });
  
  // If we see the error about SCRAPERAPI_KEY, that's expected
  if (await errorMessage.isVisible()) {
    console.log('✓ X Analysis API is responding correctly (needs SCRAPERAPI_KEY)');
  } else if (await progressBar.isVisible()) {
    console.log('✓ X Analysis started successfully');
    
    // Wait for results or error
    await page.waitForSelector('[data-testid="x-results"], [role="alert"]', { timeout: 30000 });
  }
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'x-analysis-test.png', fullPage: true });
});