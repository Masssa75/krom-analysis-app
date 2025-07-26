import { test, expect } from '@playwright/test';

test('check analyzed data and UI elements', async ({ page }) => {
  // Navigate
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForLoadState('networkidle');

  // Wait for table
  await page.waitForSelector('table', { timeout: 30000 });

  // Count rows
  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  console.log(`📊 Found ${rowCount} data rows`);

  if (rowCount === 0) {
    console.log('❌ No data rows found!');
    return;
  }

  // Analyze first 3 rows
  for (let i = 0; i < Math.min(3, rowCount); i++) {
    console.log(`\n🔍 Row ${i + 1}:`);
    const row = rows.nth(i);
    
    // Get all cell contents
    const cells = row.locator('td');
    const cellCount = await cells.count();
    
    for (let j = 0; j < cellCount; j++) {
      const cell = cells.nth(j);
      const text = await cell.textContent();
      const cellClass = await cell.getAttribute('class');
      
      // Special handling for certain columns
      if (j === 2) { // Ticker column
        console.log(`  Col ${j + 1} (Ticker): "${text}" [${cellClass}]`);
        const hasLink = await cell.locator('a').count() > 0;
        const hasButton = await cell.locator('button').count() > 0;
        console.log(`    Has link: ${hasLink}, Has button: ${hasButton}`);
      } else if (j === 6) { // Date column
        console.log(`  Col ${j + 1} (Date): "${text}" [${cellClass}]`);
        const span = cell.locator('span');
        if (await span.count() > 0) {
          const tooltip = await span.getAttribute('title');
          const spanClass = await span.getAttribute('class');
          console.log(`    Tooltip: "${tooltip}"`);
          console.log(`    Span class: "${spanClass}"`);
        }
      } else if (j === 9) { // Price column
        console.log(`  Col ${j + 1} (Price): "${text}" [${cellClass}]`);
        const buttons = await cell.locator('button').count();
        const spans = await cell.locator('span').count();
        console.log(`    Buttons: ${buttons}, Spans: ${spans}`);
        
        // Check for specific price elements
        const entryPrice = await cell.locator('text=/Entry:/').count();
        const nowPrice = await cell.locator('text=/Now:/').count();
        const fetchBtn = await cell.locator('button:has-text("Fetch")').count();
        console.log(`    Has Entry: ${entryPrice > 0}, Has Now: ${nowPrice > 0}, Has Fetch: ${fetchBtn > 0}`);
      } else {
        console.log(`  Col ${j + 1}: "${text?.slice(0, 50)}..."`);
      }
    }
  }

  // Check for any fetch buttons on the page
  console.log('\n🔘 Checking for Fetch buttons:');
  const allFetchButtons = page.locator('button:has-text("Fetch")');
  const fetchCount = await allFetchButtons.count();
  console.log(`Total Fetch buttons on page: ${fetchCount}`);

  // Check table headers
  console.log('\n📋 Table headers:');
  const headers = page.locator('thead th');
  const headerCount = await headers.count();
  for (let i = 0; i < headerCount; i++) {
    const headerText = await headers.nth(i).textContent();
    console.log(`  Header ${i + 1}: "${headerText}"`);
  }
});