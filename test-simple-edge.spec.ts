import { test, expect } from '@playwright/test';

test('simple edge function check', async ({ page }) => {
  // Set up network monitoring
  const apiCalls: string[] = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('/functions/')) {
      apiCalls.push(url);
      console.log(`📡 ${request.method()} ${url}`);
    }
  });

  // Go to app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Find and click any Fetch button
  const fetchButton = page.locator('button:has-text("Fetch")');
  
  if (await fetchButton.count() > 0) {
    console.log('Found Fetch button, clicking...');
    await fetchButton.first().click();
    
    // Wait for network activity
    await page.waitForTimeout(3000);
    
    // Check what was called
    console.log('\nAll API calls made:');
    apiCalls.forEach(url => console.log(`  - ${url}`));
    
    // Check if Supabase edge function was called
    const edgeFunctionCalled = apiCalls.some(url => 
      url.includes('supabase.co/functions/v1/crypto-price-single')
    );
    
    if (edgeFunctionCalled) {
      console.log('✅ Edge function was called!');
    } else {
      console.log('❌ Edge function NOT called - might still be using Netlify');
      
      // Check if Netlify API was called instead
      const netlifyApiCalled = apiCalls.some(url => 
        url.includes('/api/token-price')
      );
      
      if (netlifyApiCalled) {
        console.log('⚠️  Netlify API was called instead');
      }
    }
  } else {
    console.log('No Fetch buttons found');
  }
});