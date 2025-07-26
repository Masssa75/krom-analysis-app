import { test, expect } from '@playwright/test';

test.describe('Edge Function Price Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    await page.waitForLoadState('networkidle');
    // Wait for data to load
    await page.waitForTimeout(3000);
  });

  test('Edge function returns different Entry/Now prices for multiple tokens', async ({ page }) => {
    // Test results array
    const results = [];
    
    // Look for Edge buttons specifically
    const edgeButtons = await page.locator('button:has-text("Edge")').all();
    console.log(`Found ${edgeButtons.length} Edge buttons to test`);
    
    // If no Edge buttons, look for Get Price buttons
    if (edgeButtons.length === 0) {
      const getPriceButtons = await page.locator('button:has-text("Get Price")').all();
      console.log(`Found ${getPriceButtons.length} Get Price buttons`);
    }
    
    // Test up to 3 tokens
    const tokensToTest = Math.min(3, edgeButtons.length);
    
    for (let i = 0; i < tokensToTest; i++) {
      const edgeButton = edgeButtons[i];
      
      // Get the parent container that has the price display
      const priceContainer = await edgeButton.locator('xpath=ancestor::div[contains(@class, "space-y")]').first();
      
      // Get the token ticker from the table row
      const row = await edgeButton.locator('xpath=ancestor::tr').first();
      const tickerCell = await row.locator('td').nth(1);
      const ticker = await tickerCell.textContent();
      
      console.log(`\nTesting token ${i + 1}: ${ticker}`);
      
      // Click the Edge button
      await edgeButton.click();
      
      // Wait for loading to complete
      try {
        await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 30000 });
      } catch (e) {
        console.log('Loading spinner timeout');
      }
      
      // Additional wait for content to update
      await page.waitForTimeout(2000);
      
      // Get the updated price container content
      const containerText = await priceContainer.textContent();
      console.log(`Container text: ${containerText}`);
      
      // Extract prices using regex
      const entryMatch = containerText.match(/Entry:\s*(\$?[\d.,]+[KMB]?)/);
      const nowMatch = containerText.match(/Now:\s*(\$?[\d.,]+[KMB]?)/);
      const athMatch = containerText.match(/ATH:\s*(\$?[\d.,]+[KMB]?)/);
      const roiMatch = containerText.match(/([+-]?\d+%)/);
      
      const entry = entryMatch ? entryMatch[1] : 'N/A';
      const now = nowMatch ? nowMatch[1] : 'N/A';
      const ath = athMatch ? athMatch[1] : 'N/A';
      const roi = roiMatch ? roiMatch[1] : 'N/A';
      
      results.push({
        ticker,
        entry,
        now,
        ath,
        roi,
        pricesAreDifferent: entry !== 'N/A' && now !== 'N/A' && entry !== now
      });
      
      console.log(`  Entry: ${entry}, Now: ${now}, ATH: ${ath}, ROI: ${roi}`);
      console.log(`  Prices are different: ${entry !== now}`);
      
      // Small delay between tests
      await page.waitForTimeout(1000);
    }
    
    // Verify results
    console.log('\n=== Test Results ===');
    results.forEach(r => {
      console.log(`${r.ticker}: Entry=${r.entry}, Now=${r.now}, Different=${r.pricesAreDifferent}, ROI=${r.roi}`);
    });
    
    // At least some tokens should have different Entry/Now prices
    const tokensWithDifferentPrices = results.filter(r => r.pricesAreDifferent).length;
    const tokensWithPrices = results.filter(r => r.entry !== 'N/A' && r.now !== 'N/A').length;
    
    console.log(`\nTokens tested: ${results.length}`);
    console.log(`Tokens with prices: ${tokensWithPrices}`);
    console.log(`Tokens with different Entry/Now prices: ${tokensWithDifferentPrices}`);
    
    // Expect at least one token to have been tested
    expect(results.length).toBeGreaterThan(0);
    
    // If we got prices, at least some should be different
    if (tokensWithPrices > 0) {
      expect(tokensWithDifferentPrices).toBeGreaterThan(0);
    }
  });

  test('Verify Edge function fixes identical price issue', async ({ page }) => {
    // Look for a specific pattern - tokens where Get Price might show identical values
    // First, let's find any row with price data or buttons
    
    const rows = await page.locator('tr').all();
    console.log(`Found ${rows.length} table rows`);
    
    let testCompleted = false;
    
    // Try to find a row with both buttons
    for (const row of rows.slice(1, 10)) { // Skip header, test up to 10 rows
      const hasGetPrice = await row.locator('button:has-text("Get Price")').count() > 0;
      const hasEdge = await row.locator('button:has-text("Edge")').count() > 0;
      
      if (hasGetPrice && hasEdge) {
        const ticker = await row.locator('td').nth(1).textContent();
        console.log(`\nTesting token: ${ticker}`);
        
        // Click Edge button
        const edgeButton = await row.locator('button:has-text("Edge")').first();
        await edgeButton.click();
        
        // Wait for loading
        await page.waitForTimeout(2000);
        try {
          await row.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 20000 });
        } catch (e) {
          console.log('Loading timeout, continuing...');
        }
        
        // Get the container with prices
        const priceContainer = await row.locator('td').nth(5); // Adjust based on table structure
        const containerText = await priceContainer.textContent();
        
        console.log(`Price container text: ${containerText}`);
        
        // Check if we have different Entry/Now values
        const hasEntry = containerText.includes('Entry:');
        const hasNow = containerText.includes('Now:');
        
        if (hasEntry && hasNow) {
          const entryMatch = containerText.match(/Entry:\s*(\$?[\d.,]+[KMB]?)/);
          const nowMatch = containerText.match(/Now:\s*(\$?[\d.,]+[KMB]?)/);
          
          if (entryMatch && nowMatch) {
            const entry = entryMatch[1];
            const now = nowMatch[1];
            
            console.log(`Entry: ${entry}, Now: ${now}`);
            console.log(`Prices are different: ${entry !== now}`);
            
            // For non-stablecoin tokens, prices should generally be different
            if (!ticker?.includes('USD') && !ticker?.includes('USDT') && !ticker?.includes('USDC')) {
              expect(entry).not.toBe(now);
            }
            
            testCompleted = true;
            break;
          }
        }
      }
    }
    
    expect(testCompleted).toBe(true);
  });
});