import { test, expect } from '@playwright/test';

test.describe('Temp Discovery Preview Testing', () => {
  const baseUrl = 'https://lively-torrone-8199e0.netlify.app';

  test('Preview proxy and screenshot endpoints work', async ({ page }) => {
    // Go to the temp discovery page
    await page.goto(`${baseUrl}/temp-discovery`);
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('KROM Discovery');
    
    // Check that toggle buttons exist
    const iframeButton = page.locator('button:has-text("iFrame Mode")');
    const screenshotButton = page.locator('button:has-text("Screenshot Mode")');
    
    await expect(iframeButton).toBeVisible();
    await expect(screenshotButton).toBeVisible();
    
    // Check that token cards are displayed
    const cards = page.locator('[class*="bg-white"][class*="rounded-2xl"]');
    await expect(cards).toHaveCount(4);
    
    // Test iframe mode (default)
    await expect(iframeButton).toHaveClass(/bg-green-500/);
    
    // Check that iframes are loading
    const iframes = page.locator('iframe');
    await expect(iframes.first()).toBeVisible();
    
    // Switch to screenshot mode
    await screenshotButton.click();
    await expect(screenshotButton).toHaveClass(/bg-green-500/);
    
    // Check that images are loading
    const images = page.locator('img[alt*="screenshot"]');
    await expect(images.first()).toBeVisible();
    
    console.log('✅ Preview proxy and screenshot modes are working!');
  });

  test('Check preview URLs are correct', async ({ page }) => {
    await page.goto(`${baseUrl}/temp-discovery`);
    
    // Check iframe src URLs
    const iframeSrc = await page.locator('iframe').first().getAttribute('src');
    expect(iframeSrc).toContain('/api/temp-preview/proxy?url=');
    expect(iframeSrc).toContain('fedora.club');
    
    // Switch to screenshot mode
    await page.locator('button:has-text("Screenshot Mode")').click();
    await page.waitForTimeout(500);
    
    // Check image src URLs
    const imgSrc = await page.locator('img[alt*="screenshot"]').first().getAttribute('src');
    expect(imgSrc).toContain('/api/temp-preview/screenshot?url=');
    
    console.log('✅ Preview URLs are correctly formatted!');
  });
});