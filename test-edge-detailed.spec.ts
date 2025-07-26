import { test, expect } from '@playwright/test';

test('detailed edge function check', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Fetching') || text.includes('Error') || text.includes('edge')) {
      console.log('Console:', msg.type(), '-', text);
    }
  });
  
  // Track all requests
  page.on('request', request => {
    const url = request.url();
    console.log(`📡 ${request.method()} ${url}`);
    
    if (url.includes('supabase')) {
      console.log('✅ SUPABASE REQUEST DETECTED!');
      console.log('Headers:', request.headers());
    }
  });
  
  // Track responses
  page.on('response', response => {
    const url = response.url();
    if (url.includes('api') || url.includes('function')) {
      console.log(`📥 Response ${response.status()} from ${url}`);
    }
  });

  // Navigate
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Find fetch button
  const fetchButton = page.locator('button:has-text("Fetch")').first();
  
  if (await fetchButton.count() > 0) {
    console.log('\n🔘 Found Fetch button');
    
    // Click it
    await fetchButton.click();
    console.log('👆 Clicked');
    
    // Wait for network activity
    await page.waitForTimeout(5000);
  } else {
    console.log('❌ No Fetch button found');
  }
  
  // Check environment variable
  console.log('\n🔍 Checking if NEXT_PUBLIC_SUPABASE_ANON_KEY is available:');
  const hasSupabaseKey = await page.evaluate(() => {
    return typeof (window as any).__NEXT_DATA__ !== 'undefined';
  });
  console.log('Next.js data available:', hasSupabaseKey);
});