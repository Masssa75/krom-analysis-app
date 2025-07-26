import { test, expect } from '@playwright/test';

test('navigate to find T token and fetch price', async ({ page }) => {
  // Track edge function
  let edgeFunctionData: any = null;
  
  page.on('request', request => {
    if (request.url().includes('crypto-price-single')) {
      console.log('\n📡 Edge function called');
      edgeFunctionData = {
        body: request.postDataJSON(),
        headers: request.headers()
      };
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('crypto-price-single') && response.ok()) {
      const data = await response.json().catch(() => null);
      if (data) {
        console.log('\n📊 Price response:', JSON.stringify(data, null, 2));
      }
    }
  });

  // Navigate to app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for table to load
  await page.waitForSelector('table', { timeout: 30000 });
  await page.waitForSelector('tbody tr', { timeout: 30000 });
  
  // Clear any existing search
  const searchInput = page.locator('input[placeholder*="Search"]');
  if (await searchInput.count() > 0) {
    await searchInput.clear();
    await page.waitForTimeout(1000);
  }
  
  console.log('Looking for T token across pages...');
  
  let found = false;
  let pageNum = 1;
  const maxPages = 10;
  
  while (!found && pageNum <= maxPages) {
    console.log(`\nChecking page ${pageNum}...`);
    
    // Wait for rows to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    
    // Check all rows on this page
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const tokenText = await row.locator('td').first().textContent();
      
      // Look for exact match "T"
      if (tokenText?.trim() === 'T') {
        console.log(`\n✅ Found T token on page ${pageNum}, row ${i + 1}`);
        found = true;
        
        // Get call info
        const dateCell = row.locator('td').nth(6);
        const callAnalysisCell = row.locator('td').nth(2);
        const priceCell = row.locator('td').nth(9);
        
        console.log('\nToken details:');
        console.log('Call date:', await dateCell.textContent());
        console.log('Call analysis:', await callAnalysisCell.textContent());
        console.log('Price cell:', await priceCell.textContent());
        
        // Get the exact timestamp from tooltip
        const dateSpan = dateCell.locator('span[title]');
        if (await dateSpan.count() > 0) {
          const timestamp = await dateSpan.getAttribute('title');
          console.log('Full timestamp:', timestamp);
        }
        
        // Look for Fetch button
        const fetchButton = priceCell.locator('button:has-text("Fetch")');
        
        if (await fetchButton.count() > 0) {
          console.log('\nClicking Fetch button...');
          await fetchButton.click();
          
          // Wait for edge function
          await page.waitForTimeout(5000);
          
          if (edgeFunctionData) {
            console.log('\n✅ Edge function request details:');
            console.log('Contract address:', edgeFunctionData.body.contractAddress);
            console.log('Call timestamp:', edgeFunctionData.body.callTimestamp);
            console.log('Timestamp (Date):', new Date(edgeFunctionData.body.callTimestamp));
          }
          
          // Check updated price display
          const updatedPrice = await priceCell.textContent();
          console.log('\nUpdated price display:', updatedPrice);
        } else {
          // Check if price already exists
          const existingPrice = await priceCell.textContent();
          if (existingPrice && existingPrice.includes('Entry:')) {
            console.log('\nPrice already fetched:', existingPrice);
            
            // Try refetch button
            const refetchBtn = priceCell.locator('button[title="Refetch price"]');
            if (await refetchBtn.count() > 0) {
              console.log('Clicking refetch...');
              await refetchBtn.click();
              await page.waitForTimeout(5000);
            }
          }
        }
        
        break;
      }
    }
    
    if (!found) {
      // Try next page
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(2000);
        pageNum++;
      } else {
        console.log('No more pages to check');
        break;
      }
    }
  }
  
  if (!found) {
    console.log('\n❌ T token not found in first', maxPages, 'pages');
    
    // Try direct search
    console.log('\nTrying direct search for T...');
    await searchInput.fill('T');
    await page.waitForTimeout(2000);
    
    const searchRows = page.locator('tbody tr');
    const searchRowCount = await searchRows.count();
    console.log(`Search returned ${searchRowCount} rows`);
    
    if (searchRowCount > 0) {
      const firstRow = searchRows.first();
      const tokenName = await firstRow.locator('td').first().textContent();
      console.log('First result:', tokenName);
    }
  }
});