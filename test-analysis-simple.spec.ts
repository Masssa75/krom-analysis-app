import { test, expect } from '@playwright/test';

test.use({
  // Keep browser open longer
  timeout: 60000,
});

test('Test KROM Analysis Tool - Simplified', async ({ page }) => {
  // Navigate to the deployed app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the page to load
  await expect(page.getByText('KROM Historical Analysis Tool')).toBeVisible();
  
  // Set count to 2 for faster testing
  const countInput = page.getByRole('spinbutton');
  await countInput.clear();
  await countInput.fill('2');
  
  // Click the Start Analysis button
  const startButton = page.getByRole('button', { name: 'Start Analysis' });
  console.log('Clicking Start Analysis button...');
  await startButton.click();
  
  // Wait for the progress indicator
  await expect(page.getByText('Connecting to database...')).toBeVisible();
  console.log('Analysis started, waiting for results...');
  
  // Wait longer for results or error
  await page.waitForTimeout(5000);
  
  // Check what's on the page
  const pageContent = await page.content();
  
  // Check for error
  const hasError = pageContent.includes('Error:');
  const hasResults = pageContent.includes('Analysis Results');
  
  if (hasError) {
    console.log('Error detected on page');
    // Find error text
    const errorText = await page.locator('text=Error:').textContent().catch(() => 'Could not get error text');
    console.log('Error message:', errorText);
    
    // Try to find the detailed error
    const alertBox = await page.locator('[role="alert"]').textContent().catch(() => '');
    console.log('Alert content:', alertBox);
  } else if (hasResults) {
    console.log('SUCCESS! Analysis completed');
    // Wait to see results
    await expect(page.getByText('Analysis Results')).toBeVisible();
    
    // Count results
    const rows = await page.locator('tbody tr').count();
    console.log(`Found ${rows} analyzed calls`);
  } else {
    console.log('Neither error nor results found');
    console.log('Page title:', await page.title());
  }
  
  // Take screenshot
  await page.screenshot({ path: 'final-state.png', fullPage: true });
  
  // Keep browser open to observe
  await page.waitForTimeout(5000);
});