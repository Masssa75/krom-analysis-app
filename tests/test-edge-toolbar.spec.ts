import { test, expect } from '@playwright/test';

test.describe('Edge Function Toolbar Test', () => {
  test('Test Edge Function Test button and verify price differences', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for data to load
    
    // Look for the Edge Function Test button in the toolbar
    const edgeFunctionTestButton = await page.locator('button:has-text("Edge Function Test")').first();
    const hasEdgeTestButton = await edgeFunctionTestButton.isVisible();
    
    console.log(`Edge Function Test button visible: ${hasEdgeTestButton}`);
    
    if (hasEdgeTestButton) {
      // Click the Edge Function Test button
      console.log('Clicking Edge Function Test button...');
      await edgeFunctionTestButton.click();
      
      // Wait for any action to complete
      await page.waitForTimeout(5000);
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'after-edge-test-button.png', fullPage: true });
    }
    
    // Now examine the existing price data in the table
    console.log('\nExamining price data in the table...');
    
    // Scroll to see the table
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(1000);
    
    // Find rows with price data
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} data rows`);
    
    const priceResults = [];
    
    // Check first 10 rows for price data
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i];
      
      // Get token name
      const tokenCell = await row.locator('td').first();
      const tokenName = await tokenCell.textContent();
      
      // Look for price cell - it should be the last column
      const cells = await row.locator('td').all();
      if (cells.length > 0) {
        const priceCell = cells[cells.length - 1]; // Last cell should be Price/ROI
        const priceText = await priceCell.textContent();
        
        // Check if it contains Entry/Now data
        if (priceText && priceText.includes('Entry:') && priceText.includes('Now:')) {
          const entryMatch = priceText.match(/Entry:\s*(\$?[\d.,]+[KMB]?)/);
          const nowMatch = priceText.match(/Now:\s*(\$?[\d.,]+[KMB]?)/);
          const athMatch = priceText.match(/ATH[:\s]*(\$?[\d.,]+[KMB]?)/);
          const roiMatch = priceText.match(/([+-]?\d+%)/);
          
          if (entryMatch && nowMatch) {
            const result = {
              token: tokenName?.trim() || 'Unknown',
              entry: entryMatch[1],
              now: nowMatch[1],
              ath: athMatch ? athMatch[1] : 'N/A',
              roi: roiMatch ? roiMatch[1] : 'N/A',
              different: entryMatch[1] !== nowMatch[1]
            };
            
            priceResults.push(result);
            
            console.log(`\n${result.token}:`);
            console.log(`  Entry: ${result.entry}, Now: ${result.now}, ATH: ${result.ath}`);
            console.log(`  ROI: ${result.roi}`);
            console.log(`  Prices different: ${result.different ? '✅ YES' : '❌ NO'}`);
          }
        }
      }
    }
    
    // Also test individual Edge buttons if they exist
    const edgeButtons = await page.locator('button:has-text("Edge")').all();
    console.log(`\nFound ${edgeButtons.length} individual Edge buttons`);
    
    if (edgeButtons.length > 0 && priceResults.length < 3) {
      // Test first Edge button
      const edgeButton = edgeButtons[0];
      await edgeButton.scrollIntoViewIfNeeded();
      
      console.log('\nClicking individual Edge button...');
      await edgeButton.click();
      
      // Wait for loading
      await page.waitForTimeout(5000);
      
      // Check for updated price data
      const updatedRows = await page.locator('tbody tr').all();
      for (let i = 0; i < Math.min(5, updatedRows.length); i++) {
        const row = updatedRows[i];
        const cells = await row.locator('td').all();
        const priceCell = cells[cells.length - 1];
        const priceText = await priceCell.textContent();
        
        if (priceText && priceText.includes('Entry:') && priceText.includes('Now:') && 
            !priceResults.some(r => priceText.includes(r.entry))) {
          // This is new price data
          const entryMatch = priceText.match(/Entry:\s*(\$?[\d.,]+[KMB]?)/);
          const nowMatch = priceText.match(/Now:\s*(\$?[\d.,]+[KMB]?)/);
          
          if (entryMatch && nowMatch) {
            const tokenCell = await row.locator('td').first();
            const tokenName = await tokenCell.textContent();
            
            console.log(`\nNew price data for ${tokenName}:`);
            console.log(`  Entry: ${entryMatch[1]}, Now: ${nowMatch[1]}`);
            console.log(`  Different: ${entryMatch[1] !== nowMatch[1] ? '✅ YES' : '❌ NO'}`);
          }
        }
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Found ${priceResults.length} tokens with price data`);
    
    const differentPrices = priceResults.filter(r => r.different);
    console.log(`Tokens with different Entry/Now prices: ${differentPrices.length}/${priceResults.length}`);
    
    if (priceResults.length > 0) {
      const percentage = (differentPrices.length / priceResults.length) * 100;
      console.log(`Percentage with different prices: ${percentage.toFixed(1)}%`);
      
      // The edge function is working if we have tokens with different Entry/Now prices
      expect(differentPrices.length).toBeGreaterThan(0);
      
      console.log('\n✅ Edge function is working correctly - returning different Entry/Now prices for tokens');
    } else {
      console.log('\n❌ No price data found to verify');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'edge-test-final-result.png', fullPage: true });
  });
});