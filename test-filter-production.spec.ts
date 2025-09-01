import { test, expect } from '@playwright/test';

test.describe('Production Filter Test', () => {
  test('Test filters on production site', async ({ page }) => {
    // Go to the production projects-rated page
    await page.goto('https://krom1.com/projects-rated');
    
    // Wait for initial load
    await page.waitForSelector('.bg-\\[\\#111214\\]', { timeout: 15000 });
    
    // Get initial project count
    const initialCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Initial projects displayed: ${initialCards}`);
    
    // Test Token Type filter - Click Meme only
    console.log('\n--- Testing Token Type Filter (Meme only) ---');
    
    // Uncheck Utility if checked
    const utilityCheckbox = page.locator('input[type="checkbox"][value="utility"]');
    if (await utilityCheckbox.isChecked()) {
      await page.locator('label:has-text("Utility")').click();
      await page.waitForTimeout(600); // Wait for debounce
    }
    
    // Check if filter applied
    const memeOnlyCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects showing only Meme tokens: ${memeOnlyCards}`);
    
    // Check both checkboxes
    await page.locator('label:has-text("Utility")').click();
    await page.waitForTimeout(600);
    
    const bothTypesCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects showing both types: ${bothTypesCards}`);
    
    // Test Networks filter - Select only Ethereum
    console.log('\n--- Testing Networks Filter (Ethereum only) ---');
    
    // First uncheck all networks
    const networkCheckboxes = ['ethereum', 'solana', 'bsc', 'polygon', 'arbitrum', 'base'];
    for (const network of networkCheckboxes) {
      const checkbox = page.locator(`input[type="checkbox"][value="${network}"]`);
      if (await checkbox.isChecked()) {
        await checkbox.click();
        await page.waitForTimeout(100);
      }
    }
    await page.waitForTimeout(600);
    
    // Check only Ethereum
    await page.locator('input[type="checkbox"][value="ethereum"]').click();
    await page.waitForTimeout(600);
    
    const ethereumOnlyCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects on Ethereum only: ${ethereumOnlyCards}`);
    
    // Test Include Rugs filter
    console.log('\n--- Testing Include Rugs Filter ---');
    const includeRugsCheckbox = page.locator('input[type="checkbox"][value="include_rugs"]');
    const rugsIncluded = await includeRugsCheckbox.isChecked();
    console.log(`Include Rugs initially: ${rugsIncluded}`);
    
    await page.locator('label:has-text("Include Rugs")').click();
    await page.waitForTimeout(600);
    
    const afterRugToggleCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects after toggling Include Rugs: ${afterRugToggleCards}`);
    
    // Test X Score filter
    console.log('\n--- Testing X Score Filter ---');
    const xScoreSlider = page.locator('input[type="range"]').first();
    await xScoreSlider.fill('7');
    await page.waitForTimeout(600);
    
    const highXScoreCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects with X Score >= 7: ${highXScoreCards}`);
    
    // Test Website Score filter
    console.log('\n--- Testing Website Score Filter ---');
    const websiteScoreSlider = page.locator('input[type="range"]').nth(1);
    await websiteScoreSlider.fill('6');
    await page.waitForTimeout(600);
    
    const highWebsiteScoreCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects with Website Score >= 6: ${highWebsiteScoreCards}`);
    
    // Check localStorage persistence
    const savedFilters = await page.evaluate(() => {
      const saved = localStorage.getItem('kromProjectsFilters');
      return saved ? JSON.parse(saved) : null;
    });
    
    console.log('\n--- Saved Filter State ---');
    console.log('Token Types:', savedFilters?.filters?.tokenTypes);
    console.log('Networks:', savedFilters?.filters?.networks);
    console.log('Include Rugs:', savedFilters?.filters?.includeRugs);
    console.log('Include Imposters:', savedFilters?.filters?.includeImposters);
    console.log('Min X Score:', savedFilters?.filters?.minXScore);
    console.log('Min Website Score:', savedFilters?.filters?.minWebsiteScore);
    
    // Reload and verify persistence
    console.log('\n--- Testing Persistence After Reload ---');
    await page.reload();
    await page.waitForSelector('.bg-\\[\\#111214\\]', { timeout: 15000 });
    
    const reloadedCards = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects after reload: ${reloadedCards} (should match previous: ${highWebsiteScoreCards})`);
    
    // Verify filter values persisted
    const xScoreAfterReload = await xScoreSlider.inputValue();
    const websiteScoreAfterReload = await websiteScoreSlider.inputValue();
    const ethereumCheckedAfterReload = await page.locator('input[type="checkbox"][value="ethereum"]').isChecked();
    
    console.log(`\nFilter persistence check:`);
    console.log(`- X Score: ${xScoreAfterReload} (expected: 7)`);
    console.log(`- Website Score: ${websiteScoreAfterReload} (expected: 6)`);
    console.log(`- Ethereum checked: ${ethereumCheckedAfterReload} (expected: true)`);
    
    // Final assertions
    expect(xScoreAfterReload).toBe('7');
    expect(websiteScoreAfterReload).toBe('6');
    expect(ethereumCheckedAfterReload).toBe(true);
    expect(reloadedCards).toBe(highWebsiteScoreCards);
  });
});