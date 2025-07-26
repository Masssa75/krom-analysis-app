import { test, expect } from '@playwright/test';

test('find T token by contract address 0x30a538eFFD91ACeFb1b12CE9Bc0074eD18c9dFc9', async ({ page }) => {
  // Track edge function calls
  let edgeFunctionCalled = false;
  let requestData: any = null;
  let responseData: any = null;
  
  page.on('request', request => {
    if (request.url().includes('crypto-price-single')) {
      edgeFunctionCalled = true;
      requestData = request.postDataJSON();
      console.log('\n📡 Edge function called with:', JSON.stringify(requestData, null, 2));
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('crypto-price-single')) {
      console.log('Response status:', response.status());
      if (response.ok()) {
        responseData = await response.json().catch(() => null);
        if (responseData) {
          console.log('\n📊 Price data received:', JSON.stringify(responseData, null, 2));
        }
      } else {
        const error = await response.text();
        console.log('Error response:', error);
      }
    }
  });

  // Navigate to app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // First, let's check the database directly via API
  console.log('Checking if T token exists in database...');
  
  // Search for contract address
  const searchInput = page.locator('input[placeholder*="Search"]');
  if (await searchInput.count() > 0) {
    console.log('Searching for contract address...');
    await searchInput.fill('0x30a538eFFD91ACeFb1b12CE9Bc0074eD18c9dFc9');
    await page.waitForTimeout(2000);
    
    // Check if any results
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`Search returned ${rowCount} rows`);
    
    if (rowCount === 0) {
      // Try partial contract address
      console.log('Trying partial contract address...');
      await searchInput.clear();
      await searchInput.fill('30a538e');
      await page.waitForTimeout(2000);
      
      const partialRows = await rows.count();
      console.log(`Partial search returned ${partialRows} rows`);
    }
    
    // If still no results, clear and check what tokens are available
    if (await rows.count() === 0) {
      console.log('\nNo results for contract address. Checking available tokens...');
      await searchInput.clear();
      await page.waitForTimeout(2000);
      
      // Get first few tokens to see what's in the database
      console.log('\nFirst 5 tokens in database:');
      for (let i = 0; i < Math.min(5, await rows.count()); i++) {
        const row = rows.nth(i);
        const token = await row.locator('td').first().textContent();
        const date = await row.locator('td').nth(6).textContent();
        console.log(`${i + 1}. ${token} - Called: ${date}`);
      }
    } else {
      // Found the token
      console.log('\n✅ Found token with contract address');
      const firstRow = rows.first();
      
      // Get token details
      const tokenName = await firstRow.locator('td').first().textContent();
      const dateCell = firstRow.locator('td').nth(6);
      const priceCell = firstRow.locator('td').nth(9);
      
      console.log('\nToken:', tokenName);
      console.log('Call date:', await dateCell.textContent());
      
      // Get exact timestamp
      const dateSpan = dateCell.locator('span[title]');
      if (await dateSpan.count() > 0) {
        const timestamp = await dateSpan.getAttribute('title');
        console.log('Exact timestamp:', timestamp);
      }
      
      // Check price status
      const priceContent = await priceCell.textContent();
      console.log('Current price status:', priceContent || 'Empty');
      
      // Try to fetch price
      const fetchButton = priceCell.locator('button:has-text("Fetch")');
      if (await fetchButton.count() > 0) {
        console.log('\nFetching price...');
        await fetchButton.click();
        await page.waitForTimeout(7000);
        
        if (edgeFunctionCalled) {
          console.log('\n✅ Successfully called edge function');
          console.log('Contract sent:', requestData?.contractAddress);
          console.log('Timestamp sent:', new Date(requestData?.callTimestamp));
          
          // Check updated UI
          const newPrice = await priceCell.textContent();
          console.log('\nUpdated price display:', newPrice);
        }
      } else {
        console.log('\nNo Fetch button - checking for existing price or refetch option');
        
        const refetchBtn = priceCell.locator('button[title="Refetch price"]');
        if (await refetchBtn.count() > 0) {
          console.log('Refetching price...');
          await refetchBtn.click();
          await page.waitForTimeout(7000);
        }
      }
    }
  }
  
  // Take final screenshot
  await page.screenshot({ path: 't-token-final.png', fullPage: false });
  console.log('\nScreenshot saved as t-token-final.png');
});