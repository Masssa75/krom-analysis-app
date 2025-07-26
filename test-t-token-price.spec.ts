import { test, expect } from '@playwright/test';

test('fetch price for T token (0x30a538eFFD91ACeFb1b12CE9Bc0074eD18c9dFc9)', async ({ page }) => {
  // Track edge function calls and responses
  let edgeFunctionCalled = false;
  let requestBody: any = null;
  let responseData: any = null;
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('supabase.co/functions/v1/crypto-price-single')) {
      edgeFunctionCalled = true;
      console.log('\n✅ EDGE FUNCTION CALLED');
      console.log('URL:', url);
      
      try {
        requestBody = request.postDataJSON();
        console.log('\nRequest body:', JSON.stringify(requestBody, null, 2));
      } catch (e) {
        console.log('Could not parse request body');
      }
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase.co/functions/v1/crypto-price-single')) {
      console.log('\n📥 Edge function response:', response.status());
      if (response.ok()) {
        try {
          responseData = await response.json();
          console.log('\nResponse data:', JSON.stringify(responseData, null, 2));
        } catch (e) {
          console.log('Could not parse response');
        }
      } else {
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    }
  });

  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Search for the T token
  console.log('Searching for T token...');
  
  // Use the search input if available
  const searchInput = page.locator('input[placeholder*="Search"]');
  if (await searchInput.count() > 0) {
    await searchInput.fill('T');
    await page.waitForTimeout(1000);
  }
  
  // Find the T token row
  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  console.log(`Checking ${rowCount} rows...`);
  
  let tTokenFound = false;
  let tTokenRow = null;
  
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const tokenCell = row.locator('td').first();
    const tokenName = await tokenCell.textContent();
    
    if (tokenName?.trim() === 'T') {
      console.log(`\n✅ Found T token in row ${i + 1}`);
      tTokenFound = true;
      tTokenRow = row;
      
      // Get the date/timestamp
      const dateCell = row.locator('td').nth(6);
      const dateText = await dateCell.textContent();
      console.log('Call date:', dateText);
      
      // Get the date tooltip for exact timestamp
      const dateSpan = dateCell.locator('span');
      if (await dateSpan.count() > 0) {
        const tooltip = await dateSpan.getAttribute('title');
        console.log('Full timestamp:', tooltip);
      }
      
      // Check if price is already fetched
      const priceCell = row.locator('td').nth(9);
      const priceContent = await priceCell.textContent();
      console.log('Current price cell content:', priceContent);
      
      // Look for Fetch button
      const fetchButton = priceCell.locator('button:has-text("Fetch")');
      
      if (await fetchButton.count() > 0) {
        console.log('\nFetch button found, clicking...');
        await fetchButton.click();
        
        // Wait for the edge function call
        await page.waitForTimeout(5000);
        
        if (edgeFunctionCalled) {
          console.log('\n✅ Edge function was called successfully');
          console.log('Contract address sent:', requestBody?.contractAddress);
          console.log('Call timestamp sent:', requestBody?.callTimestamp);
          
          if (responseData) {
            console.log('\n📊 Price Data Received:');
            console.log('Entry price:', responseData.priceAtCall);
            console.log('Current price:', responseData.currentPrice);
            console.log('ATH:', responseData.ath);
            console.log('ROI:', responseData.roi);
            
            // Check if the price now appears in the UI
            await page.waitForTimeout(2000);
            const newPriceContent = await priceCell.textContent();
            console.log('\nUpdated UI content:', newPriceContent);
          }
        }
      } else {
        console.log('\nNo Fetch button - price already fetched');
        console.log('Price data shown:', priceContent);
        
        // If there's a refetch button, we could click that
        const refetchButton = priceCell.locator('button[title="Refetch price"]');
        if (await refetchButton.count() > 0) {
          console.log('Refetch button available, clicking...');
          await refetchButton.click();
          await page.waitForTimeout(5000);
        }
      }
      
      break;
    }
  }
  
  if (!tTokenFound) {
    console.log('\n❌ T token not found in the current page');
    console.log('Taking screenshot for debugging...');
    await page.screenshot({ path: 't-token-search.png', fullPage: true });
  }
});