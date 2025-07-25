import { test, expect } from '@playwright/test';

test('Find and test a token that needs price', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForTimeout(3000);
  
  // Find all Get Price buttons
  const getPriceButtons = page.locator('button:has-text("Get Price")');
  const count = await getPriceButtons.count();
  
  console.log(`Found ${count} tokens needing prices`);
  
  if (count > 0) {
    // Get the first one
    const firstButton = getPriceButtons.first();
    const row = firstButton.locator('xpath=ancestor::tr[1]');
    const rowContent = await row.textContent();
    console.log('Row content before:', rowContent);
    
    // Extract token name
    const tokenMatch = rowContent?.match(/^([A-Z0-9]+)/);
    const tokenName = tokenMatch?.[1];
    console.log('Token name:', tokenName);
    
    // Set up API monitoring
    const apiPromise = page.waitForResponse(response => 
      response.url().includes('/api/token-price')
    );
    
    // Click the button
    await firstButton.click();
    
    // Wait for API response
    const response = await apiPromise;
    const responseData = await response.json();
    const status = response.status();
    
    console.log('API Status:', status);
    console.log('API Response:', JSON.stringify(responseData, null, 2));
    
    // Wait for UI update
    await page.waitForTimeout(5000);
    
    // Check updated content
    const updatedContent = await row.textContent();
    console.log('Row content after:', updatedContent);
    
    // Take screenshot
    await page.screenshot({ path: 'price-fetch-result.png' });
    
    // Check if prices are now different
    if (updatedContent?.includes('Entry:') && updatedContent?.includes('Now:')) {
      const entryMatch = updatedContent.match(/Entry:\s*\$?([\d.,]+[KMB]?)/);
      const nowMatch = updatedContent.match(/Now:\s*\$?([\d.,]+[KMB]?)/);
      
      console.log('Entry price:', entryMatch?.[1]);
      console.log('Now price:', nowMatch?.[1]);
      
      if (entryMatch?.[1] === nowMatch?.[1]) {
        console.error('ISSUE: Entry and Now prices are identical!');
      } else {
        console.log('SUCCESS: Prices are different');
      }
    }
  } else {
    console.log('No tokens need price fetching on the first page');
    
    // Navigate to next pages to find one
    const nextButton = page.locator('button[aria-label="Go to next page"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(2000);
      const newCount = await getPriceButtons.count();
      console.log(`Page 2 has ${newCount} tokens needing prices`);
    }
  }
});