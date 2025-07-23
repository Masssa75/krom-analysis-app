const { chromium } = require('playwright');

(async () => {
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false, // Set to true for background operation
    slowMo: 50 // Slow down by 50ms to see what's happening
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('Navigating to KROM Analysis App...');
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    
    // Wait for the page to load
    await page.waitForSelector('text=Previously Analyzed Calls', { timeout: 10000 });
    
    // Close any modals that might be open
    const closeModal = async () => {
      try {
        const modalCloseButton = await page.locator('button:has-text("×")').first();
        if (await modalCloseButton.isVisible()) {
          await modalCloseButton.click();
          await page.waitForTimeout(500);
        }
      } catch (e) {
        // Modal might not exist, that's fine
      }
    };
    
    await closeModal();
    
    // Navigate directly to a page that likely has items without prices
    // You can change this number to go to a different page
    const targetPage = 5; // Change this to the page you want
    
    console.log(`Navigating to page ${targetPage}...`);
    
    // Click the page number directly if visible
    try {
      await page.click(`text="${targetPage}"`, { timeout: 5000 });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Could not click page number directly, trying navigation buttons...');
      
      // Alternative: Use next button multiple times
      for (let i = 1; i < targetPage; i++) {
        const nextButton = await page.locator('button[title="Next page"]').first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Wait for table to load
    await page.waitForTimeout(2000);
    
    // Find all "Get Price" buttons
    const getPriceButtons = await page.locator('button:has-text("Get Price")').all();
    console.log(`Found ${getPriceButtons.length} "Get Price" buttons on page ${targetPage}`);
    
    if (getPriceButtons.length === 0) {
      console.log('No "Get Price" buttons found on this page');
      console.log('Try changing the targetPage variable to a different page number');
      await browser.close();
      return;
    }
    
    // Click each button with a delay between clicks
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < getPriceButtons.length; i++) {
      try {
        // Check if button is still visible (it might have changed after fetching)
        if (await getPriceButtons[i].isVisible()) {
          console.log(`Clicking button ${i + 1} of ${getPriceButtons.length}...`);
          
          // Click the button
          await getPriceButtons[i].click();
          successCount++;
          
          // Wait for the price to load (3 seconds to respect rate limits)
          await page.waitForTimeout(3000);
        }
        
      } catch (error) {
        console.error(`Error clicking button ${i + 1}:`, error.message);
        errorCount++;
        // Continue with the next button even if one fails
      }
    }
    
    console.log(`\nFinished fetching prices!`);
    console.log(`Successfully clicked: ${successCount} buttons`);
    console.log(`Errors: ${errorCount}`);
    
    // Keep browser open for 10 seconds to see the results
    console.log('\nKeeping browser open for 10 seconds to see results...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();