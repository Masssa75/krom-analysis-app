import { test, expect } from '@playwright/test';

test('verify loading state with fresh tokens', async ({ page }) => {
  // Go to discovery page with high score filter to get different tokens
  await page.goto('https://lively-torrone-8199e0.netlify.app/temp-discovery');
  
  // Change filter to get different tokens - find the select by its sibling label
  const selects = await page.locator('select').all();
  if (selects.length >= 2) {
    await selects[1].selectOption('18'); // Second select is the min score filter
  }
  
  // Wait for new tokens to load
  await page.waitForTimeout(2000);
  
  // Check for loading states
  const loadingElements = await page.locator('text="Capturing screenshot..."').all();
  console.log(`Found ${loadingElements.length} loading states`);
  
  if (loadingElements.length > 0) {
    console.log('✅ Loading states are showing!');
    
    // Check animation elements
    const spinners = await page.locator('.animate-spin').all();
    const pulses = await page.locator('.animate-ping').all();
    
    console.log(`  Spinners: ${spinners.length}`);
    console.log(`  Pulse effects: ${pulses.length}`);
    
    // Take screenshot of loading state
    await page.screenshot({ path: 'loading-animation.png', fullPage: false });
    
    // Wait and check again
    await page.waitForTimeout(5000);
    
    const afterLoading = await page.locator('text="Capturing screenshot..."').all();
    console.log(`Loading states after 5s: ${afterLoading.length}`);
  }
  
  // Also check normal view
  const selectsAgain = await page.locator('select').all();
  if (selectsAgain.length >= 2) {
    await selectsAgain[1].selectOption('0');
  }
  await page.waitForTimeout(2000);
  
  const normalViewLoading = await page.locator('text="Capturing screenshot..."').all();
  console.log(`\nNormal view loading states: ${normalViewLoading.length}`);
  
  await page.screenshot({ path: 'final-view.png', fullPage: false });
});