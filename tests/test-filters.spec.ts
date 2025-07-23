import { test, expect } from '@playwright/test';

const BASE_URL = 'https://lively-torrone-8199e0.netlify.app';

test.describe('Filter Panel Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for page to load
    await page.waitForSelector('text=Previously Analyzed Calls', { timeout: 10000 });
  });

  test('filter panel should be collapsible', async ({ page }) => {
    // Check filter panel exists
    await expect(page.getByText('Filters')).toBeVisible();
    
    // Initially collapsed - filter content should not be visible
    const sliderLabel = page.getByText('Min Call Score');
    await expect(sliderLabel).not.toBeVisible();
    
    // Click to expand
    await page.getByRole('button', { name: /chevron/i }).click();
    
    // Now content should be visible
    await expect(sliderLabel).toBeVisible();
    await expect(page.getByText('Min X Score')).toBeVisible();
    await expect(page.getByText('Token Type')).toBeVisible();
    await expect(page.getByText('Network')).toBeVisible();
  });

  test('should filter by minimum call score', async ({ page }) => {
    // Expand filters
    await page.getByRole('button', { name: /chevron/i }).click();
    
    // Get initial count
    const initialCount = await page.locator('table tbody tr').count();
    
    // Set minimum call score to 7
    const callScoreSlider = page.locator('#call-score');
    await callScoreSlider.fill('7');
    
    // Wait for results to update
    await page.waitForTimeout(1000);
    
    // Check that results are filtered
    const filteredCount = await page.locator('table tbody tr').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    
    // Verify all visible scores are >= 7
    const scores = await page.locator('table tbody tr td:nth-child(2)').allTextContents();
    scores.forEach(score => {
      const numScore = parseFloat(score);
      expect(numScore).toBeGreaterThanOrEqual(7);
    });
  });

  test('should filter by token type', async ({ page }) => {
    // Expand filters
    await page.getByRole('button', { name: /chevron/i }).click();
    
    // Select only meme tokens
    await page.getByLabel('Meme').check();
    
    // Wait for results to update
    await page.waitForTimeout(1000);
    
    // Check that clear button appears
    await expect(page.getByRole('button', { name: /Clear/i })).toBeVisible();
  });

  test('should reset all filters when clear is clicked', async ({ page }) => {
    // Expand filters
    await page.getByRole('button', { name: /chevron/i }).click();
    
    // Apply some filters
    await page.locator('#call-score').fill('5');
    await page.getByLabel('Utility').check();
    
    // Wait for filters to apply
    await page.waitForTimeout(1000);
    
    // Click clear
    await page.getByRole('button', { name: /Clear/i }).click();
    
    // Verify filters are reset
    const callScoreValue = await page.locator('#call-score').inputValue();
    expect(callScoreValue).toBe('1');
    
    await expect(page.getByLabel('Utility')).not.toBeChecked();
    await expect(page.getByLabel('Meme')).not.toBeChecked();
  });
});