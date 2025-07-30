import { test, expect } from '@playwright/test';

test('verify prices are fresh after page load', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for table and price refresh to complete
  await page.waitForSelector('table');
  await page.waitForTimeout(3000); // Give time for price refresh
  
  // Get all price elements with tooltips
  const priceElements = await page.locator('[title*="Last updated:"]').all();
  console.log(`\nChecking ${priceElements.length} price elements for freshness...\n`);
  
  let freshCount = 0;
  let staleCount = 0;
  
  for (let i = 0; i < Math.min(10, priceElements.length); i++) {
    const element = priceElements[i];
    await element.hover();
    
    const tooltipText = await element.getAttribute('title');
    if (tooltipText?.includes('Last updated:')) {
      const match = tooltipText.match(/Last updated: (.+?) \(Thai Time\)/);
      if (match) {
        const lastUpdated = new Date(match[1]);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
        
        // Get token name from row
        const row = await element.locator('xpath=ancestor::tr').first();
        const tokenName = await row.locator('td:first-child').textContent();
        
        console.log(`${tokenName}: Updated ${diffMinutes.toFixed(1)} minutes ago`);
        
        if (diffMinutes < 5) {
          freshCount++;
        } else {
          staleCount++;
        }
      }
    }
  }
  
  console.log(`\nSummary: ${freshCount} fresh prices, ${staleCount} stale prices`);
  
  // Most prices should be fresh (< 5 minutes old)
  expect(freshCount).toBeGreaterThan(staleCount);
});