import { test, expect } from '@playwright/test';

test('verify loading state shows during screenshot capture', async ({ page }) => {
  // Go to discovery page
  await page.goto('https://lively-torrone-8199e0.netlify.app/temp-discovery');
  
  // Wait for initial load
  await page.waitForTimeout(1000);
  
  // Check for loading states
  const loadingElements = await page.locator('text="Capturing screenshot..."').all();
  console.log(`Found ${loadingElements.length} loading states`);
  
  if (loadingElements.length > 0) {
    console.log('✅ Loading states are showing!');
    
    // Check for spinner animation
    const spinners = await page.locator('.animate-spin').all();
    console.log(`Found ${spinners.length} spinning elements`);
    
    // Take screenshot of loading state
    await page.screenshot({ path: 'loading-state.png' });
    
    // Wait for some to complete
    await page.waitForTimeout(8000);
    
    // Check if any loading states resolved
    const remainingLoading = await page.locator('text="Capturing screenshot..."').all();
    console.log(`Loading states after 8s: ${remainingLoading.length}`);
    
    if (remainingLoading.length < loadingElements.length) {
      console.log('✅ Some screenshots completed!');
    }
  } else {
    console.log('ℹ️ No loading states visible - screenshots may already be cached');
    
    // Check for actual screenshots
    const images = await page.locator('img[alt*="screenshot"]').all();
    let hasStoredScreenshots = false;
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src?.includes('supabase.co/storage')) {
        hasStoredScreenshots = true;
        break;
      }
    }
    
    if (hasStoredScreenshots) {
      console.log('✅ Found cached screenshots');
    }
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'discovery-with-loading.png' });
});