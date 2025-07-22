import { test, expect } from '@playwright/test';

test('Simple X Analysis Test', async ({ page }) => {
  test.setTimeout(60000);
  
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Click X Analysis button
  const xButton = page.getByRole('button', { name: 'Start X Analysis' });
  await xButton.click();
  
  // Wait 10 seconds and take screenshot
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'x-analysis-state.png', fullPage: true });
  
  // Log what we see
  const errorText = await page.getByRole('alert').textContent().catch(() => null);
  if (errorText) {
    console.log('Error found:', errorText);
  }
  
  const resultsVisible = await page.locator('text=X Analysis Results').isVisible().catch(() => false);
  if (resultsVisible) {
    console.log('Results found!');
    const score = await page.locator('text=/\\d+\\/10/').textContent().catch(() => 'No score');
    console.log('Score:', score);
  }
});