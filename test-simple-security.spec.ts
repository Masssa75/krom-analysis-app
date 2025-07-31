import { test, expect } from '@playwright/test';

test('check security icons exist', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Find all security buttons
  const securityButtons = await page.locator('tbody td:nth-child(7) button').all();
  console.log(`Found ${securityButtons.length} security buttons`);
  
  if (securityButtons.length > 0) {
    // Get info about first button
    const firstButton = securityButtons[0];
    const isVisible = await firstButton.isVisible();
    const isEnabled = await firstButton.isEnabled();
    console.log(`First button visible: ${isVisible}, enabled: ${isEnabled}`);
    
    // Try to click it
    await firstButton.click();
    console.log('Clicked first security button');
    
    // Wait and check for any dialog
    await page.waitForTimeout(1000);
    const dialogs = await page.locator('[role="dialog"]').count();
    console.log(`Found ${dialogs} dialogs after click`);
    
    // Check for any modal content
    const modalContent = await page.locator('[role="dialog"]').textContent();
    console.log('Modal content:', modalContent?.substring(0, 100));
  }
});