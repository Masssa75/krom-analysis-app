import { test, expect } from '@playwright/test';

test('test individual price fetch with edge function', async ({ page }) => {
  // Track edge function calls
  let edgeFunctionCalled = false;
  let requestDetails: any = null;
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('supabase.co/functions/v1/crypto-price-single')) {
      edgeFunctionCalled = true;
      console.log('✅ EDGE FUNCTION CALLED!');
      console.log('URL:', url);
      console.log('Method:', request.method());
      
      const headers = request.headers();
      console.log('Authorization header present:', headers['authorization'] ? 'Yes' : 'No');
      
      try {
        requestDetails = request.postDataJSON();
        console.log('Request body:', JSON.stringify(requestDetails, null, 2));
      } catch (e) {
        console.log('Could not parse request body');
      }
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase.co/functions/v1/crypto-price-single')) {
      console.log('📥 Edge function response:', response.status());
      if (response.ok()) {
        try {
          const data = await response.json();
          console.log('Response data:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.log('Could not parse response');
        }
      }
    }
  });

  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Scroll down to see the table
  await page.evaluate(() => window.scrollBy(0, 500));
  
  // Look for individual Fetch buttons in the price column
  console.log('Looking for individual Fetch buttons...');
  
  // Find rows that don't have price data yet
  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  console.log(`Total rows: ${rowCount}`);
  
  let foundFetchButton = false;
  
  for (let i = 0; i < Math.min(10, rowCount); i++) {
    const row = rows.nth(i);
    const priceCell = row.locator('td').nth(9); // Price column based on our findings
    
    // Check if this cell has a Fetch button
    const fetchButton = priceCell.locator('button:has-text("Fetch")');
    
    if (await fetchButton.count() > 0) {
      console.log(`\nFound Fetch button in row ${i + 1}`);
      foundFetchButton = true;
      
      // Get token info
      const tokenCell = row.locator('td').first();
      const tokenName = await tokenCell.textContent();
      console.log('Token:', tokenName);
      
      // Click the Fetch button
      await fetchButton.click();
      console.log('Clicked Fetch button');
      
      // Wait for the edge function call
      await page.waitForTimeout(5000);
      
      if (edgeFunctionCalled) {
        console.log('\n✅ SUCCESS! Edge function was called');
        console.log('Contract address:', requestDetails?.contractAddress);
        expect(edgeFunctionCalled).toBeTruthy();
      } else {
        console.log('\n❌ Edge function was NOT called');
        
        // Check if it called the Netlify API instead
        const netlifyApiCalled = await page.evaluate(() => {
          return window.performance.getEntriesByType('resource')
            .some(entry => entry.name.includes('/api/token-price'));
        });
        
        if (netlifyApiCalled) {
          console.log('⚠️  Called Netlify API instead of edge function');
        }
      }
      
      break;
    }
  }
  
  if (!foundFetchButton) {
    console.log('\n❌ No individual Fetch buttons found');
    console.log('This might mean all tokens already have prices fetched');
    
    // Take a screenshot to see the current state
    await page.screenshot({ path: 'no-fetch-buttons.png', fullPage: true });
    console.log('Screenshot saved as no-fetch-buttons.png');
  }
});