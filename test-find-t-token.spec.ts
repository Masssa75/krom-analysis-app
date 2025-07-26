import { test } from '@playwright/test';

test('find and analyze T token in the app', async ({ page }) => {
  // Track API calls
  page.on('response', async response => {
    if (response.url().includes('/api/analyzed')) {
      const data = await response.json();
      console.log(`Analyzed API returned ${data.calls?.length || 0} calls`);
      
      // Check if any T tokens in response
      const tTokens = data.calls?.filter((call: any) => call.ticker === 'T');
      if (tTokens?.length > 0) {
        console.log(`\nFound ${tTokens.length} T token(s) in API response:`);
        tTokens.forEach((t: any, i: number) => {
          console.log(`\nT token ${i + 1}:`);
          console.log('- Ticker:', t.ticker);
          console.log('- Contract:', t.contract_address);
          console.log('- Network:', t.network || 'Unknown');
          console.log('- Call timestamp:', t.call_timestamp || t.buy_timestamp);
          console.log('- Price data exists:', !!t.current_price);
        });
      }
    }
  });

  // Navigate to app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Clear any filters
  const searchInput = page.locator('input[placeholder*="Search"]');
  if (await searchInput.count() > 0) {
    await searchInput.clear();
  }
  
  // Navigate through pages to find T
  console.log('\nSearching for T token in the UI...');
  
  let found = false;
  let pageNum = 1;
  
  // Since there are 5,557 total calls and 20 per page, T might be on any page
  // Let's try sorting by token name to find it faster
  const sortDropdown = page.locator('select').first();
  if (await sortDropdown.count() > 0) {
    console.log('Changing sort to token name...');
    await sortDropdown.selectOption({ label: 'Token Name' });
    await page.waitForTimeout(2000);
  }
  
  // Now search through pages
  while (!found && pageNum <= 20) {
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const tokenName = await row.locator('td').first().textContent();
      
      if (tokenName?.trim() === 'T') {
        console.log(`\n✅ Found T token on page ${pageNum}!`);
        found = true;
        
        // Get all details
        const cells = await row.locator('td').all();
        console.log('\nT Token Details:');
        console.log('1. Token:', await cells[0].textContent());
        console.log('2. Date:', await cells[1].textContent()); 
        console.log('3. Call Score:', await cells[2].textContent());
        console.log('4. Call Tier:', await cells[3].textContent());
        console.log('5. Details:', await cells[4].textContent());
        console.log('6. X Score:', await cells[5].textContent());
        console.log('7. Date Called:', await cells[6].textContent());
        console.log('8. Contract:', await cells[7].textContent());
        console.log('9. Price info:', await cells[8].textContent());
        console.log('10. Price/ROI:', await cells[9].textContent());
        
        // Get exact timestamp
        const dateCell = cells[6];
        const dateSpan = dateCell.locator('span[title]');
        if (await dateSpan.count() > 0) {
          const timestamp = await dateSpan.getAttribute('title');
          console.log('\nExact call timestamp:', timestamp);
        }
        
        // Check price cell
        const priceCell = cells[9];
        const priceContent = await priceCell.textContent();
        
        if (priceContent?.includes('Fetch')) {
          console.log('\nFetch button available - clicking...');
          const fetchBtn = priceCell.locator('button:has-text("Fetch")');
          
          // Set up edge function tracking
          let edgeCalled = false;
          page.once('request', request => {
            if (request.url().includes('crypto-price-single')) {
              edgeCalled = true;
              const body = request.postDataJSON();
              console.log('\n📡 Edge function called:');
              console.log('Contract:', body.contractAddress);
              console.log('Timestamp:', body.callTimestamp);
              console.log('Date:', new Date(body.callTimestamp));
            }
          });
          
          await fetchBtn.click();
          await page.waitForTimeout(5000);
          
          if (edgeCalled) {
            const newPrice = await priceCell.textContent();
            console.log('\nPrice fetched! New content:', newPrice);
          }
        } else if (priceContent) {
          console.log('\nPrice already exists:', priceContent);
        }
        
        break;
      }
    }
    
    if (!found) {
      const nextBtn = page.locator('button:has-text("Next")');
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
        pageNum++;
      } else {
        break;
      }
    }
  }
  
  if (!found) {
    console.log(`\n❌ T token not found in first ${pageNum} pages`);
  }
});