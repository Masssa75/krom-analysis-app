import { test, expect } from '@playwright/test';

test('test Edge Function Test button', async ({ page }) => {
  // Set up request monitoring
  let edgeFunctionCalled = false;
  let edgeFunctionUrl = '';
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('supabase.co/functions/v1/crypto-price-single')) {
      edgeFunctionCalled = true;
      edgeFunctionUrl = url;
      console.log('✅ EDGE FUNCTION CALLED!');
      console.log('URL:', url);
      console.log('Method:', request.method());
      console.log('Headers:', request.headers());
      
      try {
        const body = request.postDataJSON();
        console.log('Body:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('Body: Could not parse');
      }
    }
  });

  // Navigate
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Scroll down to see the table
  await page.evaluate(() => window.scrollBy(0, 500));
  
  // Look for Edge Function Test button
  const edgeTestButton = page.locator('button:has-text("Edge Function Test")');
  
  if (await edgeTestButton.count() > 0) {
    console.log('Found Edge Function Test button');
    
    // Click it
    await edgeTestButton.click();
    console.log('Clicked Edge Function Test button');
    
    // Wait for potential request
    await page.waitForTimeout(5000);
    
    if (edgeFunctionCalled) {
      console.log('✅ SUCCESS! Edge function was properly called');
    } else {
      console.log('❌ Edge function was NOT called');
      
      // Check console for errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Console error:', msg.text());
        }
      });
    }
  } else {
    console.log('Edge Function Test button not found');
    
    // Take screenshot to debug
    await page.screenshot({ path: 'edge-test-debug.png', fullPage: true });
    console.log('Full page screenshot saved');
  }
  
  // Also test the date column
  console.log('\n📅 Testing date column:');
  const dateCell = page.locator('td span.border-dotted').first();
  if (await dateCell.count() > 0) {
    const dateText = await dateCell.textContent();
    const tooltip = await dateCell.getAttribute('title');
    console.log('Date text:', dateText);
    console.log('Tooltip:', tooltip);
    
    if (tooltip && tooltip.includes('Thai Time')) {
      console.log('✅ Thai timezone working correctly!');
    }
  }
});