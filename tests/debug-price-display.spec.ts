import { test, expect } from '@playwright/test';

test('debug price display structure', async ({ page }) => {
  // Go to the deployed site
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the page to load
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Find a row with N/A in the price column (8th column)
  const rows = await page.locator('tbody tr').all();
  
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    const priceCell = row.locator('td').nth(7); // Price/ROI column is 8th (0-indexed)
    const cellText = await priceCell.textContent();
    
    console.log(`Row ${i + 1} price cell content: "${cellText}"`);
    
    if (cellText?.includes('N/A')) {
      console.log('Found N/A price cell, examining structure...');
      
      // Get the inner HTML to see the structure
      const innerHTML = await priceCell.innerHTML();
      console.log('Cell HTML:', innerHTML);
      
      // Check for buttons in this cell
      const buttons = await priceCell.locator('button').all();
      console.log(`Number of buttons in cell: ${buttons.length}`);
      
      for (const button of buttons) {
        const buttonText = await button.textContent();
        console.log(`Button text: "${buttonText}"`);
      }
      
      break;
    }
  }
});