import { test, expect } from '@playwright/test';

test.describe('Website Analysis Display', () => {
  test('should display website scores and tiers correctly', async ({ page }) => {
    // Set a longer timeout for the whole test
    test.setTimeout(60000);
    
    // Go to the live app
    await page.goto('https://lively-torrone-8199e0.netlify.app', { waitUntil: 'networkidle' });
    
    // Wait for any content to load
    await page.waitForTimeout(5000);
    
    // Take a screenshot to see what's loaded
    await page.screenshot({ path: 'website-analysis-page.png', fullPage: false });
    console.log('Screenshot saved as website-analysis-page.png');
    
    // Try to find the table or any loading indicators
    const tableExists = await page.locator('table').count() > 0;
    const loadingExists = await page.locator('text=/loading/i').count() > 0;
    const errorExists = await page.locator('text=/error/i').count() > 0;
    
    console.log('Table exists:', tableExists);
    console.log('Loading indicator exists:', loadingExists);
    console.log('Error exists:', errorExists);
    
    if (tableExists) {
      // Look for tokens we analyzed
      const rows = await page.locator('tbody tr').count();
      console.log('Number of rows in table:', rows);
      
      // Check for VANTUM
      const vantumExists = await page.locator('text=VANTUM').count() > 0;
      console.log('VANTUM found:', vantumExists);
      
      if (vantumExists) {
        // Find the VANTUM row and check its website score
        const vantumRow = page.locator('tr').filter({ hasText: 'VANTUM' }).first();
        const cells = await vantumRow.locator('td').allTextContents();
        console.log('VANTUM row cells:', cells);
        
        // Look for tier badge
        const badges = await vantumRow.locator('[class*="badge"], [class*="tier"], [class*="bg-"]').allTextContents();
        console.log('VANTUM badges:', badges);
      }
      
      // Check for other analyzed tokens
      const nekoExists = await page.locator('text=NEKO').count() > 0;
      const scanExists = await page.locator('text=SCAN').count() > 0;
      const thendExists = await page.locator('text=THEND').count() > 0;
      
      console.log('Other analyzed tokens found:');
      console.log('- NEKO:', nekoExists);
      console.log('- SCAN:', scanExists);
      console.log('- THEND:', thendExists);
    }
    
    // Test settings modal if it exists
    const settingsButton = page.locator('button').filter({ hasText: /settings/i });
    if (await settingsButton.count() > 0) {
      console.log('Settings button found, clicking...');
      await settingsButton.click();
      
      // Wait a bit for modal
      await page.waitForTimeout(2000);
      
      // Check for website analysis toggle
      const websiteToggle = await page.locator('text=/website analysis/i').count() > 0;
      console.log('Website Analysis toggle in settings:', websiteToggle);
      
      // Take screenshot of settings
      await page.screenshot({ path: 'settings-modal.png', fullPage: false });
      console.log('Settings modal screenshot saved');
      
      // Close modal if open
      await page.keyboard.press('Escape');
    }
  });
});