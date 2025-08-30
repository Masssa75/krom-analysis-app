import { test, expect } from '@playwright/test';

test('check screenshot display on discovery page', async ({ page }) => {
  // Go to the discovery page
  await page.goto('https://lively-torrone-8199e0.netlify.app/temp-discovery', {
    waitUntil: 'domcontentloaded'
  });
  
  // Wait for tokens to load
  await page.waitForSelector('img[alt*="screenshot"]', { timeout: 15000 });
  
  // Get all image elements
  const images = await page.locator('img[alt*="screenshot"]').all();
  
  console.log(`Found ${images.length} screenshot images`);
  
  // Check each image
  for (let i = 0; i < Math.min(3, images.length); i++) {
    const img = images[i];
    const src = await img.getAttribute('src');
    const alt = await img.getAttribute('alt');
    
    console.log(`Image ${i + 1}:`);
    console.log(`  Alt: ${alt}`);
    console.log(`  Src: ${src}`);
    
    // Check if image is loaded
    const isVisible = await img.isVisible();
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    
    console.log(`  Visible: ${isVisible}`);
    console.log(`  Natural Width: ${naturalWidth}`);
    
    // Check if it's a placeholder
    const isPlaceholder = src?.includes('placeholder');
    console.log(`  Is Placeholder: ${isPlaceholder}`);
  }
  
  // Take a screenshot to see what's actually displayed
  await page.screenshot({ path: 'discovery-page-debug.png', fullPage: false });
  
  // Also check console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  // Check network failures
  page.on('requestfailed', request => {
    console.log('Request failed:', request.url());
  });
  
  // Wait a bit to catch any async errors
  await page.waitForTimeout(3000);
});