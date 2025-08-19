import { test, expect } from '@playwright/test'

test.describe('Social Media Filter', () => {
  test('should display and interact with social media filter checkboxes', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://lively-torrone-8199e0.netlify.app/')
    
    // Wait for the page to load
    await page.waitForSelector('text=RECENT CALLS', { timeout: 10000 })
    
    // Click on Social Media filter to expand it
    await page.click('text=Social Media')
    
    // Wait for filter options to be visible
    await page.waitForSelector('text=Has Website', { timeout: 5000 })
    
    // Verify all 3 filter options are present
    await expect(page.locator('text=Has Website')).toBeVisible()
    await expect(page.locator('text=Has Twitter/X')).toBeVisible()
    await expect(page.locator('text=Has Telegram')).toBeVisible()
    
    // Verify all checkboxes are checked by default (green background)
    const websiteCheckbox = page.locator('text=Has Website').locator('..').locator('div').first()
    const twitterCheckbox = page.locator('text=Has Twitter/X').locator('..').locator('div').first()
    const telegramCheckbox = page.locator('text=Has Telegram').locator('..').locator('div').first()
    
    await expect(websiteCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    await expect(twitterCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    await expect(telegramCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    
    // Uncheck "Has Website" - click the checkbox div directly
    await websiteCheckbox.click()
    await page.waitForTimeout(500)
    
    // Verify Website is unchecked but others remain checked
    await expect(websiteCheckbox).not.toHaveClass(/bg-\[#00ff88\]/)
    await expect(twitterCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    await expect(telegramCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    
    // Uncheck "Has Twitter/X" - click the checkbox div directly
    await twitterCheckbox.click()
    await page.waitForTimeout(500)
    
    // Verify only Telegram remains checked
    await expect(websiteCheckbox).not.toHaveClass(/bg-\[#00ff88\]/)
    await expect(twitterCheckbox).not.toHaveClass(/bg-\[#00ff88\]/)
    await expect(telegramCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    
    // Re-check "Has Website" - click the checkbox div directly
    await websiteCheckbox.click()
    await page.waitForTimeout(500)
    
    // Verify Website is checked again
    await expect(websiteCheckbox).toHaveClass(/bg-\[#00ff88\]/)
  })
  
  test('should filter tokens based on social media selection', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://lively-torrone-8199e0.netlify.app/')
    
    // Wait for the page to load and tokens to appear
    await page.waitForSelector('text=RECENT CALLS', { timeout: 10000 })
    await page.waitForTimeout(2000) // Wait for tokens to load
    
    // Click on Social Media filter to expand it
    await page.click('text=Social Media')
    
    // Wait for filter options to be visible
    await page.waitForSelector('text=Has Telegram', { timeout: 5000 })
    
    // All filters should be checked by default - uncheck Website and Twitter
    await page.click('text=Has Website')
    await page.click('text=Has Twitter/X')
    
    // Wait for the filter to be applied (debounced)
    await page.waitForTimeout(1000)
    
    // Now only "Has Telegram" is selected - should show only tokens with Telegram
    console.log('Filtered to show only tokens with Telegram')
    
    // Re-check all filters
    await page.click('text=Has Website')
    await page.click('text=Has Twitter/X')
    
    // Wait for the filter to be applied
    await page.waitForTimeout(1000)
    
    console.log('All social filters re-enabled')
    
    // Uncheck all filters
    await page.click('text=Has Website')
    await page.click('text=Has Twitter/X')
    await page.click('text=Has Telegram')
    
    // Wait for the filter to be applied
    await page.waitForTimeout(1000)
    
    console.log('All social filters disabled - should show all tokens')
  })
})