import { test, expect } from '@playwright/test';

test('debug price fetching', async ({ page }) => {
  // Enable verbose console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console error:', msg.text());
    }
  });

  // Track ALL network requests
  const requests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    requests.push(url);
    if (url.includes('api') || url.includes('function')) {
      console.log(`📡 API Request: ${request.method()} ${url}`);
      if (request.method() === 'POST') {
        try {
          const body = request.postDataJSON();
          console.log('   Body:', JSON.stringify(body, null, 2));
        } catch (e) {
          // Ignore if can't parse
        }
      }
    }
  });

  // Track responses
  page.on('response', response => {
    const url = response.url();
    if (url.includes('api') || url.includes('function')) {
      console.log(`📥 API Response: ${response.status()} ${url}`);
    }
  });

  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  console.log('✅ Page loaded');

  // Wait for the table
  await page.waitForSelector('table', { timeout: 30000 });
  console.log('✅ Table visible');

  // Check what's in the price column
  const priceCell = page.locator('tbody tr').first().locator('td:nth-child(10)');
  const priceCellContent = await priceCell.textContent();
  console.log('💰 Price cell content:', priceCellContent);

  // Look for fetch button
  const fetchButton = priceCell.locator('button:has-text("Fetch")');
  const hasFetchButton = await fetchButton.count() > 0;
  
  if (hasFetchButton) {
    console.log('🔘 Found Fetch button');
    
    // Click and wait
    await fetchButton.click();
    console.log('👆 Clicked Fetch button');
    
    // Wait for any network activity
    await page.waitForTimeout(5000);
    
    // Check if price appeared
    const newContent = await priceCell.textContent();
    console.log('💰 New price cell content:', newContent);
    
    // List all API calls made
    console.log('\n📊 All API/Function calls made:');
    requests
      .filter(url => url.includes('api') || url.includes('function'))
      .forEach(url => console.log('  -', url));
  } else {
    console.log('💵 Price already displayed or no Fetch button');
    
    // Check for refetch button
    const refetchButton = priceCell.locator('button[title="Refetch price"]');
    if (await refetchButton.count() > 0) {
      console.log('🔄 Found Refetch button, clicking...');
      await refetchButton.click();
      await page.waitForTimeout(3000);
    }
  }

  // Check date column (7th column)
  console.log('\n📅 Checking date column:');
  const dateCell = page.locator('tbody tr').first().locator('td:nth-child(7)');
  const dateContent = await dateCell.textContent();
  const dateTooltip = await dateCell.locator('span').getAttribute('title');
  console.log('Date displayed:', dateContent);
  console.log('Date tooltip:', dateTooltip);

  // Try opening GeckoTerminal panel
  console.log('\n📊 Checking GeckoTerminal panel:');
  const tickerCell = page.locator('tbody tr').first().locator('td:nth-child(3)');
  const tickerLink = tickerCell.locator('a, button').first();
  
  if (await tickerLink.count() > 0) {
    const tickerText = await tickerLink.textContent();
    console.log('Ticker:', tickerText);
    
    // Get current number of iframes
    const iframesBefore = await page.locator('iframe').count();
    
    await tickerLink.click();
    console.log('Clicked ticker');
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    // Check for new elements
    const iframesAfter = await page.locator('iframe').count();
    const hasModal = await page.locator('.fixed.inset-0').count() > 0;
    
    console.log('Iframes before:', iframesBefore, 'after:', iframesAfter);
    console.log('Modal appeared:', hasModal);
    
    if (iframesAfter > iframesBefore) {
      const iframe = page.locator('iframe').last();
      const src = await iframe.getAttribute('src');
      console.log('GeckoTerminal iframe URL:', src);
    }
  }
});