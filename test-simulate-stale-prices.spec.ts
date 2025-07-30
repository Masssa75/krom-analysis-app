import { test, expect } from '@playwright/test';

test('simulate and verify stale price colors', async ({ page }) => {
  // Intercept the analyzed calls response to inject stale timestamps
  await page.route('**/api/analyzed*', async route => {
    const response = await route.fetch();
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const now = new Date();
      
      // Modify first few results to have different staleness levels
      if (data.results[0]) {
        // Make first token 45 minutes old (should be yellow)
        data.results[0].price_updated_at = new Date(now.getTime() - 45 * 60 * 1000).toISOString();
      }
      
      if (data.results[1]) {
        // Make second token 90 minutes old (should be orange)
        data.results[1].price_updated_at = new Date(now.getTime() - 90 * 60 * 1000).toISOString();
      }
      
      if (data.results[2]) {
        // Make third token 150 minutes old (should be red)
        data.results[2].price_updated_at = new Date(now.getTime() - 150 * 60 * 1000).toISOString();
      }
      
      // Keep 4th token fresh (< 30 min)
      if (data.results[3]) {
        data.results[3].price_updated_at = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
      }
    }
    
    await route.fulfill({
      response,
      json: data
    });
  });
  
  // Also intercept refresh-prices to prevent it from updating
  await page.route('**/api/refresh-prices', async route => {
    await route.fulfill({
      status: 200,
      json: { success: true, prices: {}, summary: { cached: 20, updated: 0 } }
    });
  });
  
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table');
  await page.waitForTimeout(1000);
  
  // Find price elements
  const priceRows = await page.locator('tbody tr').all();
  console.log(`\nChecking first 4 tokens for color coding:\n`);
  
  for (let i = 0; i < Math.min(4, priceRows.length); i++) {
    const row = priceRows[i];
    const tokenName = await row.locator('td:first-child').textContent();
    
    // Find the price display section
    const priceSection = await row.locator('span:has-text("Now:")').first();
    if (await priceSection.isVisible()) {
      const parent = await priceSection.locator('..').first();
      const priceSpan = await parent.locator('span.font-mono').first();
      const priceClasses = await priceSpan.getAttribute('class') || '';
      
      // Check for color classes
      const hasYellow = priceClasses.includes('text-yellow-600');
      const hasOrange = priceClasses.includes('text-orange-600');
      const hasRed = priceClasses.includes('text-red-600');
      
      // Check for clock icon
      const clockIcon = await parent.locator('svg.lucide-clock').first();
      const hasClockIcon = await clockIcon.isVisible();
      
      let colorStatus = 'default (fresh)';
      if (hasYellow) colorStatus = 'YELLOW';
      if (hasOrange) colorStatus = 'ORANGE';
      if (hasRed) colorStatus = 'RED';
      
      console.log(`${i+1}. ${tokenName}:`);
      console.log(`   Color: ${colorStatus}`);
      console.log(`   Clock icon: ${hasClockIcon ? 'YES' : 'NO'}`);
      
      // Verify expected colors
      if (i === 0) {
        expect(hasYellow).toBeTruthy(); // 45 min old
        expect(hasClockIcon).toBeTruthy();
      } else if (i === 1) {
        expect(hasOrange).toBeTruthy(); // 90 min old
        expect(hasClockIcon).toBeTruthy();
      } else if (i === 2) {
        expect(hasRed).toBeTruthy(); // 150 min old
        expect(hasClockIcon).toBeTruthy();
      } else if (i === 3) {
        expect(hasYellow || hasOrange || hasRed).toBeFalsy(); // Fresh
        expect(hasClockIcon).toBeFalsy();
      }
    }
  }
});
