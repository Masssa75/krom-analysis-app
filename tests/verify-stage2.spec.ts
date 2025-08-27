import { test, expect } from '@playwright/test';

test('Verify Stage 2 display for UIUI and AINU', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:3001');
  
  // Wait for the page to load
  await page.waitForSelector('h1:has-text("KROM")', { timeout: 10000 });
  
  // Clear localStorage to ensure Stage 2 is enabled by default
  await page.evaluate(() => {
    localStorage.removeItem('columnVisibility');
  });
  
  // Reload to apply default settings
  await page.reload();
  await page.waitForSelector('h1:has-text("KROM")', { timeout: 10000 });
  
  // Click search button
  await page.locator('button[aria-label="Search"]').click();
  
  // Search for UIUI
  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.fill('UIUI');
  
  // Wait for results
  await page.waitForTimeout(2000);
  
  // Check for S2 score
  const s2ScoreCount = await page.locator('span:has-text("S2")').count();
  console.log('UIUI - S2 score labels found:', s2ScoreCount);
  
  // Check for W2 badge
  const w2BadgeCount = await page.locator('span:has-text("W2:")').count();
  console.log('UIUI - W2 badges found:', w2BadgeCount);
  
  // Take screenshot
  await page.screenshot({ path: 'uiui-stage2-test.png', fullPage: false });
  
  // Clear search and search for AINU
  await searchInput.clear();
  await searchInput.fill('AINU');
  await page.waitForTimeout(2000);
  
  // Check for S2 score for AINU
  const ainuS2Score = await page.locator('span:has-text("S2")').count();
  console.log('AINU - S2 score labels found:', ainuS2Score);
  
  // Check for W2 badge for AINU
  const ainuW2Badge = await page.locator('span:has-text("W2:")').count();
  console.log('AINU - W2 badges found:', ainuW2Badge);
  
  // Check if the exact text "W2: SUS" appears for AINU
  const susLabel = await page.locator('span:has-text("W2: SUS")').count();
  console.log('AINU - W2: SUS badge found:', susLabel);
  
  // Take screenshot
  await page.screenshot({ path: 'ainu-stage2-test.png', fullPage: false });
  
  // Get the actual Stage 2 score value if visible
  if (ainuS2Score > 0) {
    const scoreElement = await page.locator('span:has-text("S2") + div').first();
    const scoreText = await scoreElement.textContent();
    console.log('AINU Stage 2 score value:', scoreText);
  }
  
  // Assert that Stage 2 elements are found
  expect(s2ScoreCount).toBeGreaterThan(0);
  expect(w2BadgeCount).toBeGreaterThan(0);
  expect(ainuS2Score).toBeGreaterThan(0);
  expect(ainuW2Badge).toBeGreaterThan(0);
});