import { test, expect } from '@playwright/test';

test('Debug price API directly', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Get a contract address from the page
  const firstRow = page.locator('tr').filter({ hasText: 'Details' }).first();
  const rowText = await firstRow.textContent();
  console.log('First row:', rowText);
  
  // Extract the token ticker
  const tickerMatch = rowText?.match(/([A-Z0-9]+)\s*2\.0/);
  const ticker = tickerMatch?.[1];
  console.log('Token ticker:', ticker);
  
  // Try to make a direct API call using page.evaluate
  const response = await page.evaluate(async () => {
    try {
      // Try to get price for a known token
      const testData = {
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
        callTimestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        network: 'eth'
      };
      
      const response = await fetch('/api/token-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      return {
        status: response.status,
        data: data,
        error: !response.ok ? data.error : null
      };
    } catch (error) {
      return {
        status: 0,
        data: null,
        error: error.message
      };
    }
  });
  
  console.log('API Response:', JSON.stringify(response, null, 2));
  
  // Also check the GeckoTerminal guessNetwork function
  const networkTests = await page.evaluate(() => {
    // Simulate the guessNetwork logic
    const guessNetwork = (address) => {
      if (address.length === 42 && address.startsWith('0x')) {
        return 'eth';
      } else if (address.length >= 32 && address.length <= 44 && !address.startsWith('0x')) {
        return 'solana';
      }
      return 'eth';
    };
    
    return {
      eth: guessNetwork('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
      solana: guessNetwork('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      random: guessNetwork('abc123')
    };
  });
  
  console.log('Network detection tests:', networkTests);
});