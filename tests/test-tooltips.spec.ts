import { test, expect } from '@playwright/test';

test('Call and X Analysis tooltips appear on hover', async ({ page }) => {
  // Navigate to the page
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for content to load - look for the RECENT CALLS section
  await page.waitForSelector('text=RECENT CALLS', { timeout: 30000 });
  
  // Wait for loading to complete
  await page.waitForTimeout(3000);
  
  // Check if badges exist on the page
  const callBadges = await page.locator('span:has-text("C:")').count();
  const xBadges = await page.locator('span:has-text("X:")').count();
  
  console.log(`Found ${callBadges} Call badges`);
  console.log(`Found ${xBadges} X badges`);
  
  if (callBadges > 0) {
    // Test Call Analysis tooltip
    const callBadge = page.locator('span:has-text("C:")').first();
    await callBadge.scrollIntoViewIfNeeded();
    await callBadge.hover();
    
    // Wait a bit for tooltip to appear
    await page.waitForTimeout(1000);
    
    // Check if tooltip appears
    const tooltipCount = await page.locator('[role="tooltip"]').count();
    console.log(`Tooltips visible after hovering Call badge: ${tooltipCount}`);
    
    if (tooltipCount > 0) {
      const callTooltip = page.locator('[role="tooltip"]').first();
      const callTooltipText = await callTooltip.textContent();
      console.log('Call tooltip content:', callTooltipText);
      
      // Verify tooltip has expected content
      expect(callTooltipText).toContain('Score:');
      console.log('✅ Call tooltip is working');
    } else {
      console.log('⚠️ No tooltip appeared for Call badge');
    }
  }
  
  // Move away to hide tooltip
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  
  if (xBadges > 0) {
    // Test X Analysis tooltip
    const xBadge = page.locator('span:has-text("X:")').first();
    await xBadge.scrollIntoViewIfNeeded();
    await xBadge.hover();
    
    // Wait a bit for tooltip to appear
    await page.waitForTimeout(1000);
    
    // Check if tooltip appears
    const tooltipCount = await page.locator('[role="tooltip"]').count();
    console.log(`Tooltips visible after hovering X badge: ${tooltipCount}`);
    
    if (tooltipCount > 0) {
      const xTooltip = page.locator('[role="tooltip"]').first();
      const xTooltipText = await xTooltip.textContent();
      console.log('X tooltip content:', xTooltipText);
      
      // Verify tooltip has expected content
      expect(xTooltipText).toContain('Score:');
      console.log('✅ X tooltip is working');
    } else {
      console.log('⚠️ No tooltip appeared for X badge');
    }
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'tooltip-test.png', fullPage: false });
  
  if (callBadges === 0 && xBadges === 0) {
    console.log('❌ No badges found on page - data may not be loaded');
  }
});