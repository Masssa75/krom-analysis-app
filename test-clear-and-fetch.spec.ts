import { test, expect } from '@playwright/test';

test('clear prices then test edge function', async ({ page }) => {
  // Track edge function calls
  let edgeFunctionCalled = false;
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('supabase.co/functions/v1/crypto-price-single')) {
      edgeFunctionCalled = true;
      console.log('✅ EDGE FUNCTION crypto-price-single CALLED!');
      console.log('URL:', url);
      console.log('Headers:', request.headers());
    }
  });

  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // First, clear prices
  console.log('1. Clearing prices...');
  const clearButton = page.locator('button:has-text("Clear Prices")');
  await clearButton.click();
  
  // Handle the confirm dialog
  page.once('dialog', dialog => {
    console.log('Confirm dialog:', dialog.message());
    dialog.accept();
  });
  
  // Wait for clear to complete
  await page.waitForTimeout(3000);
  
  // Refresh the page to see cleared prices
  await page.reload();
  await page.waitForSelector('table', { timeout: 30000 });
  
  console.log('2. Looking for Fetch buttons after clearing...');
  
  // Now look for Fetch buttons
  const fetchButtons = page.locator('button:has-text("Fetch")').filter({ hasNotText: 'All' });
  const fetchCount = await fetchButtons.count();
  console.log(`Found ${fetchCount} individual Fetch buttons`);
  
  if (fetchCount > 0) {
    console.log('3. Clicking first Fetch button...');
    
    // Click the first one
    await fetchButtons.first().click();
    
    // Wait for potential edge function call
    await page.waitForTimeout(5000);
    
    if (edgeFunctionCalled) {
      console.log('\n✅ SUCCESS! Edge function was called after clearing prices');
    } else {
      console.log('\n❌ Edge function was NOT called');
      
      // Check what was called instead
      const requests = await page.evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('/api/'))
          .map(entry => entry.name);
      });
      
      console.log('API calls made:', requests);
    }
  } else {
    console.log('Still no Fetch buttons after clearing');
  }
  
  // Also test if environment variable is now available
  const hasEnvVar = await page.evaluate(() => {
    return typeof process !== 'undefined' && 
           typeof process.env !== 'undefined' && 
           typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined';
  });
  
  console.log('\nEnvironment variable check:', hasEnvVar ? 'Available' : 'Not available');
});