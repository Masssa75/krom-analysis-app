import { test, expect } from '@playwright/test';

test.describe('Screenshot Mode Testing', () => {
  const baseUrl = 'https://lively-torrone-8199e0.netlify.app';

  test('Screenshot mode loads and displays images', async ({ page }) => {
    // Go to the temp discovery page
    await page.goto(`${baseUrl}/temp-discovery`);
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('KROM Discovery');
    
    // Click screenshot mode button
    const screenshotBtn = page.locator('button:has-text("Screenshot Mode")');
    await screenshotBtn.click();
    
    // Wait for button to become active
    await expect(screenshotBtn).toHaveClass(/bg-green-500/);
    
    // Check that images are being loaded
    const images = page.locator('img[alt*="screenshot"]');
    await expect(images).toHaveCount(4);
    
    // Wait for at least one image to load
    await page.waitForTimeout(3000);
    
    // Check image src attributes
    const firstImageSrc = await images.first().getAttribute('src');
    console.log('First image src:', firstImageSrc);
    expect(firstImageSrc).toContain('/api/temp-preview/screenshot');
    
    // Check if images have loaded (naturalWidth > 0 means loaded)
    const imageLoaded = await images.first().evaluate((img: HTMLImageElement) => {
      return img.naturalWidth > 0;
    });
    
    console.log('Image loaded successfully:', imageLoaded);
    
    // Take a screenshot to see what's displayed
    await page.screenshot({ path: 'screenshot-mode-test.png', fullPage: true });
    console.log('Screenshot saved as screenshot-mode-test.png');
    
    // Test the API directly
    const apiResponse = await page.request.get(`${baseUrl}/api/temp-preview/screenshot?url=https://www.fedora.club`);
    console.log('API Response status:', apiResponse.status());
    console.log('API Response headers:', apiResponse.headers());
    
    const contentType = apiResponse.headers()['content-type'];
    console.log('Content-Type:', contentType);
    
    if (contentType?.includes('image')) {
      console.log('✅ API returns an image');
    } else if (contentType?.includes('svg')) {
      console.log('⚠️ API returns SVG placeholder');
      const svgContent = await apiResponse.text();
      console.log('SVG content preview:', svgContent.substring(0, 200));
    } else {
      console.log('❌ Unexpected content type:', contentType);
    }
  });

  test('Compare iframe vs screenshot modes', async ({ page }) => {
    await page.goto(`${baseUrl}/temp-discovery`);
    
    // Start in iframe mode
    const iframeButton = page.locator('button:has-text("iFrame Mode")');
    await expect(iframeButton).toHaveClass(/bg-green-500/);
    
    // Check iframes exist
    const iframes = page.locator('iframe');
    await expect(iframes).toHaveCount(4);
    console.log('✅ iFrame mode: 4 iframes loaded');
    
    // Switch to screenshot mode
    await page.locator('button:has-text("Screenshot Mode")').click();
    await page.waitForTimeout(1000);
    
    // Check images exist
    const images = page.locator('img[alt*="screenshot"]');
    await expect(images).toHaveCount(4);
    console.log('✅ Screenshot mode: 4 images present');
    
    // Check each image src
    const imageSources = await images.evaluateAll((imgs) => 
      imgs.map(img => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        loaded: (img as HTMLImageElement).naturalWidth > 0
      }))
    );
    
    console.log('Image sources:', imageSources);
  });
});