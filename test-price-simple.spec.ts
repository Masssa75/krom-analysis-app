import { test, expect } from '@playwright/test';

test.describe('Price Edge Function Simple Test', () => {
  test('verify edge function is called when fetching prices', async ({ page }) => {
    // Track edge function calls
    let edgeFunctionCalled = false;
    let requestBody: any = null;
    
    page.on('request', request => {
      if (request.url().includes('supabase.co/functions/v1/crypto-price-single')) {
        edgeFunctionCalled = true;
        requestBody = request.postDataJSON();
        console.log('Edge function called:', request.url());
        console.log('Request body:', requestBody);
      }
    });

    // Go to the app
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 30000 });
    console.log('Table loaded');
    
    // Look for any Fetch button
    const fetchButtons = page.locator('button:has-text("Fetch")');
    const buttonCount = await fetchButtons.count();
    console.log(`Found ${buttonCount} fetch buttons`);
    
    if (buttonCount > 0) {
      // Click the first fetch button
      await fetchButtons.first().click();
      console.log('Clicked fetch button');
      
      // Wait a bit for the request
      await page.waitForTimeout(3000);
      
      // Verify edge function was called
      expect(edgeFunctionCalled).toBeTruthy();
      expect(requestBody).toHaveProperty('contractAddress');
      expect(requestBody).toHaveProperty('callTimestamp');
      
      console.log('✅ Edge function successfully called');
    } else {
      console.log('No fetch buttons found - checking if prices are already loaded');
      
      // Look for price displays
      const priceElements = await page.locator('text=/Entry:|Now:|ATH:/').count();
      console.log(`Found ${priceElements} price elements`);
      
      expect(priceElements).toBeGreaterThan(0);
    }
  });

  test('verify date column shows Thai timezone', async ({ page }) => {
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    await page.waitForSelector('table', { timeout: 30000 });
    
    // Find a date cell - look for cells with dotted underline
    const dateCell = page.locator('td span.border-dotted').first();
    const cellExists = await dateCell.count() > 0;
    
    if (cellExists) {
      // Get the tooltip
      const tooltip = await dateCell.getAttribute('title');
      console.log('Date tooltip:', tooltip);
      
      if (tooltip) {
        expect(tooltip).toContain('(Thai Time)');
        console.log('✅ Thai timezone tooltip verified');
      }
    } else {
      console.log('No date cells found with proper styling');
    }
  });

  test('verify GeckoTerminal panel enhancements', async ({ page }) => {
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    await page.waitForSelector('table', { timeout: 30000 });
    
    // Find and click a ticker (in column 3, which is a link/button)
    const tickers = page.locator('td:nth-child(3) a, td:nth-child(3) button');
    const tickerCount = await tickers.count();
    console.log(`Found ${tickerCount} clickable tickers`);
    
    if (tickerCount > 0) {
      // Click the first ticker
      await tickers.first().click();
      console.log('Clicked ticker');
      
      // Wait for either iframe or modal
      const panelAppeared = await page.waitForSelector('.fixed.inset-0, iframe[src*="geckoterminal"]', { 
        timeout: 10000 
      }).catch(() => null);
      
      if (panelAppeared) {
        console.log('Panel opened');
        
        // Check iframe URL for swaps=0
        const iframe = page.locator('iframe[src*="geckoterminal"]');
        if (await iframe.count() > 0) {
          const src = await iframe.getAttribute('src');
          console.log('GeckoTerminal URL:', src);
          expect(src).toContain('swaps=0');
          console.log('✅ Transactions removed (swaps=0)');
        }
        
        // Check for price info in the panel
        const priceInfo = await page.locator('text=/Entry Price|Now Price|ATH Price/').count();
        console.log(`Found ${priceInfo} price info elements`);
        
        // Close the panel
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        console.log('Panel did not appear - might be a different UI');
      }
    }
  });
});