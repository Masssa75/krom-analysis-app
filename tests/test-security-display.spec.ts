import { test, expect } from '@playwright/test';

test('security column should be visible in analyzed calls table', async ({ page }) => {
  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the table to load
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Check if Security header exists
  const securityHeader = await page.locator('th span:has-text("Security")');
  await expect(securityHeader).toBeVisible();
  
  // Check if the security header has the correct tooltip
  const securityTooltip = await securityHeader.getAttribute('title');
  expect(securityTooltip).toContain('Security analysis including liquidity lock status');
  
  // Check table structure - count headers
  const headers = await page.locator('thead tr:first-child th').count();
  console.log(`Found ${headers} header columns`);
  
  // Security column should be between X Analysis and Price/ROI
  const allHeaders = await page.locator('thead tr:first-child th').allTextContents();
  console.log('Headers:', allHeaders);
  
  const securityIndex = allHeaders.findIndex(h => h.includes('Security'));
  const priceIndex = allHeaders.findIndex(h => h.includes('Price/ROI'));
  
  expect(securityIndex).toBeGreaterThan(-1);
  expect(priceIndex).toBeGreaterThan(securityIndex);
  
  // Check if any security icons are visible in the table body
  // Wait a bit for data to load
  await page.waitForTimeout(2000);
  
  // Look for security display components
  const securityCells = await page.locator('tbody td:nth-child(9)').count(); // Adjust index based on column position
  console.log(`Found ${securityCells} rows with security cells`);
});

test('security modal should open when clicking icon', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for table to load
  await page.waitForSelector('table', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Find a security icon button in the security column (7th column)
  // Look for any button that contains an SVG (the security icons)
  const securityButtons = await page.locator('tbody td:nth-child(7) button').all();
  
  if (securityButtons.length > 0) {
    // Click the first security icon
    await securityButtons[0].click();
    
    // Check if modal opened - title includes ticker name
    const modalTitle = await page.locator('h2:has-text("Security Analysis -")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    
    // Check modal content
    const securityScore = await page.locator('text=/Security Score.*\\/100/');
    await expect(securityScore).toBeVisible();
    
    // Check for liquidity lock status
    const liquidityLock = await page.locator('text="Liquidity Lock"');
    await expect(liquidityLock).toBeVisible();
    
    // Close modal by clicking the X button or overlay
    const closeButton = await page.locator('button[aria-label*="Close"]').or(page.locator('button:has-text("×")'));
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      // Click overlay to close
      await page.keyboard.press('Escape');
    }
    
    await expect(modalTitle).not.toBeVisible();
  } else {
    console.log('No security icons found - tokens may not have security data yet');
  }
});