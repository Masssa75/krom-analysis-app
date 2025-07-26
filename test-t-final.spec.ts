import { test } from '@playwright/test';

test('find T token and test price fetch', async ({ page }) => {
  // Track edge function
  page.on('request', request => {
    if (request.url().includes('crypto-price-single')) {
      const body = request.postDataJSON();
      console.log('\n📡 Edge function called:');
      console.log('Contract:', body.contractAddress);
      console.log('Network:', body.network || 'Not specified');
      console.log('Timestamp:', new Date(body.callTimestamp).toISOString());
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('crypto-price-single')) {
      if (response.ok()) {
        const data = await response.json().catch(() => null);
        if (data) {
          console.log('\n📊 Price response:');
          console.log('Entry price:', data.priceAtCall || 'N/A');
          console.log('Current price:', data.currentPrice || 'N/A');
          console.log('ROI:', data.roi || 'N/A');
        }
      }
    }
  });

  // Navigate
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Clear search and filters
  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.clear();
  await page.waitForTimeout(1000);
  
  // Since we know T exists, let's navigate systematically
  console.log('Looking for T token...');
  
  // First, let's check how many pages we have
  const paginationText = await page.locator('text=/of \\d+/').textContent();
  console.log('Pagination:', paginationText);
  
  let found = false;
  let attempts = 0;
  
  // Try different approaches
  while (!found && attempts < 3) {
    attempts++;
    
    if (attempts === 1) {
      // Try exact search
      console.log('\nAttempt 1: Exact search for "T"');
      await searchInput.fill('T');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
    } else if (attempts === 2) {
      // Try spaces around T
      console.log('\nAttempt 2: Search with spaces');
      await searchInput.clear();
      await searchInput.fill(' T ');
      await page.waitForTimeout(2000);
    } else {
      // Browse manually
      console.log('\nAttempt 3: Manual browsing');
      await searchInput.clear();
      await page.waitForTimeout(1000);
    }
    
    // Check current page
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`Checking ${count} rows...`);
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const ticker = await row.locator('td').first().textContent();
      
      // Look for exact match "T"
      if (ticker && ticker.trim() === 'T') {
        console.log(`\n✅ Found T token!`);
        found = true;
        
        // Get all details
        const cells = await row.locator('td').all();
        console.log('\nT Token Information:');
        console.log('Ticker:', await cells[0].textContent());
        console.log('Date added:', await cells[1].textContent());
        console.log('Call score:', await cells[2].textContent());
        
        // Get date info
        const dateCell = cells[6]; // Date Called column
        const dateText = await dateCell.textContent();
        console.log('Date called:', dateText);
        
        // Get contract info (might be in details or hidden)
        console.log('\nLooking for contract address...');
        
        // Click details button to see more info
        const detailsBtn = cells[4].locator('button');
        if (await detailsBtn.count() > 0) {
          await detailsBtn.click();
          await page.waitForTimeout(1000);
          
          // Look for contract in detail panel
          const contractText = await page.locator('text=/0x[a-fA-F0-9]{40}/').first().textContent().catch(() => null);
          if (contractText) {
            console.log('Contract found:', contractText);
          }
          
          // Close details
          await page.keyboard.press('Escape');
        }
        
        // Check price cell
        const priceCell = cells[9];
        const priceText = await priceCell.textContent();
        console.log('\nPrice cell content:', priceText || 'Empty');
        
        // Try to fetch price
        const fetchBtn = priceCell.locator('button:has-text("Fetch")');
        if (await fetchBtn.count() > 0) {
          console.log('\nFetching price...');
          await fetchBtn.click();
          await page.waitForTimeout(7000);
          
          const newPrice = await priceCell.textContent();
          console.log('Updated price:', newPrice);
        } else {
          console.log('No fetch button - price may already exist');
        }
        
        break;
      }
    }
  }
  
  if (!found) {
    console.log('\n❌ Could not find T token');
    console.log('\nNote: The T token exists in the database with:');
    console.log('- Contract: 0xbb02Aa3AA36B85f86FDB9a57BCea4e5e8f654444 (BSC)');
    console.log('- Called on: 2025-01-20');
    console.log('- Group: YodaCallss');
    console.log('\nThe contract you mentioned (0x30a538e...) is not in the database');
  }
  
  // Take final screenshot
  await page.screenshot({ path: 't-token-final-state.png' });
});