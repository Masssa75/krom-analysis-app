import { test, expect } from '@playwright/test';

test.describe('Price Refresh Functionality', () => {
  test('should refresh stale prices on page load', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`Browser console: ${msg.text()}`);
      }
    });

    // Monitor network requests
    const priceRefreshRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/refresh-prices')) {
        console.log('Price refresh request detected:', request.url());
        priceRefreshRequests.push(request);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/refresh-prices')) {
        console.log('Price refresh response:', response.status());
        response.json().then(data => {
          console.log('Response data:', JSON.stringify(data, null, 2));
        }).catch(() => {});
      }
    });

    // Navigate to the page
    console.log('Navigating to app...');
    await page.goto('https://lively-torrone-8199e0.netlify.app', {
      waitUntil: 'networkidle'
    });

    // Wait for the page to load
    await page.waitForSelector('table', { timeout: 30000 });
    console.log('Page loaded, table found');

    // Find a token with price info
    const priceElements = await page.locator('[title*="Last updated:"]').all();
    console.log(`Found ${priceElements.length} price elements`);

    if (priceElements.length > 0) {
      // Hover over the first price element to see the tooltip
      const firstPrice = priceElements[0];
      await firstPrice.hover();
      
      // Get the tooltip text
      const tooltipText = await firstPrice.getAttribute('title');
      console.log('First price tooltip:', tooltipText);
      
      // Check if it contains a timestamp
      if (tooltipText?.includes('Last updated:')) {
        const match = tooltipText.match(/Last updated: (.+?) \(Thai Time\)/);
        if (match) {
          const lastUpdated = new Date(match[1]);
          const now = new Date();
          const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
          console.log(`Price was last updated ${diffMinutes.toFixed(1)} minutes ago`);
        }
      }
    }

    // Wait a bit to see if refresh-prices was called
    await page.waitForTimeout(5000);

    console.log(`Total refresh-prices requests: ${priceRefreshRequests.length}`);
    
    // Check if refresh was triggered
    expect(priceRefreshRequests.length).toBeGreaterThan(0);
  });

  test('check individual token price staleness', async ({ page }) => {
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    await page.waitForSelector('table');

    // Get all rows
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} tokens`);

    // Check first 5 tokens
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      
      // Get token name
      const tokenName = await row.locator('td:first-child').textContent();
      
      // Find price element with "Now:" text
      const priceElement = await row.locator('span:has-text("Now:")').first();
      
      if (await priceElement.isVisible()) {
        await priceElement.hover();
        
        // Try to get the parent element's title attribute
        const parent = await priceElement.locator('..').first();
        const tooltipText = await parent.getAttribute('title');
        
        if (tooltipText?.includes('Last updated:')) {
          console.log(`\nToken: ${tokenName}`);
          console.log(`Tooltip: ${tooltipText}`);
          
          // Parse the time
          const match = tooltipText.match(/Last updated: (.+?) \(Thai Time\)/);
          if (match) {
            const dateStr = match[1];
            // Parse the date - format is like "Jul 30, 2025, 7:02 AM"
            const lastUpdated = new Date(dateStr);
            const now = new Date();
            const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
            
            console.log(`Last updated: ${dateStr}`);
            console.log(`Minutes ago: ${diffMinutes.toFixed(1)}`);
            console.log(`Should refresh: ${diffMinutes > 60 ? 'YES' : 'NO'} (>60 min for old tokens)`);
          }
        }
      }
    }
  });
});