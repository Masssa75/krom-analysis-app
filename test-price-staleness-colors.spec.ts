import { test, expect } from '@playwright/test';

test('verify price staleness color coding', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for table to load
  await page.waitForSelector('table');
  await page.waitForTimeout(2000); // Give time for any price refresh
  
  // Find price elements with "Now:" text
  const priceElements = await page.locator('span:has-text("Now:")').all();
  console.log(`\nFound ${priceElements.length} current price elements\n`);
  
  let freshCount = 0;
  let yellowCount = 0;
  let orangeCount = 0;
  let redCount = 0;
  
  // Check first 10 prices
  for (let i = 0; i < Math.min(10, priceElements.length); i++) {
    const element = priceElements[i];
    const parent = await element.locator('..').first();
    
    // Find the price value span (next sibling)
    const priceSpan = await parent.locator('span.font-mono').first();
    const priceText = await priceSpan.textContent();
    const priceClasses = await priceSpan.getAttribute('class') || '';
    
    // Hover to see the tooltip
    await parent.hover();
    const tooltipText = await parent.getAttribute('title');
    
    let ageText = 'unknown';
    let colorStatus = 'default (fresh)';
    
    if (tooltipText?.includes('Last updated:')) {
      const match = tooltipText.match(/Last updated: (.+?) \(Thai Time\)/);
      if (match) {
        const lastUpdated = new Date(match[1]);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
        ageText = `${diffMinutes.toFixed(1)} minutes ago`;
        
        // Determine expected color
        if (diffMinutes < 30) {
          colorStatus = 'default (fresh)';
          freshCount++;
        } else if (diffMinutes < 60) {
          colorStatus = 'yellow (30-60 min)';
          yellowCount++;
        } else if (diffMinutes < 120) {
          colorStatus = 'orange (60-120 min)';
          orangeCount++;
        } else {
          colorStatus = 'red (>2 hours)';
          redCount++;
        }
      }
    }
    
    // Check for color classes
    const hasYellow = priceClasses.includes('text-yellow-600');
    const hasOrange = priceClasses.includes('text-orange-600');
    const hasRed = priceClasses.includes('text-red-600');
    
    // Get token name from row
    const row = await element.locator('xpath=ancestor::tr').first();
    const tokenName = await row.locator('td:first-child').textContent();
    
    console.log(`${tokenName}: ${priceText} - ${ageText} - ${colorStatus}`);
    if (hasYellow) console.log(`  → Has yellow color class`);
    if (hasOrange) console.log(`  → Has orange color class`);
    if (hasRed) console.log(`  → Has red color class`);
    
    // Check for clock icon
    const clockIcon = await parent.locator('svg.lucide-clock').first();
    if (await clockIcon.isVisible()) {
      console.log(`  → Clock icon visible`);
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`- Fresh (default): ${freshCount}`);
  console.log(`- Yellow (30-60m): ${yellowCount}`);
  console.log(`- Orange (60-120m): ${orangeCount}`);
  console.log(`- Red (>2h): ${redCount}`);
});
