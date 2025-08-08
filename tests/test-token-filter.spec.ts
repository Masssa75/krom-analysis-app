import { test, expect } from '@playwright/test'

test.describe('Token Type Filter', () => {
  test('should filter tokens correctly by type', async ({ page }) => {
    // Go to the page
    await page.goto('https://krom1.com')
    
    // Wait for the page to load
    await page.waitForSelector('.filter-section', { timeout: 10000 })
    
    // Click on Token Type filter to expand it if needed
    const tokenTypeHeader = page.locator('text=TOKEN TYPE').first()
    await tokenTypeHeader.click()
    
    // Wait a bit for expansion
    await page.waitForTimeout(500)
    
    // First, uncheck Meme Tokens to show only Utility
    const memeCheckbox = page.locator('text=Meme Tokens').locator('..')
    await memeCheckbox.click()
    
    // Wait for the filter to apply
    await page.waitForTimeout(2000)
    
    // Check what tokens are displayed
    const tokenBadges = await page.locator('.text-\\[9px\\]').allTextContents()
    console.log('Tokens displayed when Utility filter is selected:', tokenBadges)
    
    // Count MEME vs UTILITY badges
    const memeCount = tokenBadges.filter(badge => badge.includes('MEME')).length
    const utilityCount = tokenBadges.filter(badge => badge.includes('UTILITY')).length
    
    console.log(`Found ${memeCount} MEME tokens and ${utilityCount} UTILITY tokens`)
    
    // When utility is selected, we should not see MEME tokens
    expect(memeCount).toBe(0)
    expect(utilityCount).toBeGreaterThan(0)
  })

  test('should show API response for debugging', async ({ page }) => {
    // Enable request/response logging
    page.on('response', response => {
      if (response.url().includes('/api/recent-calls')) {
        response.json().then(data => {
          console.log('API Response:', {
            url: response.url(),
            tokenCount: data.data?.length,
            firstToken: data.data?.[0]
          })
        }).catch(() => {})
      }
    })
    
    await page.goto('https://krom1.com')
    await page.waitForSelector('.filter-section', { timeout: 10000 })
    
    // Click Token Type to expand
    await page.locator('text=TOKEN TYPE').first().click()
    await page.waitForTimeout(500)
    
    // Uncheck Meme to show only Utility
    await page.locator('text=Meme Tokens').locator('..').click()
    await page.waitForTimeout(2000)
    
    // Get the actual filter URL being called
    const apiCalls = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('/api/recent-calls'))
        .map(entry => entry.name)
    })
    
    console.log('API calls made:', apiCalls)
  })
})