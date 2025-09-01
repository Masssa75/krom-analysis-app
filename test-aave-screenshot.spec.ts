import { test, expect } from '@playwright/test';

test.describe('AAVE Screenshot Issue', () => {
  test('Check AAVE screenshot behavior', async ({ page }) => {
    let requestCount = 0;
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'warn' || msg.type() === 'error') {
        console.log(`Console ${msg.type()}: ${msg.text()}`);
      }
    });

    // Monitor network requests
    const screenshotRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('capture-screenshot')) {
        requestCount++;
        const postData = request.postData();
        console.log(`Screenshot capture request #${requestCount}:`, postData);
        screenshotRequests.push(postData || '');
      }
    });

    // Go to the page
    await page.goto('https://krom1.com/projects-rated');
    
    // Wait for the page to load
    await page.waitForSelector('.bg-\\[\\#111214\\]', { timeout: 10000 });
    
    // Check sessionStorage for AAVE
    const sessionData = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('screenshot_attempt')) {
          data[key] = sessionStorage.getItem(key) || '';
        }
      }
      return data;
    });
    
    console.log('SessionStorage data:', sessionData);
    
    // Wait for any screenshot requests
    await page.waitForTimeout(3000);
    
    console.log('Total screenshot requests:', screenshotRequests.length);
    
    // Find AAVE-related requests
    const aaveRequests = screenshotRequests.filter(req => req.includes('AAVE') || req.includes('56'));
    console.log('AAVE-related requests:', aaveRequests.length);
    
    // Reload the page
    console.log('\n--- RELOADING PAGE ---\n');
    await page.reload();
    
    // Wait again
    await page.waitForTimeout(3000);
    
    // Check sessionStorage again
    const sessionDataAfterReload = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('screenshot_attempt')) {
          data[key] = sessionStorage.getItem(key) || '';
        }
      }
      return data;
    });
    
    console.log('SessionStorage after reload:', sessionDataAfterReload);
    
    // Check if AAVE made another request after reload
    const aaveRequestsAfterReload = screenshotRequests.filter(req => req.includes('56'));
    console.log('Total AAVE requests after reload:', aaveRequestsAfterReload.length);
    
    // Get AAVE card info
    const aaveCard = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.bg-\\[\\#111214\\]'));
      for (const card of cards) {
        const text = card.textContent || '';
        if (text.includes('AAVE')) {
          const hasLoadingSpinner = card.querySelector('.animate-spin') !== null;
          const imgSrc = card.querySelector('img')?.src;
          return {
            found: true,
            hasLoadingSpinner,
            imgSrc,
            text: text.substring(0, 200)
          };
        }
      }
      return { found: false };
    });
    
    console.log('AAVE card state:', aaveCard);
  });
});