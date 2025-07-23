import { test, expect } from '@playwright/test';

test('Test tooltip hover behavior', async ({ page }) => {
  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the table to load
  await page.waitForSelector('table', { timeout: 10000 });
  
  // Find a price display component that has data
  const priceDisplay = page.locator('text=/Entry:.*\\$[0-9]/').first();
  
  // Check if price display exists
  const count = await priceDisplay.count();
  console.log('Found price displays:', count);
  
  if (count > 0) {
    // Get the initial state - no tooltip should be visible
    await expect(page.locator('[role="tooltip"]')).toHaveCount(0);
    console.log('✓ No tooltips visible initially');
    
    // Hover over the entry market cap
    await priceDisplay.hover();
    console.log('✓ Hovering over entry market cap');
    
    // Wait a bit for tooltip to appear
    await page.waitForTimeout(500);
    
    // Check if tooltip appears
    const tooltipCount = await page.locator('[role="tooltip"]').count();
    console.log('Tooltips visible after hover:', tooltipCount);
    
    // Take a screenshot to see the state
    await page.screenshot({ path: 'tooltip-hover.png' });
    
    // Move mouse away to a neutral area
    await page.mouse.move(0, 0);
    console.log('✓ Moved mouse away');
    
    // Wait for tooltip to disappear
    await page.waitForTimeout(1000);
    
    // Check if tooltip is gone
    const tooltipCountAfter = await page.locator('[role="tooltip"]').count();
    console.log('Tooltips visible after moving away:', tooltipCountAfter);
    
    // Take another screenshot
    await page.screenshot({ path: 'tooltip-after-move.png' });
    
    // Test the actual tooltip content visibility
    const tooltipContent = await page.locator('.bg-primary').count();
    console.log('Tooltip content elements:', tooltipContent);
  } else {
    console.log('No price displays found - trying to fetch price for a token first');
    
    // Click on a "Get Price" button if available
    const getPriceButton = page.locator('button:has-text("Get Price")').first();
    if (await getPriceButton.count() > 0) {
      await getPriceButton.click();
      console.log('Clicked Get Price button');
      await page.waitForTimeout(5000); // Wait for price to load
    }
  }
});