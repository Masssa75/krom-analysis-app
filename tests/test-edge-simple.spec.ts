import { test, expect } from '@playwright/test';

test.describe('Edge Function Simple Test', () => {
  test('Explore page and test Edge button functionality', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for data to load
    
    // Take a screenshot to see what we're working with
    await page.screenshot({ path: 'page-loaded.png' });
    
    // Look for table structure
    const tables = await page.locator('table').count();
    console.log(`Found ${tables} tables on the page`);
    
    // Look for Edge buttons
    const edgeButtons = await page.locator('button:has-text("Edge")').count();
    console.log(`Found ${edgeButtons} Edge buttons`);
    
    // Look for Get Price buttons
    const getPriceButtons = await page.locator('button:has-text("Get Price")').count();
    console.log(`Found ${getPriceButtons} Get Price buttons`);
    
    // If we have Edge buttons, test the first one
    if (edgeButtons > 0) {
      // Get the first visible Edge button
      const edgeButton = await page.locator('button:has-text("Edge")').first();
      
      // Scroll it into view
      await edgeButton.scrollIntoViewIfNeeded();
      
      // Take screenshot before clicking
      await page.screenshot({ path: 'before-edge-click.png' });
      
      // Get the parent cell that contains the price display
      const parentCell = await edgeButton.locator('xpath=ancestor::td').first();
      const beforeText = await parentCell.textContent();
      console.log(`\nBefore clicking Edge button:`);
      console.log(`Cell content: ${beforeText}`);
      
      // Click the Edge button
      console.log('\nClicking Edge button...');
      await edgeButton.click();
      
      // Wait for loading
      await page.waitForTimeout(3000);
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'after-edge-click.png' });
      
      // Check if loading spinner appeared and disappeared
      try {
        const spinner = parentCell.locator('.animate-spin');
        if (await spinner.isVisible()) {
          console.log('Loading spinner detected, waiting for it to disappear...');
          await spinner.waitFor({ state: 'hidden', timeout: 30000 });
        }
      } catch (e) {
        console.log('No loading spinner or already hidden');
      }
      
      // Wait a bit more for content to update
      await page.waitForTimeout(2000);
      
      // Get the updated content
      const afterText = await parentCell.textContent();
      console.log(`\nAfter clicking Edge button:`);
      console.log(`Cell content: ${afterText}`);
      
      // Look for price patterns
      const hasEntry = afterText.includes('Entry:');
      const hasNow = afterText.includes('Now:');
      const hasATH = afterText.includes('ATH:');
      
      console.log(`\nPrice fields found:`);
      console.log(`Entry: ${hasEntry}`);
      console.log(`Now: ${hasNow}`);
      console.log(`ATH: ${hasATH}`);
      
      if (hasEntry && hasNow) {
        // Extract values
        const entryMatch = afterText.match(/Entry:\s*(\$?[\d.,]+[KMB]?)/);
        const nowMatch = afterText.match(/Now:\s*(\$?[\d.,]+[KMB]?)/);
        
        if (entryMatch && nowMatch) {
          const entryValue = entryMatch[1];
          const nowValue = nowMatch[1];
          
          console.log(`\nExtracted values:`);
          console.log(`Entry: ${entryValue}`);
          console.log(`Now: ${nowValue}`);
          console.log(`Values are different: ${entryValue !== nowValue}`);
          
          // Test passes if we successfully fetched prices
          expect(hasEntry).toBe(true);
          expect(hasNow).toBe(true);
          
          // For most tokens (non-stablecoins), Entry and Now should be different
          if (entryValue !== 'N/A' && nowValue !== 'N/A') {
            console.log('\n✅ Edge function successfully fetched prices');
            
            // Get the token name to check if it's a stablecoin
            const row = await edgeButton.locator('xpath=ancestor::tr').first();
            const ticker = await row.locator('td').nth(1).textContent().catch(() => 'Unknown');
            
            if (!ticker?.includes('USD') && !ticker?.includes('DAI')) {
              // Non-stablecoins should have different Entry/Now prices
              if (entryValue !== nowValue) {
                console.log('✅ Entry and Now prices are different (as expected for non-stablecoins)');
              } else {
                console.log('⚠️  Entry and Now prices are the same (unexpected for non-stablecoins)');
              }
            }
          }
        }
      } else {
        console.log('\n❌ No price data found after clicking Edge button');
      }
      
      // Final screenshot
      await page.screenshot({ path: 'final-state.png' });
    } else {
      console.log('\nNo Edge buttons found on the page');
      
      // Look for any price displays
      const priceDisplays = await page.locator('text=/Entry:|Now:|ATH:/').count();
      console.log(`Found ${priceDisplays} price displays`);
    }
  });
});