import { test, expect } from '@playwright/test';

test('verify screenshot capture on discovery page', async ({ page }) => {
  // Listen to network requests
  const captureRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('capture-screenshot')) {
      captureRequests.push(request.url());
      console.log('Screenshot capture request:', request.url());
    }
  });

  // Go to the discovery page
  await page.goto('https://lively-torrone-8199e0.netlify.app/temp-discovery', {
    waitUntil: 'domcontentloaded'
  });
  
  // Wait for initial load
  await page.waitForTimeout(2000);
  
  // Check if capture requests were made
  console.log(`Total capture requests: ${captureRequests.length}`);
  
  // Wait for potential screenshot updates
  await page.waitForTimeout(5000);
  
  // Get all image elements
  const images = await page.locator('img[alt*="screenshot"]').all();
  console.log(`Found ${images.length} screenshot images`);
  
  // Check first 3 images
  for (let i = 0; i < Math.min(3, images.length); i++) {
    const img = images[i];
    const src = await img.getAttribute('src');
    const alt = await img.getAttribute('alt');
    
    console.log(`\nImage ${i + 1}:`);
    console.log(`  Alt: ${alt}`);
    console.log(`  Src: ${src?.substring(0, 100)}...`);
    
    const isPlaceholder = src?.includes('placeholder');
    const isSupabaseStorage = src?.includes('supabase.co/storage');
    
    console.log(`  Is Placeholder: ${isPlaceholder}`);
    console.log(`  Is Supabase Storage: ${isSupabaseStorage}`);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'discovery-page-test.png' });
});