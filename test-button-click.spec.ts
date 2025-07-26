import { test, expect } from '@playwright/test';

test('test fetch button functionality', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Find all price cells (column 10 based on our earlier findings)
  const priceCells = page.locator('tbody tr td:nth-child(10)');
  const cellCount = await priceCells.count();
  console.log(`Found ${cellCount} price cells`);
  
  // Look through cells to find one with a Fetch button
  for (let i = 0; i < Math.min(5, cellCount); i++) {
    const cell = priceCells.nth(i);
    const cellText = await cell.textContent();
    console.log(`\nCell ${i + 1} content: "${cellText}"`);
    
    const fetchButton = cell.locator('button:has-text("Fetch")');
    if (await fetchButton.count() > 0) {
      console.log('✅ Found Fetch button in this cell');
      
      // Set up request monitoring
      let requestMade = false;
      page.once('request', request => {
        console.log(`Request triggered: ${request.method()} ${request.url()}`);
        requestMade = true;
      });
      
      // Try clicking
      try {
        await fetchButton.click();
        console.log('Clicked button');
        
        // Wait a bit
        await page.waitForTimeout(2000);
        
        if (!requestMade) {
          console.log('❌ No request was made after clicking');
          
          // Check if button is disabled or has any issues
          const isDisabled = await fetchButton.isDisabled();
          console.log('Button disabled?', isDisabled);
          
          // Check for any error messages
          const errorText = await cell.locator('text=/error|Error/i').count();
          if (errorText > 0) {
            console.log('Error text found in cell');
          }
        }
      } catch (e) {
        console.log('Error clicking button:', e);
      }
      
      break;
    }
  }
  
  // Also check if environment variable is present in the page
  const envCheck = await page.evaluate(() => {
    // Try to access window env vars
    const win = window as any;
    return {
      hasNextPublicEnv: typeof win.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined',
      hasEnvPrefix: Object.keys(win).some(k => k.includes('NEXT_PUBLIC')),
      nextData: !!win.__NEXT_DATA__
    };
  });
  
  console.log('\nEnvironment check:', envCheck);
});