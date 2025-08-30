import { test, expect } from '@playwright/test';

test('verify screenshots load after capture', async ({ page }) => {
  // First visit to trigger capture
  console.log('First visit - triggering screenshot captures...');
  await page.goto('https://lively-torrone-8199e0.netlify.app/temp-discovery');
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ path: 'discovery-initial.png' });
  
  // Reload page to get fresh data with screenshots
  console.log('Reloading page to check for stored screenshots...');
  await page.reload();
  await page.waitForTimeout(2000);
  
  // Get all image elements
  const images = await page.locator('img[alt*="screenshot"]').all();
  console.log(`Found ${images.length} screenshot images after reload`);
  
  let supabaseCount = 0;
  let placeholderCount = 0;
  
  // Check each image
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = await img.getAttribute('src');
    
    if (src?.includes('supabase.co/storage')) {
      supabaseCount++;
      console.log(`Image ${i + 1}: ✅ Supabase Storage`);
    } else if (src?.includes('placeholder')) {
      placeholderCount++;
      console.log(`Image ${i + 1}: ⚠️ Placeholder`);
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`  Supabase Storage: ${supabaseCount}`);
  console.log(`  Placeholders: ${placeholderCount}`);
  
  // Take final screenshot
  await page.screenshot({ path: 'discovery-final.png' });
  
  // Expect at least one real screenshot
  expect(supabaseCount).toBeGreaterThan(0);
});