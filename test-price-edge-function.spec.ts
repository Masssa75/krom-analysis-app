import { test, expect } from '@playwright/test';

test.describe('Price Fetching Edge Function Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the deployed app
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should fetch and display token prices using edge function', async ({ page }) => {
    // Wait for analyzed calls to load
    await page.waitForSelector('tbody tr', { timeout: 30000 });
    
    // Find a row with a price display component
    const firstRow = page.locator('tbody tr').first();
    
    // Check if price display exists
    const priceDisplay = firstRow.locator('td:nth-child(10)'); // Price column
    await expect(priceDisplay).toBeVisible();
    
    // Look for "Fetch" button or price data
    const fetchButton = priceDisplay.locator('button:has-text("Fetch")');
    
    if (await fetchButton.count() > 0) {
      console.log('Found Fetch button, clicking to trigger edge function...');
      
      // Set up request listener to verify edge function is called
      const edgeFunctionPromise = page.waitForRequest(request => 
        request.url().includes('supabase.co/functions/v1/crypto-price-single') &&
        request.method() === 'POST'
      );
      
      // Click the fetch button
      await fetchButton.click();
      
      // Wait for the edge function request
      const edgeFunctionRequest = await edgeFunctionPromise;
      console.log('Edge function called:', edgeFunctionRequest.url());
      
      // Verify request body
      const requestBody = edgeFunctionRequest.postDataJSON();
      expect(requestBody).toHaveProperty('contractAddress');
      expect(requestBody).toHaveProperty('callTimestamp');
      console.log('Request body:', requestBody);
      
      // Wait for price to appear (replace button with price data)
      await page.waitForFunction(
        el => !el.querySelector('button:has-text("Fetch")'),
        priceDisplay.elementHandle(),
        { timeout: 30000 }
      );
      
      // Check for price elements
      const entryPrice = priceDisplay.locator('text=/Entry:/');
      const nowPrice = priceDisplay.locator('text=/Now:/');
      
      // At least one price should be visible
      const hasEntry = await entryPrice.count() > 0;
      const hasNow = await nowPrice.count() > 0;
      
      expect(hasEntry || hasNow).toBeTruthy();
      console.log('Price data displayed successfully');
      
      // Check for ATH if available
      const athElement = priceDisplay.locator('text=/ATH:/');
      if (await athElement.count() > 0) {
        console.log('ATH data also displayed');
      }
    } else {
      console.log('Price already fetched for first row');
      
      // Verify price display format
      const priceText = await priceDisplay.textContent();
      console.log('Price display:', priceText);
      
      // Should contain Entry or Now price
      expect(priceText).toMatch(/Entry:|Now:/);
    }
  });

  test('should handle multiple price fetches in parallel', async ({ page }) => {
    // Wait for analyzed calls
    await page.waitForSelector('tbody tr', { timeout: 30000 });
    
    // Get all fetch buttons
    const fetchButtons = page.locator('button:has-text("Fetch")');
    const buttonCount = await fetchButtons.count();
    
    if (buttonCount >= 2) {
      console.log(`Found ${buttonCount} fetch buttons, testing parallel fetches...`);
      
      // Set up request counter
      let edgeFunctionCalls = 0;
      page.on('request', request => {
        if (request.url().includes('supabase.co/functions/v1/crypto-price-single')) {
          edgeFunctionCalls++;
        }
      });
      
      // Click first two buttons quickly
      await fetchButtons.nth(0).click();
      await fetchButtons.nth(1).click();
      
      // Wait a bit for requests to complete
      await page.waitForTimeout(5000);
      
      // Verify multiple edge function calls
      expect(edgeFunctionCalls).toBeGreaterThanOrEqual(2);
      console.log(`Edge function called ${edgeFunctionCalls} times`);
    } else {
      console.log('Not enough fetch buttons for parallel test');
    }
  });

  test('should display Thai timezone for call dates', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 30000 });
    
    // Find date column (should be 7th column)
    const dateCell = page.locator('tbody tr').first().locator('td:nth-child(7)');
    await expect(dateCell).toBeVisible();
    
    // Hover over date to see tooltip
    await dateCell.hover();
    
    // Get the title attribute
    const titleText = await dateCell.locator('span').getAttribute('title');
    console.log('Date tooltip:', titleText);
    
    // Verify Thai timezone is mentioned
    expect(titleText).toContain('(Thai Time)');
    
    // Verify date format
    expect(titleText).toMatch(/\w{3} \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M \(Thai Time\)/);
  });

  test('should show enhanced GeckoTerminal panel', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 30000 });
    
    // Click on a ticker to open details
    const ticker = page.locator('tbody tr').first().locator('td:nth-child(3) button');
    await ticker.click();
    
    // Wait for GeckoTerminal panel
    await page.waitForSelector('iframe[src*="geckoterminal.com"]', { timeout: 10000 });
    
    // Verify panel size (should be maximized)
    const panel = page.locator('.fixed.inset-0'); // Full screen overlay
    await expect(panel).toBeVisible();
    
    // Check for price info grid
    const priceGrid = page.locator('text=/Entry Price:|Now Price:|ATH Price:/');
    const hasAnyPrice = await priceGrid.count() > 0;
    
    if (hasAnyPrice) {
      console.log('Price info grid is displayed in GeckoTerminal panel');
    }
    
    // Verify no transactions section (swaps=0)
    const iframe = page.locator('iframe[src*="geckoterminal.com"]');
    const iframeSrc = await iframe.getAttribute('src');
    console.log('GeckoTerminal URL:', iframeSrc);
    expect(iframeSrc).toContain('swaps=0');
    
    // Check for call timestamp in header
    const headerTimestamp = page.locator('.text-muted-foreground:has-text("Call:")');
    if (await headerTimestamp.count() > 0) {
      const timestampText = await headerTimestamp.textContent();
      console.log('Call timestamp in header:', timestampText);
      expect(timestampText).toContain('Call:');
    }
    
    // Close the panel
    const closeButton = page.locator('button:has-text("✕")');
    await closeButton.click();
  });
});