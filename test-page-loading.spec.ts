import { test, expect } from '@playwright/test';

test('check if discovery page loads properly', async ({ page }) => {
  console.log('Navigating to discovery page...');
  
  // Set up console error logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text());
    }
  });
  
  // Set up request failure logging
  page.on('requestfailed', request => {
    console.error('Request failed:', request.url(), request.failure()?.errorText);
  });
  
  // Navigate to the page
  const response = await page.goto('https://lively-torrone-8199e0.netlify.app/temp-discovery', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  console.log('Response status:', response?.status());
  
  // Check if page loaded
  const title = await page.title();
  console.log('Page title:', title);
  
  // Wait for any content
  await page.waitForTimeout(2000);
  
  // Check for error messages
  const bodyText = await page.locator('body').textContent();
  console.log('Body text preview:', bodyText?.substring(0, 200));
  
  // Check if there's an error message
  if (bodyText?.includes('Application error') || bodyText?.includes('500') || bodyText?.includes('Error')) {
    console.error('ERROR: Page contains error message');
    console.log('Full body text:', bodyText);
  }
  
  // Check for main content
  const hasHeader = await page.locator('h1:has-text("KROM Discovery")').count();
  console.log('Has KROM Discovery header:', hasHeader > 0);
  
  // Check for tokens
  const tokenCards = await page.locator('.bg-\\[\\#111214\\]').count();
  console.log('Number of token cards:', tokenCards);
  
  // Take screenshot
  await page.screenshot({ path: 'page-loading-test.png', fullPage: true });
  
  // Check network activity
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push(request.url());
    }
  });
  
  await page.reload();
  await page.waitForTimeout(3000);
  
  console.log('API calls made:', apiCalls);
});