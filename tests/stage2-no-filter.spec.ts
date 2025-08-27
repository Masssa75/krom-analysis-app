import { test, expect } from '@playwright/test';

test('Test Stage 2 with filters disabled', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:3001');
  
  // Wait for the page to load
  await page.waitForSelector('h1:has-text("KROM")', { timeout: 10000 });
  
  // Click on RUGS filter section to expand it
  await page.locator('h3:has-text("RUGS")').click();
  await page.waitForTimeout(500);
  
  // Uncheck "Exclude Rugs" (check "Include Rugs")
  const includeRugsCheckbox = page.locator('label:has-text("Include Rugs")').locator('div').first();
  await includeRugsCheckbox.click();
  await page.waitForTimeout(1000);
  
  // Click search button
  await page.locator('button[aria-label="Search"]').click();
  
  // Search for UIUI
  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.fill('UIUI');
  
  // Wait for results
  await page.waitForTimeout(2000);
  
  // Check if UIUI is found
  const uiuiFound = await page.locator('span:has-text("UIUI")').count();
  console.log('UIUI tokens found:', uiuiFound);
  
  // Check for S2 score
  const s2ScoreCount = await page.locator('span:has-text("S2")').count();
  console.log('S2 score labels found:', s2ScoreCount);
  
  // Check for W2 badge
  const w2BadgeCount = await page.locator('span:has-text("W2:")').count();
  console.log('W2 badges found:', w2BadgeCount);
  
  // Check specifically for HONEYPOT badge
  const honeypotBadge = await page.locator('span:has-text("W2: HONEYPOT")').count();
  console.log('W2: HONEYPOT badge found:', honeypotBadge);
  
  // Take screenshot
  await page.screenshot({ path: 'uiui-stage2-visible.png', fullPage: false });
  
  // Get the actual Stage 2 score value if visible
  if (s2ScoreCount > 0) {
    const scoreElement = await page.locator('span:has-text("S2") + div').first();
    const scoreText = await scoreElement.textContent();
    console.log('UIUI Stage 2 score value:', scoreText);
    expect(scoreText).toBe('2.0');
  }
  
  // Assert that Stage 2 elements are found
  expect(uiuiFound).toBeGreaterThan(0);
  expect(s2ScoreCount).toBeGreaterThan(0);
  expect(honeypotBadge).toBeGreaterThan(0);
});