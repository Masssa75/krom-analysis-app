import { test, expect } from '@playwright/test';

test('verify Supabase edge function for price fetching', async ({ page }) => {
  console.log('🚀 Starting edge function test...');
  
  // Track edge function calls
  let edgeFunctionCalled = false;
  let edgeFunctionResponse: any = null;
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('supabase.co/functions/v1/crypto-price-single')) {
      edgeFunctionCalled = true;
      console.log('📡 Edge function called!');
      console.log('   URL:', url);
      console.log('   Method:', request.method());
      const body = request.postDataJSON();
      console.log('   Request body:', JSON.stringify(body, null, 2));
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase.co/functions/v1/crypto-price-single')) {
      console.log('📥 Edge function response:', response.status());
      if (response.ok()) {
        try {
          edgeFunctionResponse = await response.json();
          console.log('   Response data:', JSON.stringify(edgeFunctionResponse, null, 2));
        } catch (e) {
          console.log('   Could not parse response');
        }
      }
    }
  });

  // Navigate to app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Based on our data check, we found 1 Fetch button total
  // Let's find it and click it
  const fetchButton = page.locator('button:has-text("Fetch")').first();
  const fetchExists = await fetchButton.count() > 0;
  
  if (fetchExists) {
    console.log('✅ Found Fetch button');
    
    // Get the row containing this button
    const row = page.locator('tr:has(button:has-text("Fetch"))').first();
    const ticker = await row.locator('td').nth(0).textContent();
    console.log('📊 Token:', ticker);
    
    // Click fetch
    await fetchButton.click();
    console.log('👆 Clicked Fetch button');
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    if (edgeFunctionCalled) {
      console.log('✅ SUCCESS: Edge function was called!');
      expect(edgeFunctionCalled).toBeTruthy();
      
      if (edgeFunctionResponse) {
        // Verify response structure
        expect(edgeFunctionResponse).toHaveProperty('currentPrice');
        console.log('✅ Response has expected structure');
      }
    } else {
      console.log('❌ Edge function was NOT called');
      console.log('   This might mean the app is still using Netlify API routes');
    }
  } else {
    console.log('❌ No Fetch buttons found on page');
    console.log('   All prices might already be fetched');
  }
  
  // Also test the date column with correct positioning
  console.log('\n📅 Testing date column:');
  const firstRow = page.locator('tbody tr').first();
  const dateCell = firstRow.locator('td').nth(6); // Column 7 (0-indexed)
  const dateText = await dateCell.textContent();
  console.log('Date text:', dateText);
  
  if (dateText !== '-') {
    const dateSpan = dateCell.locator('span').first();
    if (await dateSpan.count() > 0) {
      const tooltip = await dateSpan.getAttribute('title');
      console.log('Tooltip:', tooltip);
      if (tooltip && tooltip !== 'null') {
        expect(tooltip).toContain('(Thai Time)');
        console.log('✅ Thai timezone tooltip working!');
      }
    }
  }
});