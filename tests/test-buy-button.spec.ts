import { test, expect } from '@playwright/test'

test('Buy button opens Raydium exchange with correct swap parameters', async ({ page, context }) => {
  // Navigate to the deployed app
  await page.goto('https://lively-torrone-8199e0.netlify.app/')
  
  // Find the BUY button
  const buyButton = page.locator('button').filter({ hasText: 'BUY' })
  
  // Check the button is visible
  await expect(buyButton).toBeVisible()
  
  // Check the button styling (grayscale)
  await expect(buyButton).toHaveCSS('background-color', 'rgb(42, 45, 49)')
  await expect(buyButton).toHaveCSS('color', 'rgb(136, 136, 136)')
  
  // Verify it's in the header next to the Telegram button
  const headerSection = page.locator('div.flex.items-center.gap-2').filter({
    has: buyButton
  }).first()
  await expect(headerSection).toBeVisible()
  
  // Check that Telegram button is also in the same container
  const telegramButton = headerSection.locator('button').filter({
    has: page.locator('svg')
  }).last()
  await expect(telegramButton).toBeVisible()
  
  // Listen for the popup event
  const popupPromise = context.waitForEvent('page')
  
  // Click the buy button
  await buyButton.click()
  
  // Get the popup page
  const popup = await popupPromise
  
  // Check the URL contains Raydium and the correct token addresses
  expect(popup.url()).toContain('raydium.io')
  expect(popup.url()).toContain('inputMint=sol')
  expect(popup.url()).toContain('outputMint=9eCEK7ttNtroHsFLnW8jW7pS9MtSAPrPPrZ6QCUFpump')
  
  // Close the popup
  await popup.close()
  
  console.log('✅ Buy button correctly opens Raydium exchange for SOL to KROM swap')
})