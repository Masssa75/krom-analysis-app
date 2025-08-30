import { test, expect } from '@playwright/test';

test('investigate error on discovery page', async ({ page }) => {
  // Capture response details
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`Error response: ${response.status()} - ${response.url()}`);
    }
  });
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text());
    }
  });
  
  // Navigate
  const response = await page.goto('https://krom1.com/temp-discovery', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });
  
  console.log('Response status:', response?.status());
  
  // Check for error text
  const errorText = await page.locator('text=Error').first().textContent().catch(() => null);
  if (errorText) {
    console.log('Error text found:', errorText);
  }
  
  // Check if it's a Next.js error page
  const hasRequestId = await page.locator('text=Request ID').count();
  if (hasRequestId > 0) {
    console.log('This is a Next.js error page');
    const requestId = await page.locator('text=Request ID').textContent();
    console.log('Request ID:', requestId);
  }
  
  // Try to get the actual error message
  const bodyText = await page.locator('body').textContent();
  if (bodyText?.includes('Error')) {
    console.log('Body contains error:', bodyText.substring(0, 500));
  }
  
  // Take screenshot
  await page.screenshot({ path: 'error-page.png' });
  
  // Also try the Netlify URL
  console.log('\nTrying Netlify URL...');
  const netlifyResponse = await page.goto('https://lively-torrone-8199e0.netlify.app/temp-discovery', {
    waitUntil: 'domcontentloaded'
  });
  
  console.log('Netlify response status:', netlifyResponse?.status());
  
  const netlifyHasError = await page.locator('text=Error').count();
  console.log('Netlify has error text:', netlifyHasError > 0);
  
  // Check if content loads on Netlify
  const hasContent = await page.locator('h1:has-text("KROM Discovery")').count();
  console.log('Netlify has KROM Discovery header:', hasContent > 0);
});