import { test, expect } from '@playwright/test'

test('Buy button opens Jupiter exchange with correct swap parameters', async ({ page, context }) => {
  // Navigate to the deployed app
  await page.goto('https://lively-torrone-8199e0.netlify.app/')
  
  // Find the BUY button
  const buyButton = page.locator('button').filter({ hasText: 'BUY' })
  
  // Check the button is visible
  await expect(buyButton).toBeVisible()
  
  // Check the button styling (grayscale)
  await expect(buyButton).toHaveCSS('background-color', 'rgb(42, 45, 49)')
  await expect(buyButton).toHaveCSS('color', 'rgb(136, 136, 136)')
  
  // Verify it's next to Contract Address label
  const contractSection = page.locator('div').filter({ 
    has: page.locator('div:has-text("Contract Address:")') 
  }).filter({
    has: buyButton
  }).first()
  await expect(contractSection).toBeVisible()
  
  // Listen for the popup event
  const popupPromise = context.waitForEvent('page')
  
  // Click the buy button
  await buyButton.click()
  
  // Get the popup page
  const popup = await popupPromise
  
  // Check the URL contains Jupiter and the correct token addresses
  expect(popup.url()).toContain('jup.ag')
  expect(popup.url()).toContain('SOL')
  expect(popup.url()).toContain('9eCEK7ttNtroHsFLnW8jW7pS9MtSAPrPPrZ6QCUFpump')
  
  // Close the popup
  await popup.close()
  
  console.log('✅ Buy button correctly opens Jupiter exchange for SOL to KROM swap')
})