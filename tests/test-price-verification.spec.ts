import { test, expect } from '@playwright/test';

test.describe('Price Verification with Chart', () => {
  test('Verify prices by comparing with GeckoTerminal chart', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Scroll to see the table
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(2000);
    
    console.log('Looking for KAVR token...');
    
    // Find KAVR specifically
    const rows = await page.locator('tbody tr').all();
    let kavrRow = null;
    let kavrPriceData = null;
    
    for (const row of rows) {
      const tokenCell = await row.locator('td').first();
      const tokenName = await tokenCell.textContent();
      
      if (tokenName?.includes('KAVR')) {
        kavrRow = row;
        console.log('Found KAVR token');
        
        // Get the price data
        const cells = await row.locator('td').all();
        const priceCell = cells[cells.length - 1];
        const priceText = await priceCell.textContent();
        
        console.log(`KAVR price data: ${priceText}`);
        
        // Extract prices
        const entryMatch = priceText?.match(/Entry:\s*\$?([\d.,]+[KMB]?)/);
        const nowMatch = priceText?.match(/Now:\s*\$?([\d.,]+[KMB]?)/);
        
        if (entryMatch && nowMatch) {
          kavrPriceData = {
            entry: entryMatch[1],
            now: nowMatch[1],
            identical: entryMatch[1] === nowMatch[1]
          };
          
          console.log(`\nKAVR Prices:`);
          console.log(`Entry: ${kavrPriceData.entry}`);
          console.log(`Now: ${kavrPriceData.now}`);
          console.log(`Identical: ${kavrPriceData.identical ? '❌ YES (PROBLEM!)' : '✅ NO'}`);
        }
        break;
      }
    }
    
    // Now let's check the contract address and open the chart
    if (kavrRow) {
      // Click on the token to see if there's a contract/chart link
      const copyButton = await kavrRow.locator('button[title*="Copy"]').first();
      if (await copyButton.isVisible()) {
        // Get the contract address from the parent element
        const contractElement = await copyButton.locator('..').first();
        const contractText = await contractElement.textContent();
        console.log(`\nContract info: ${contractText}`);
        
        // Look for chart button
        const chartButton = await kavrRow.locator('button:has-text("Chart"), a:has-text("Chart")').first();
        if (await chartButton.count() > 0) {
          console.log('Found chart button, clicking...');
          
          // Open in new tab
          const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            chartButton.click()
          ]);
          
          await newPage.waitForLoadState('networkidle');
          await newPage.waitForTimeout(5000);
          
          // Take screenshot of the chart
          await newPage.screenshot({ path: 'kavr-chart.png', fullPage: true });
          
          // Look for price information on GeckoTerminal
          const currentPriceElement = await newPage.locator('[data-testid="token-price"], .token-price, text=/\\$[0-9.,]+/').first();
          if (await currentPriceElement.isVisible()) {
            const currentPrice = await currentPriceElement.textContent();
            console.log(`\nGeckoTerminal current price: ${currentPrice}`);
          }
          
          await newPage.close();
        }
      }
    }
    
    // Let's also test the Edge function directly with KAVR
    console.log('\n=== Testing Edge Function Directly ===');
    
    // Find KAVR's contract address (if visible)
    const contractElements = await page.locator('text=/0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44}/').all();
    
    for (const element of contractElements) {
      const text = await element.textContent();
      console.log(`Found potential contract: ${text}`);
    }
    
    // Alternative approach: Clear prices and re-fetch
    console.log('\n=== Testing Clear and Re-fetch ===');
    
    // Click Clear Prices button
    const clearButton = await page.locator('button:has-text("Clear Prices")').first();
    if (await clearButton.isVisible()) {
      console.log('Clicking Clear Prices...');
      await clearButton.click();
      await page.waitForTimeout(2000);
      
      // Now look for Get Price or Edge button in KAVR row
      if (kavrRow) {
        const getPriceButton = await kavrRow.locator('button:has-text("Get Price")').first();
        const edgeButton = await kavrRow.locator('button:has-text("Edge")').first();
        
        if (await edgeButton.isVisible()) {
          console.log('Clicking Edge button for KAVR...');
          await edgeButton.click();
          await page.waitForTimeout(5000);
          
          // Get updated prices
          const cells = await kavrRow.locator('td').all();
          const priceCell = cells[cells.length - 1];
          const newPriceText = await priceCell.textContent();
          
          console.log(`\nUpdated KAVR prices: ${newPriceText}`);
          
          const newEntryMatch = newPriceText?.match(/Entry:\s*\$?([\d.,]+[KMB]?)/);
          const newNowMatch = newPriceText?.match(/Now:\s*\$?([\d.,]+[KMB]?)/);
          
          if (newEntryMatch && newNowMatch) {
            console.log(`New Entry: ${newEntryMatch[1]}`);
            console.log(`New Now: ${newNowMatch[1]}`);
            console.log(`Still identical: ${newEntryMatch[1] === newNowMatch[1] ? '❌ YES' : '✅ NO'}`);
          }
        } else if (await getPriceButton.isVisible()) {
          console.log('No Edge button, using Get Price button...');
          await getPriceButton.click();
          await page.waitForTimeout(5000);
        }
      }
    }
    
    // Summary
    console.log('\n=== VERIFICATION SUMMARY ===');
    if (kavrPriceData?.identical) {
      console.log('❌ PROBLEM CONFIRMED: KAVR has identical Entry/Now prices');
      console.log('\nPossible causes:');
      console.log('1. Token is very new (no historical data)');
      console.log('2. Historical price API returning null');
      console.log('3. Fallback to current price when historical fetch fails');
      console.log('4. Wrong timestamp being used for historical lookup');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'price-verification-complete.png', fullPage: true });
  });
  
  test('Test Edge function with specific date range', async ({ page }) => {
    // Let's test the edge function API directly with curl commands
    console.log('Testing Edge function with different timestamps...');
    
    // We'll create a test script that calls the edge function with various timestamps
    const testScript = `
// Test Edge Function with different timestamps
const contractAddress = "0x5832f53d147b3d6cd4578b9cbd62425c7ea9d0bd"; // KAVR if Ethereum
const baseUrl = "https://eucfoommxxvqmmwdbkdv.supabase.co/functions/v1/crypto-price-single";

async function testTimestamp(daysAgo) {
  const timestamp = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
  
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2Zvb21teHh2cW1td2Ria2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjI4ODEsImV4cCI6MjA2MzEzODg4MX0.eaWAToMH3go56vYwvYWpbkgibVTEiv72AtUrqiIChTs'
    },
    body: JSON.stringify({
      contractAddress,
      callTimestamp: Math.floor(timestamp / 1000)
    })
  });
  
  const data = await response.json();
  console.log(\`\\n\${daysAgo} days ago:\`);
  console.log(\`Timestamp: \${new Date(timestamp).toISOString()}\`);
  console.log(\`Price at call: \${data.priceAtCall || 'null'}\`);
  console.log(\`Current price: \${data.currentPrice || 'null'}\`);
  console.log(\`Network: \${data.network}\`);
}

// Test multiple timestamps
console.log('Testing KAVR price at different timestamps:');
await testTimestamp(1);   // 1 day ago
await testTimestamp(7);   // 1 week ago
await testTimestamp(30);  // 1 month ago
await testTimestamp(90);  // 3 months ago
`;

    // Navigate to the app and open console
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    await page.waitForLoadState('networkidle');
    
    // Execute the test script in the browser console
    const results = await page.evaluate(testScript);
    
    console.log('Edge function timestamp tests completed');
  });
});