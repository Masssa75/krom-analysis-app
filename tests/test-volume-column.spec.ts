import { test, expect } from '@playwright/test';

test('volume column should be visible', async ({ page }) => {
  // Navigate to the deployed app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the table to load
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Check if Volume header exists
  const volumeHeader = await page.locator('th:has-text("Volume")').count();
  console.log(`Found ${volumeHeader} Volume headers`);
  
  // Check table container width
  const tableContainer = await page.locator('div.container').first();
  const containerClasses = await tableContainer.getAttribute('class');
  console.log(`Container classes: ${containerClasses}`);
  
  // Check if max-w-7xl is present
  const hasMaxWidth = containerClasses?.includes('max-w-7xl');
  console.log(`Has max-w-7xl constraint: ${hasMaxWidth}`);
  
  // Take a screenshot
  await page.screenshot({ path: 'volume-check.png', fullPage: true });
  
  // Assert volume column exists
  expect(volumeHeader).toBeGreaterThan(0);
  
  // Assert no max-width constraint
  expect(hasMaxWidth).toBeFalsy();
});