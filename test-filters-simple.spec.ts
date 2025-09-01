import { test, expect } from '@playwright/test';

test.describe('Simple Filter Test', () => {
  test('Verify filters are present and functional', async ({ page }) => {
    // Go to the production site
    await page.goto('https://krom1.com/projects-rated');
    
    // Wait for page to load
    await page.waitForSelector('.bg-\\[\\#111214\\]', { timeout: 20000 });
    
    // Check if FilterSidebar is present
    const sidebar = await page.locator('.w-\\[300px\\]').first().isVisible();
    console.log(`Filter sidebar visible: ${sidebar}`);
    
    // Check for filter sections
    const tokenTypeSection = await page.locator('text="Token Type"').isVisible();
    const networksSection = await page.locator('text="Networks"').isVisible();
    const rugsSection = await page.locator('text="Rugs"').isVisible();
    const scoresSection = await page.locator('text="Analysis Scores"').isVisible();
    
    console.log('\nFilter sections present:');
    console.log(`- Token Type: ${tokenTypeSection}`);
    console.log(`- Networks: ${networksSection}`);
    console.log(`- Rugs: ${rugsSection}`);
    console.log(`- Analysis Scores: ${scoresSection}`);
    
    // Get initial count
    const initialCount = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`\nInitial projects: ${initialCount}`);
    
    // Expand Analysis Scores section if needed
    const scoresButton = page.locator('button:has-text("Analysis Scores")');
    await scoresButton.click();
    await page.waitForTimeout(300);
    
    // Try changing Min X Score
    const xScoreInput = page.locator('input[type="range"]').first();
    await xScoreInput.fill('8');
    
    // Wait for debounce and new data
    await page.waitForTimeout(1000);
    
    const filteredCount = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`Projects after X Score >= 8: ${filteredCount}`);
    
    // Check if localStorage is set
    const stored = await page.evaluate(() => {
      const data = localStorage.getItem('kromProjectsFilters');
      return data ? JSON.parse(data) : null;
    });
    
    console.log('\nStored filter data:');
    console.log(`- Min X Score: ${stored?.filters?.minXScore}`);
    
    // Assertions
    expect(sidebar).toBe(true);
    expect(tokenTypeSection).toBe(true);
    expect(networksSection).toBe(true);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    expect(stored?.filters?.minXScore).toBe(8);
  });
});