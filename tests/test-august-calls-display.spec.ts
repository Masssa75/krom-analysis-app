import { test, expect } from '@playwright/test';

test('investigate why August calls are not showing', async ({ page }) => {
  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the table to load
  await page.waitForSelector('table', { timeout: 10000 });
  
  // Check the date column to see what dates are displayed
  const dateElements = await page.$$('table tbody tr td:nth-child(5)'); // Date is 5th column
  
  console.log(`Found ${dateElements.length} rows in the table`);
  
  // Extract all dates
  const dates = [];
  for (const element of dateElements) {
    const dateText = await element.textContent();
    dates.push(dateText);
  }
  
  console.log('Dates found in table:', dates);
  
  // Check if any August dates are present
  const augustDates = dates.filter(date => date && date.includes('Aug'));
  console.log(`August dates found: ${augustDates.length}`, augustDates);
  
  // Check the page info to see total count
  const pageInfo = await page.textContent('text=/5655 total calls analyzed/');
  console.log('Page info:', pageInfo);
  
  // Check if there's a sort order issue - click on Date header to sort
  await page.click('button:has-text("Date Called")');
  await page.waitForTimeout(1000);
  
  // Check dates again after sorting
  const dateElementsAfterSort = await page.$$('table tbody tr td:nth-child(5)');
  const datesAfterSort = [];
  for (const element of dateElementsAfterSort) {
    const dateText = await element.textContent();
    datesAfterSort.push(dateText);
  }
  
  console.log('Dates after sorting:', datesAfterSort);
  
  // Try to search for a known August token
  const searchInput = await page.$('input[placeholder="Search by token name..."]');
  if (searchInput) {
    // Clear any existing search
    await searchInput.fill('');
    await page.waitForTimeout(500);
    
    // Let's check the API response directly
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/analyzed?limit=50&offset=0');
      const data = await response.json();
      return data;
    });
    
    console.log('API Response:', {
      success: apiResponse.success,
      count: apiResponse.count,
      resultsLength: apiResponse.results?.length,
      firstFewDates: apiResponse.results?.slice(0, 5).map(r => new Date(r.buy_timestamp).toLocaleDateString())
    });
    
    // Check if results have August dates
    const augustResults = apiResponse.results?.filter(r => {
      const date = new Date(r.buy_timestamp);
      return date.getMonth() === 7; // August is month 7 (0-indexed)
    });
    
    console.log(`API has ${augustResults?.length || 0} August results`);
    if (augustResults && augustResults.length > 0) {
      console.log('Sample August token:', augustResults[0].token, new Date(augustResults[0].buy_timestamp).toLocaleDateString());
    }
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'august-calls-debug.png', fullPage: true });
});