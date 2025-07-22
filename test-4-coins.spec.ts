import { test, expect } from '@playwright/test';

test('Analyze 4 coins with headed browser', async ({ page }) => {
  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  console.log('✓ Page loaded');
  
  // Take a screenshot of the initial state
  await page.screenshot({ path: 'initial-state.png' });
  
  // Look for the Call Analysis section
  const callAnalysisSection = page.locator('text="Call Analysis"').first();
  await expect(callAnalysisSection).toBeVisible();
  console.log('✓ Found Call Analysis section');
  
  // Find and clear the count input for Call Analysis
  const countInput = page.locator('#count');
  await countInput.clear();
  await countInput.fill('4');
  console.log('✓ Set count to 4 coins');
  
  // Click the Start Analysis button
  const startButton = page.locator('button:has-text("Start Analysis")').first();
  await startButton.click();
  console.log('✓ Clicked Start Analysis button');
  
  // Wait for any indication of progress or results
  // The app might show results directly without a progress indicator
  await page.waitForTimeout(2000); // Give it time to start
  
  // Take a screenshot after clicking to see what happens
  await page.screenshot({ path: 'after-click.png', fullPage: true });
  
  // Look for either progress indicators or results
  const progressIndicator = page.locator('text=/Analyzing|Fetching|Processing/i');
  const resultCards = page.locator('.space-y-4 > div').filter({ has: page.locator('.font-semibold') });
  
  // Wait for either progress or results
  try {
    await expect(progressIndicator.or(resultCards.first())).toBeVisible({ timeout: 30000 });
    console.log('✓ Analysis started or results appeared');
  } catch (e) {
    console.log('⚠️  No progress indicator or results found, checking page state...');
    const pageContent = await page.content();
    console.log('Page contains "error":', pageContent.includes('error'));
    console.log('Page contains "Error":', pageContent.includes('Error'));
  }
  
  // Check if we have results
  const finalResultCards = page.locator('.space-y-4 > div').filter({ has: page.locator('.font-semibold') });
  const count = await finalResultCards.count();
  console.log(`✓ Found ${count} result cards`);
  
  // Take a screenshot of the results
  await page.screenshot({ path: 'analysis-results.png', fullPage: true });
  
  // Log some details about the results
  for (let i = 0; i < Math.min(count, 4); i++) {
    const card = finalResultCards.nth(i);
    const ticker = await card.locator('.font-semibold').first().textContent();
    const scoreText = await card.locator('text=/Score: \\d+/').textContent().catch(() => 'No score found');
    console.log(`  Result ${i + 1}: ${ticker} - ${scoreText}`);
  }
  
  // Verify the analysis functionality is working
  expect(count).toBeGreaterThan(0);
  console.log('✅ Analysis functionality is working!');
});