import { test, expect } from '@playwright/test';

test('Test KROM Analysis Tool', async ({ page }) => {
  // Navigate to the deployed app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the page to load
  await expect(page.getByText('KROM Historical Analysis Tool')).toBeVisible();
  
  // Check that the form is visible
  await expect(page.getByText('Number of calls to analyze')).toBeVisible();
  
  // The input should have default value of 5
  const countInput = page.getByRole('spinbutton');
  await expect(countInput).toHaveValue('5');
  
  // Clear and set to 3 for faster testing
  await countInput.clear();
  await countInput.fill('3');
  
  // Check the AI model dropdown
  const modelSelect = page.getByRole('combobox');
  await expect(modelSelect).toBeVisible();
  
  // Click to open dropdown
  await modelSelect.click();
  
  // Wait a moment to see the dropdown options
  await page.waitForTimeout(1000);
  
  // Select Claude Haiku (should be default) - click the option in the dropdown
  await page.getByRole('option', { name: 'Claude 3 Haiku (Fast)' }).click();
  
  // Click the Start Analysis button
  const startButton = page.getByRole('button', { name: 'Start Analysis' });
  await expect(startButton).toBeEnabled();
  
  console.log('Clicking Start Analysis button...');
  await startButton.click();
  
  // Wait for the analysis to start
  await expect(page.getByText('Connecting to database...')).toBeVisible();
  
  // Wait for either success or error
  await page.waitForSelector('.border-b', { timeout: 30000 }).catch(() => {
    console.log('No results found, checking for error...');
  });
  
  // Check if there's an error message
  const errorElement = page.locator('[role="alert"]');
  if (await errorElement.isVisible()) {
    const errorText = await errorElement.textContent();
    console.log('Error occurred:', errorText);
    
    // Also check for any error details
    const errorDetails = await page.locator('text=Error:').textContent().catch(() => '');
    console.log('Full error details:', errorDetails);
    
    // Take a screenshot of the error
    await page.screenshot({ path: 'analysis-error.png', fullPage: true });
  } else {
    // If successful, check the results
    console.log('Analysis completed successfully!');
    
    // Check if results are visible
    await expect(page.getByText('Analysis Results')).toBeVisible();
    
    // Wait to see the results table
    await page.waitForTimeout(2000);
    
    // Take a screenshot of the results
    await page.screenshot({ path: 'analysis-results.png', fullPage: true });
  }
  
  // Keep browser open for a moment to observe
  await page.waitForTimeout(3000);
});