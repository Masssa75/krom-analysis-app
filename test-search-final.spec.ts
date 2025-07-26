import { test } from '@playwright/test';

test('test contract search functionality', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Wait for initial data
  await page.waitForSelector('tbody tr', { timeout: 30000 });
  
  const searchInput = page.locator('input[placeholder*="Search"]');
  
  // Test 1: Search by ticker
  console.log('\n1. Testing ticker search for "LUCKY"...');
  await searchInput.fill('LUCKY');
  await page.waitForTimeout(2000);
  
  let rows = page.locator('tbody tr');
  let count = await rows.count();
  console.log(`Results: ${count}`);
  
  if (count > 0) {
    const firstToken = await rows.first().locator('td').first().textContent();
    console.log('First result:', firstToken);
  }
  
  // Test 2: Clear and search by contract
  console.log('\n2. Testing contract address search...');
  await searchInput.clear();
  await searchInput.fill('0x30a538eFFD91ACeFb1b12CE9Bc0074eD18c9dFc9');
  await page.waitForTimeout(2000);
  
  count = await rows.count();
  console.log(`Results for full contract: ${count}`);
  
  if (count > 0) {
    const firstRow = rows.first();
    const token = await firstRow.locator('td').nth(0).textContent();
    const contract = await firstRow.locator('td').nth(1).textContent();
    const date = await firstRow.locator('td').nth(2).textContent();
    
    console.log('\n✅ Found token:');
    console.log('Token:', token);
    console.log('Contract:', contract);
    console.log('Date:', date);
    
    // Check if it's the T token
    if (token?.trim() === 'T') {
      console.log('✅ Successfully found T token by contract address!');
      
      // Check price
      const priceCell = firstRow.locator('td').nth(9);
      const priceText = await priceCell.textContent();
      console.log('Price status:', priceText || 'No price data');
      
      // Screenshot
      await page.screenshot({ path: 't-token-search-success.png' });
    }
  } else {
    // Try lowercase
    console.log('\n3. Trying lowercase contract...');
    await searchInput.clear();
    await searchInput.fill('0x30a538effd91acefb1b12ce9bc0074ed18c9dfc9');
    await page.waitForTimeout(2000);
    
    count = await rows.count();
    console.log(`Results for lowercase: ${count}`);
  }
  
  // Test 3: Partial contract search
  console.log('\n4. Testing partial contract search...');
  await searchInput.clear();
  await searchInput.fill('30a538');
  await page.waitForTimeout(2000);
  
  count = await rows.count();
  console.log(`Results for partial contract: ${count}`);
});