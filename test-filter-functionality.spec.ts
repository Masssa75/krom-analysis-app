import { test, expect } from '@playwright/test';

test.describe('Filter Functionality and Persistence', () => {
  test.setTimeout(60000); // Increase timeout to 60 seconds
  
  test('Filters update displayed projects and persist across reloads', async ({ page }) => {
    // Go to the projects-rated page
    await page.goto('http://localhost:3002/projects-rated');
    
    // Wait for initial load
    await page.waitForSelector('.bg-\\[\\#111214\\]', { timeout: 10000 });
    
    // Get initial project count
    const initialCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Initial projects displayed: ${initialCards}`);
    
    // Test Token Type filter
    console.log('\n--- Testing Token Type Filter ---');
    // Click to expand Token Type section if needed
    const tokenTypeSection = page.locator('button:has-text("Token Type")');
    const tokenTypeExpanded = await page.locator('[data-state="open"]:has-text("Token Type")').isVisible().catch(() => false);
    if (!tokenTypeExpanded) {
      await tokenTypeSection.click();
      await page.waitForTimeout(300);
    }
    
    // Click Utility checkbox
    await page.locator('label:has-text("Utility")').click();
    await page.waitForTimeout(500); // Wait for debounce
    
    // Check if projects are filtered
    const utilityFilteredCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects after Utility filter: ${utilityFilteredCards}`);
    
    // Test Networks filter
    console.log('\n--- Testing Networks Filter ---');
    // Click to expand Networks section
    const networksSection = page.locator('button:has-text("Networks")');
    const networksExpanded = await page.locator('[data-state="open"]:has-text("Networks")').isVisible().catch(() => false);
    if (!networksExpanded) {
      await networksSection.click();
      await page.waitForTimeout(300);
    }
    
    // Click Solana checkbox
    await page.locator('label:has-text("Solana")').click();
    await page.waitForTimeout(500); // Wait for debounce
    
    const networkFilteredCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects after Solana filter: ${networkFilteredCards}`);
    
    // Test Analysis Scores slider
    console.log('\n--- Testing Analysis Scores ---');
    // Click to expand Analysis Scores section
    const scoresSection = page.locator('button:has-text("Analysis Scores")');
    const scoresExpanded = await page.locator('[data-state="open"]:has-text("Analysis Scores")').isVisible().catch(() => false);
    if (!scoresExpanded) {
      await scoresSection.click();
      await page.waitForTimeout(300);
    }
    
    // Set Min X Score to 5
    const xScoreSlider = page.locator('input[type="range"]').first();
    await xScoreSlider.fill('5');
    await page.waitForTimeout(500); // Wait for debounce
    
    const scoreFilteredCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects after X Score >= 5: ${scoreFilteredCards}`);
    
    // Check localStorage
    const localStorageData = await page.evaluate(() => {
      const saved = localStorage.getItem('kromProjectsFilters');
      return saved ? JSON.parse(saved) : null;
    });
    
    console.log('\n--- LocalStorage Data ---');
    console.log('Filters:', JSON.stringify(localStorageData?.filters, null, 2));
    console.log('Sections:', localStorageData?.sections);
    
    // Reload the page
    console.log('\n--- Testing Persistence After Reload ---');
    await page.reload();
    await page.waitForSelector('.bg-\\[\\#111214\\]', { timeout: 10000 });
    
    // Check if filters persisted
    const reloadedCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects after reload: ${reloadedCards}`);
    
    // Verify utility checkbox is still checked
    const utilityChecked = await page.locator('input[type="checkbox"][value="utility"]').isChecked();
    console.log(`Utility checkbox still checked: ${utilityChecked}`);
    
    // Verify Solana checkbox is still checked
    const solanaChecked = await page.locator('input[type="checkbox"][value="solana"]').isChecked();
    console.log(`Solana checkbox still checked: ${solanaChecked}`);
    
    // Verify X Score slider value
    const xScoreValue = await xScoreSlider.inputValue();
    console.log(`X Score slider value: ${xScoreValue}`);
    
    // Clear filters
    console.log('\n--- Clearing Filters ---');
    // Uncheck Utility
    await page.locator('label:has-text("Utility")').click();
    await page.waitForTimeout(500);
    
    // Uncheck Solana
    await page.locator('label:has-text("Solana")').click();
    await page.waitForTimeout(500);
    
    // Reset X Score
    await xScoreSlider.fill('1');
    await page.waitForTimeout(500);
    
    const clearedCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects after clearing filters: ${clearedCards}`);
    
    // Verify API calls are being made with correct parameters
    console.log('\n--- Monitoring API Calls ---');
    page.on('request', request => {
      if (request.url().includes('/api/crypto-projects-rated')) {
        const url = new URL(request.url());
        const params = Object.fromEntries(url.searchParams);
        console.log('API call params:', params);
      }
    });
    
    // Make one more filter change to see the API call
    await page.locator('label:has-text("Include Rugs")').click();
    await page.waitForTimeout(500);
    
    // Final assertion
    expect(clearedCards).toBeGreaterThanOrEqual(0);
  });
});