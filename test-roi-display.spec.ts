import { test, expect } from '@playwright/test';

test('verify ROI is now displayed for most tokens', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table');
  await page.waitForTimeout(2000);
  
  // Count tokens with ROI displayed
  const roiElements = await page.locator('svg.lucide-trending-up, svg.lucide-trending-down').all();
  console.log(`\nTokens with ROI displayed: ${roiElements.length}`);
  
  // Count total rows
  const totalRows = await page.locator('tbody tr').count();
  console.log(`Total tokens displayed: ${totalRows}`);
  console.log(`ROI display rate: ${(roiElements.length / totalRows * 100).toFixed(1)}%`);
  
  // Check some specific ROI values
  console.log('\nSample ROI values:');
  for (let i = 0; i < Math.min(5, roiElements.length); i++) {
    const roiElement = roiElements[i];
    const roiText = await roiElement.locator('..').locator('span').textContent();
    
    // Get token name from row
    const row = await roiElement.locator('xpath=ancestor::tr').first();
    const tokenName = await row.locator('td:first-child').textContent();
    
    console.log(`${tokenName}: ${roiText}`);
  }
  
  // Expect most tokens to have ROI
  expect(roiElements.length).toBeGreaterThan(totalRows * 0.8); // At least 80% should have ROI
});
