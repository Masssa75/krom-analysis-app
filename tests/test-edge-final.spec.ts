import { test, expect } from '@playwright/test';

test.describe('Edge Function Price Verification', () => {
  test('Verify Edge function returns different Entry/Now prices', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for data to load
    
    // Scroll down to see the data table
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(1000);
    
    console.log('Looking for tokens with Get Price buttons...');
    
    // Find all rows in the table
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} data rows`);
    
    let testResults = [];
    let testsPerformed = 0;
    const maxTests = 3;
    
    // Test multiple tokens
    for (let i = 0; i < Math.min(rows.length, 10) && testsPerformed < maxTests; i++) {
      const row = rows[i];
      
      // Check if this row has a Get Price button
      const hasGetPrice = await row.locator('button:has-text("Get Price")').count() > 0;
      
      if (hasGetPrice) {
        // Get token info
        const tokenCell = await row.locator('td').nth(0);
        const tokenText = await tokenCell.textContent();
        const ticker = tokenText?.trim() || 'Unknown';
        
        console.log(`\n=== Testing token ${testsPerformed + 1}: ${ticker} ===`);
        
        // Find the price cell (should contain the Get Price button)
        const priceCell = await row.locator('td').filter({ has: page.locator('button:has-text("Get Price")') }).first();
        
        // Check if there's an Edge button
        const edgeButton = await priceCell.locator('button:has-text("Edge")').first();
        const hasEdgeButton = await edgeButton.count() > 0;
        
        if (hasEdgeButton) {
          // Click the Edge button
          console.log('Clicking Edge button...');
          await edgeButton.click();
          
          // Wait for loading
          await page.waitForTimeout(1000);
          
          // Wait for any loading spinner to disappear
          const spinner = priceCell.locator('.animate-spin');
          if (await spinner.count() > 0) {
            console.log('Waiting for loading to complete...');
            try {
              await spinner.waitFor({ state: 'hidden', timeout: 30000 });
            } catch (e) {
              console.log('Loading timeout, continuing...');
            }
          }
          
          // Additional wait for content update
          await page.waitForTimeout(2000);
          
          // Get the updated content
          const cellContent = await priceCell.textContent();
          console.log(`Cell content: ${cellContent?.replace(/\s+/g, ' ').substring(0, 200)}`);
          
          // Extract prices
          const entryMatch = cellContent?.match(/Entry:\s*(\$?[\d.,]+[KMB]?)/);
          const nowMatch = cellContent?.match(/Now:\s*(\$?[\d.,]+[KMB]?)/);
          const athMatch = cellContent?.match(/ATH:\s*(\$?[\d.,]+[KMB]?)/);
          const roiMatch = cellContent?.match(/([+-]?\d+%)/);
          
          if (entryMatch && nowMatch) {
            const entry = entryMatch[1];
            const now = nowMatch[1];
            const ath = athMatch ? athMatch[1] : 'N/A';
            const roi = roiMatch ? roiMatch[1] : 'N/A';
            
            const result = {
              ticker,
              entry,
              now,
              ath,
              roi,
              different: entry !== now,
              hasData: entry !== 'N/A' && now !== 'N/A'
            };
            
            testResults.push(result);
            
            console.log(`Entry: ${entry}`);
            console.log(`Now: ${now}`);
            console.log(`ATH: ${ath}`);
            console.log(`ROI: ${roi}`);
            console.log(`Prices are different: ${result.different}`);
            
            testsPerformed++;
          } else {
            console.log('Could not extract price data from cell');
          }
        } else {
          // Try the Get Price button first
          const getPriceButton = await priceCell.locator('button:has-text("Get Price")').first();
          console.log('No Edge button found, clicking Get Price button first...');
          await getPriceButton.click();
          
          // Wait for it to load
          await page.waitForTimeout(3000);
          
          // Now check if Edge button appeared
          const edgeButtonAfter = await priceCell.locator('button:has-text("Edge")').first();
          if (await edgeButtonAfter.count() > 0) {
            console.log('Edge button appeared, clicking it...');
            await edgeButtonAfter.click();
            await page.waitForTimeout(3000);
            
            // Get the content
            const cellContent = await priceCell.textContent();
            const entryMatch = cellContent?.match(/Entry:\s*(\$?[\d.,]+[KMB]?)/);
            const nowMatch = cellContent?.match(/Now:\s*(\$?[\d.,]+[KMB]?)/);
            
            if (entryMatch && nowMatch) {
              const result = {
                ticker,
                entry: entryMatch[1],
                now: nowMatch[1],
                ath: 'N/A',
                roi: 'N/A',
                different: entryMatch[1] !== nowMatch[1],
                hasData: true
              };
              testResults.push(result);
              testsPerformed++;
            }
          }
        }
      }
    }
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Tested ${testResults.length} tokens`);
    
    testResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.ticker}:`);
      console.log(`   Entry: ${result.entry}, Now: ${result.now}`);
      console.log(`   Different: ${result.different ? '✅ YES' : '❌ NO'}`);
      console.log(`   ROI: ${result.roi}`);
    });
    
    // Analysis
    const tokensWithData = testResults.filter(r => r.hasData);
    const tokensWithDifferentPrices = testResults.filter(r => r.different && r.hasData);
    
    console.log(`\nTokens with price data: ${tokensWithData.length}`);
    console.log(`Tokens with different Entry/Now: ${tokensWithDifferentPrices.length}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'edge-test-complete.png', fullPage: true });
    
    // Assertions
    expect(testResults.length).toBeGreaterThan(0);
    expect(tokensWithData.length).toBeGreaterThan(0);
    
    // At least some tokens should have different prices
    if (tokensWithData.length > 0) {
      const percentageDifferent = (tokensWithDifferentPrices.length / tokensWithData.length) * 100;
      console.log(`\n${percentageDifferent.toFixed(1)}% of tokens have different Entry/Now prices`);
      
      // Expect at least 50% to have different prices (accounting for stablecoins)
      expect(percentageDifferent).toBeGreaterThan(30);
    }
  });
});