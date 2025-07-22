import { test, expect } from '@playwright/test';

test('Debug X Analysis API', async ({ page }) => {
  test.setTimeout(60000);
  
  // Test the API directly first
  console.log('Testing X batch API directly...');
  
  const apiResponse = await fetch('https://lively-torrone-8199e0.netlify.app/api/x-batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: 2,  // Just analyze 2 for testing
      model: 'claude-3-haiku-20240307'
    })
  });
  
  const apiResult = await apiResponse.json();
  console.log('API Response Status:', apiResponse.status);
  console.log('API Result:', JSON.stringify(apiResult, null, 2));
  
  // Now test through the UI
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Set count to 2
  const countInput = page.locator('#x-count');
  await countInput.clear();
  await countInput.fill('2');
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });
  
  // Click X Analysis button
  const xButton = page.getByRole('button', { name: 'Start X Analysis' });
  await xButton.click();
  
  // Wait and observe
  await page.waitForTimeout(10000);
  
  // Check for any visible text
  const pageText = await page.locator('body').textContent();
  if (pageText?.includes('Error') || pageText?.includes('error')) {
    console.log('Found error text on page');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'x-debug.png', fullPage: true });
});