import { test, expect } from '@playwright/test';

test('Tooltips close when mouse leaves', async ({ page }) => {
  // Navigate to the page
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for content to load
  await page.waitForSelector('text=RECENT CALLS', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Find badges
  const callBadge = page.locator('span:has-text("C:")').first();
  const callBadgeCount = await callBadge.count();
  
  if (callBadgeCount === 0) {
    console.log('No Call badges found, skipping test');
    return;
  }
  
  console.log('Testing tooltip open/close behavior...');
  
  // Test 1: Hover on Call badge
  await callBadge.scrollIntoViewIfNeeded();
  await callBadge.hover();
  await page.waitForTimeout(500);
  
  // Look for tooltip divs with specific content
  let tooltipsVisible = await page.locator('text=CALL ANALYSIS').count();
  console.log(`After hovering Call badge: ${tooltipsVisible} tooltip(s) visible`);
  expect(tooltipsVisible).toBe(1);
  
  // Test 2: Move mouse away - tooltip should disappear
  await page.mouse.move(100, 100); // Move to a neutral position
  await page.waitForTimeout(500);
  
  tooltipsVisible = await page.locator('text=CALL ANALYSIS').count();
  console.log(`After moving mouse away: ${tooltipsVisible} tooltip(s) visible`);
  expect(tooltipsVisible).toBe(0);
  
  // Test 3: Hover again to ensure it can reopen
  await callBadge.hover();
  await page.waitForTimeout(500);
  
  tooltipsVisible = await page.locator('text=CALL ANALYSIS').count();
  console.log(`After hovering again: ${tooltipsVisible} tooltip(s) visible`);
  expect(tooltipsVisible).toBe(1);
  
  // Test 4: Hover on a different element - tooltip should close
  const header = page.locator('text=RECENT CALLS').first();
  await header.hover();
  await page.waitForTimeout(500);
  
  tooltipsVisible = await page.locator('text=CALL ANALYSIS').count();
  console.log(`After hovering on header: ${tooltipsVisible} tooltip(s) visible`);
  expect(tooltipsVisible).toBe(0);
  
  console.log('✅ Tooltips properly close when mouse leaves');
});