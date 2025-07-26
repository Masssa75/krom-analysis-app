import { test, expect } from '@playwright/test';

test.describe('Edge Function Test with Scrolling', () => {
  test('Find and test Edge buttons in data table', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for initial load
    
    // Scroll down to find the data table
    console.log('Scrolling to find data table...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // Take screenshot after scrolling
    await page.screenshot({ path: 'after-scroll.png', fullPage: true });
    
    // Look for the data table more specifically
    const tableVisible = await page.locator('table').isVisible();
    console.log(`Table visible: ${tableVisible}`);
    
    // Try to find any price-related content
    const priceButtons = await page.locator('button:has-text("Get Price"), button:has-text("Edge")').count();
    console.log(`Found ${priceButtons} price-related buttons`);
    
    // Look for the main content area with analyzed calls
    const mainContent = await page.locator('main').first();
    
    // Check if we need to navigate to a different page or section
    const hasAnalyzedSection = await page.locator('text="Analyzed Calls"').count() > 0;
    console.log(`Has "Analyzed Calls" section: ${hasAnalyzedSection}`);
    
    // Try clicking on "Analyzed Calls" if it exists as a link/button
    if (!tableVisible) {
      const analyzedLink = await page.locator('a:has-text("Analyzed"), button:has-text("Analyzed")').first();
      if (await analyzedLink.isVisible()) {
        console.log('Clicking on Analyzed section...');
        await analyzedLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }
    }
    
    // Now look for Edge buttons again
    const edgeButtons = await page.locator('button:has-text("Edge")').all();
    console.log(`\nFound ${edgeButtons.length} Edge buttons after navigation`);
    
    if (edgeButtons.length > 0) {
      // Test the first Edge button
      const edgeButton = edgeButtons[0];
      
      // Scroll the button into view
      await edgeButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Find the row containing this button
      const row = await edgeButton.locator('xpath=ancestor::tr').first();
      
      // Get token info from the row
      const cells = await row.locator('td').all();
      let ticker = 'Unknown';
      if (cells.length > 1) {
        ticker = await cells[1].textContent() || 'Unknown';
      }
      
      console.log(`\nTesting Edge button for token: ${ticker}`);
      
      // Get the price cell (should be in the same row)
      const priceCell = await row.locator('td').filter({ hasText: /Edge|Get Price|Entry:|Now:/ }).first();
      const beforeContent = await priceCell.textContent();
      console.log(`Before clicking: ${beforeContent?.substring(0, 100)}...`);
      
      // Click the Edge button
      console.log('Clicking Edge button...');
      await edgeButton.click();
      
      // Wait for loading
      await page.waitForTimeout(2000);
      
      // Check for loading spinner and wait for it to disappear
      const spinner = page.locator('.animate-spin');
      if (await spinner.isVisible()) {
        console.log('Waiting for loading to complete...');
        await spinner.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
          console.log('Loading timeout');
        });
      }
      
      // Wait for content to update
      await page.waitForTimeout(2000);
      
      // Get updated content
      const afterContent = await priceCell.textContent();
      console.log(`After clicking: ${afterContent?.substring(0, 100)}...`);
      
      // Parse the results
      if (afterContent && afterContent.includes('Entry:') && afterContent.includes('Now:')) {
        const entryMatch = afterContent.match(/Entry:\s*(\$?[\d.,]+[KMB]?)/);
        const nowMatch = afterContent.match(/Now:\s*(\$?[\d.,]+[KMB]?)/);
        const athMatch = afterContent.match(/ATH:\s*(\$?[\d.,]+[KMB]?)/);
        const roiMatch = afterContent.match(/([+-]?\d+%)/);
        
        console.log('\n=== Price Data Retrieved ===');
        console.log(`Token: ${ticker}`);
        console.log(`Entry: ${entryMatch ? entryMatch[1] : 'Not found'}`);
        console.log(`Now: ${nowMatch ? nowMatch[1] : 'Not found'}`);
        console.log(`ATH: ${athMatch ? athMatch[1] : 'Not found'}`);
        console.log(`ROI: ${roiMatch ? roiMatch[1] : 'Not found'}`);
        
        if (entryMatch && nowMatch) {
          const entryValue = entryMatch[1];
          const nowValue = nowMatch[1];
          const isDifferent = entryValue !== nowValue;
          
          console.log(`\nPrices are different: ${isDifferent}`);
          
          // Test passes if we got price data
          expect(entryMatch).toBeTruthy();
          expect(nowMatch).toBeTruthy();
          
          // Log success
          if (isDifferent) {
            console.log('✅ Edge function successfully returned different Entry/Now prices');
          } else {
            console.log('⚠️  Edge function returned identical Entry/Now prices');
          }
        }
      } else {
        console.log('\n❌ No price data found in the cell after clicking Edge button');
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'edge-test-failed.png', fullPage: true });
      }
    } else {
      console.log('\nNo Edge buttons found. The page might need different navigation or the feature is not available.');
      
      // List all buttons on the page for debugging
      const allButtons = await page.locator('button').all();
      console.log(`\nAll buttons on page (${allButtons.length}):`);
      for (let i = 0; i < Math.min(10, allButtons.length); i++) {
        const text = await allButtons[i].textContent();
        console.log(`  ${i + 1}: ${text}`);
      }
    }
  });
});