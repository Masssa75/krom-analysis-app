import { test, expect } from '@playwright/test'

test('Telegram button exists and links to correct URL', async ({ page }) => {
  // Navigate to the deployed app
  await page.goto('https://lively-torrone-8199e0.netlify.app/')
  
  // Find the Telegram button by the SVG path data (partial match)
  const telegramButton = page.locator('button').filter({ 
    has: page.locator('svg path[d*="11.944"]') 
  })
  
  // Check the button exists
  await expect(telegramButton).toBeVisible()
  
  // Test that clicking the button would open the correct URL
  // Since window.open is called in React onClick, we'll intercept the popup
  const popupPromise = page.waitForEvent('popup')
  await telegramButton.click()
  const popup = await popupPromise
  expect(popup.url()).toBe('https://t.me/OfficialKromOne')
  
  // Test hover effect
  await telegramButton.hover()
  
  // Verify the button is clickable
  await expect(telegramButton).toBeEnabled()
  
  console.log('✅ Telegram button found with correct link to https://t.me/OfficialKromOne')
})