import { test } from '@playwright/test';

test('fetch price for T token on BSC', async ({ page }) => {
  let edgeFunctionData: any = null;
  
  // Track edge function
  page.on('request', request => {
    if (request.url().includes('crypto-price-single')) {
      const body = request.postDataJSON();
      edgeFunctionData = body;
      console.log('\n📡 Edge function called with:');
      console.log('Contract:', body.contractAddress);
      console.log('Timestamp:', body.callTimestamp);
      console.log('Date:', new Date(body.callTimestamp));
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('crypto-price-single')) {
      console.log('\n📥 Response status:', response.status());
      if (response.ok()) {
        const data = await response.json().catch(() => null);
        if (data) {
          console.log('\n✅ Price data received:');
          console.log('Entry price:', data.priceAtCall);
          console.log('Current price:', data.currentPrice);
          console.log('ATH:', data.ath);
          console.log('ROI:', data.roi);
          console.log('ATH ROI:', data.athROI);
        }
      } else {
        const error = await response.text();
        console.log('Error:', error);
      }
    }
  });

  // Navigate to app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Search for the correct T token contract
  const searchInput = page.locator('input[placeholder*="Search"]');
  console.log('Searching for BSC T token contract...');
  await searchInput.fill('0xbb02Aa3AA36B85f86FDB9a57BCea4e5e8f654444');
  await page.waitForTimeout(2000);
  
  // Check results
  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  console.log(`Found ${rowCount} matching rows`);
  
  if (rowCount > 0) {
    const row = rows.first();
    
    // Get token details
    console.log('\n📊 T Token Details (BSC):');
    const tokenName = await row.locator('td').nth(0).textContent();
    console.log('Token:', tokenName);
    
    const dateCell = row.locator('td').nth(6);
    const dateText = await dateCell.textContent();
    console.log('Call date:', dateText);
    
    // Get exact timestamp
    const dateSpan = dateCell.locator('span[title]');
    if (await dateSpan.count() > 0) {
      const timestamp = await dateSpan.getAttribute('title');
      console.log('Exact timestamp:', timestamp);
    }
    
    // Check price cell
    const priceCell = row.locator('td').nth(9);
    const priceContent = await priceCell.textContent();
    console.log('Current price status:', priceContent || 'Empty');
    
    // Fetch price
    const fetchButton = priceCell.locator('button:has-text("Fetch")');
    if (await fetchButton.count() > 0) {
      console.log('\nClicking Fetch button...');
      await fetchButton.click();
      
      // Wait for response
      await page.waitForTimeout(7000);
      
      // Check updated UI
      const newPrice = await priceCell.textContent();
      console.log('\nUpdated price display:', newPrice);
      
      // Take screenshot
      await page.screenshot({ path: 't-token-bsc-price.png' });
      console.log('Screenshot saved as t-token-bsc-price.png');
    } else if (priceContent?.includes('Entry:')) {
      console.log('\nPrice already fetched. Current display:', priceContent);
      
      // Try refetch
      const refetchBtn = priceCell.locator('button[title="Refetch price"]');
      if (await refetchBtn.count() > 0) {
        console.log('Refetching...');
        await refetchBtn.click();
        await page.waitForTimeout(7000);
      }
    }
  } else {
    console.log('\n❌ No results found for BSC T token contract');
    console.log('\nNote: The T token in the database is on BSC network');
    console.log('Contract: 0xbb02Aa3AA36B85f86FDB9a57BCea4e5e8f654444');
    console.log('Your provided contract (0x30a538e...) is not in the database');
  }
});