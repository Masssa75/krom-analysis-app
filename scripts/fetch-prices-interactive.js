const { chromium } = require('playwright');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

(async () => {
  console.log('KROM Analysis - Batch Price Fetcher\n');
  
  // Get user input
  const pageNumber = await question('Which page number do you want to fetch prices for? (default: 5): ');
  const targetPage = parseInt(pageNumber) || 5;
  
  const headlessMode = await question('Run in background mode? (y/n, default: n): ');
  const isHeadless = headlessMode.toLowerCase() === 'y';
  
  rl.close();
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: isHeadless,
    slowMo: isHeadless ? 0 : 50 // Only slow down in visible mode
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('\nNavigating to KROM Analysis App...');
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    
    // Wait for the page to load
    await page.waitForSelector('text=Previously Analyzed Calls', { timeout: 10000 });
    
    // Navigate to target page
    console.log(`Navigating to page ${targetPage}...`);
    
    // Click the page number directly if visible
    try {
      await page.click(`text="${targetPage}"`, { timeout: 5000 });
      await page.waitForTimeout(2000);
    } catch (e) {
      // Alternative: Click next button multiple times
      for (let i = 1; i < targetPage; i++) {
        try {
          await page.click('button:has-text("›")', { timeout: 2000 });
          await page.waitForTimeout(1000);
        } catch (navError) {
          console.log(`Could not navigate to page ${targetPage}`);
          break;
        }
      }
    }
    
    // Wait for table to load
    await page.waitForTimeout(2000);
    
    // Find all "Get Price" buttons
    let getPriceButtons = await page.locator('button:has-text("Get Price")').all();
    console.log(`\nFound ${getPriceButtons.length} items without prices on page ${targetPage}`);
    
    if (getPriceButtons.length === 0) {
      console.log('All items on this page already have price data!');
      await browser.close();
      return;
    }
    
    console.log('Starting to fetch prices (this will take a few minutes)...\n');
    
    // Click each button with a delay between clicks
    let successCount = 0;
    let processedCount = 0;
    
    while (getPriceButtons.length > 0) {
      processedCount++;
      
      try {
        // Always get the first "Get Price" button (as they disappear after clicking)
        const button = getPriceButtons[0];
        
        if (await button.isVisible()) {
          console.log(`[${new Date().toLocaleTimeString()}] Processing item ${processedCount}...`);
          
          // Click the button
          await button.click();
          successCount++;
          
          // Wait for the price to load (2.5 seconds to respect rate limits)
          await page.waitForTimeout(2500);
          
          // Re-find buttons as the DOM has changed
          getPriceButtons = await page.locator('button:has-text("Get Price")').all();
        }
        
      } catch (error) {
        console.error(`Error processing item ${processedCount}: ${error.message}`);
        // Try to continue with remaining buttons
        getPriceButtons = await page.locator('button:has-text("Get Price")').all();
      }
    }
    
    console.log(`\n✅ Finished fetching prices!`);
    console.log(`📊 Successfully fetched: ${successCount} prices`);
    console.log(`📍 Page processed: ${targetPage}`);
    
    if (!isHeadless) {
      console.log('\nKeeping browser open for 10 seconds to see results...');
      await page.waitForTimeout(10000);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
    console.log('\nDone!');
  }
})();