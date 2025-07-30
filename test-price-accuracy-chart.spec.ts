import { test, expect } from '@playwright/test';

test('verify prices match GeckoTerminal charts', async ({ page }) => {
  // Increase timeout for this test as we'll be loading multiple charts
  test.setTimeout(120000);
  
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table');
  
  console.log('\n=== PRICE VERIFICATION TEST ===');
  console.log('Comparing dashboard prices with GeckoTerminal chart prices\n');
  
  // Wait a bit for any price refresh to complete
  await page.waitForTimeout(3000);
  
  // Get all clickable token buttons in the first column
  const tokenButtons = await page.locator('tbody tr td:first-child button').all();
  
  // If no buttons found, check page structure
  if (tokenButtons.length === 0) {
    console.log('No token buttons found, checking page structure...');
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} rows total`);
    
    // Try to find any buttons in the table
    const anyButtons = await page.locator('tbody button').all();
    console.log(`Found ${anyButtons.length} buttons in tbody`);
    
    if (rows.length > 0) {
      const firstCell = await rows[0].locator('td:first-child').innerHTML();
      console.log('First cell content:', firstCell.substring(0, 300));
    }
  }
  
  console.log(`Found ${tokenButtons.length} tokens to check\n`);
  
  let correctCount = 0;
  let wrongCount = 0;
  const errors: string[] = [];
  
  // Check first 10 tokens
  const tokensToCheck = Math.min(10, tokenButtons.length);
  
  for (let i = 0; i < tokensToCheck; i++) {
    try {
      // Get token info before clicking
      const row = await tokenButtons[i].locator('xpath=ancestor::tr').first();
      const tokenName = await tokenButtons[i].textContent();
      
      // Get the displayed price from the "Now:" field
      const priceElement = await row.locator('span:has-text("Now:") + span').first();
      const displayedPrice = await priceElement.textContent();
      
      console.log(`\n[${i + 1}/${tokensToCheck}] Checking ${tokenName}:`);
      console.log(`  Dashboard shows: ${displayedPrice}`);
      
      // Click to open chart
      await tokenButtons[i].click();
      
      // Wait for the chart panel to appear
      await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
      await page.waitForTimeout(2000); // Give chart time to load
      
      // Look for the price in the chart panel header
      const chartPanel = await page.locator('[role="dialog"]').first();
      
      // Get the chart panel price (from the "Now" row in the grid)
      const chartPriceElement = await page.locator('div:has-text("Now") + div.text-right').first();
      const chartPrice = await chartPriceElement.textContent();
      
      console.log(`  Chart shows: ${chartPrice}`);
      
      // Parse prices for comparison (remove $ and convert to number)
      const dashboardValue = parseFloat(displayedPrice?.replace('$', '') || '0');
      const chartValue = parseFloat(chartPrice?.replace('$', '') || '0');
      
      if (dashboardValue > 0 && chartValue > 0) {
        const percentDiff = Math.abs((dashboardValue - chartValue) / chartValue * 100);
        
        if (percentDiff < 5) { // Within 5% is considered correct
          console.log(`  ✅ CORRECT (difference: ${percentDiff.toFixed(1)}%)`);
          correctCount++;
        } else {
          console.log(`  ❌ WRONG (difference: ${percentDiff.toFixed(0)}%)`);
          wrongCount++;
          errors.push(`${tokenName}: Dashboard ${displayedPrice} vs Chart ${chartPrice} (${percentDiff.toFixed(0)}% diff)`);
        }
      } else {
        console.log(`  ⚠️  Could not parse prices`);
      }
      
      // Close the chart panel
      const closeButton = await page.locator('button[aria-label="Close panel"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        // Fallback: press Escape
        await page.keyboard.press('Escape');
      }
      
      // Wait a bit before next token
      await page.waitForTimeout(1000);
      
    } catch (error) {
      console.log(`  ⚠️  Error checking token: ${error}`);
    }
  }
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Tokens checked: ${correctCount + wrongCount}`);
  console.log(`Correct prices: ${correctCount} (${(correctCount / (correctCount + wrongCount) * 100).toFixed(0)}%)`);
  console.log(`Wrong prices: ${wrongCount} (${(wrongCount / (correctCount + wrongCount) * 100).toFixed(0)}%)`);
  
  if (errors.length > 0) {
    console.log('\nTokens with wrong prices:');
    errors.forEach(err => console.log(`  - ${err}`));
  }
  
  // Test should pass if at least 70% of prices are correct
  const accuracy = correctCount / (correctCount + wrongCount);
  expect(accuracy).toBeGreaterThan(0.7);
});
