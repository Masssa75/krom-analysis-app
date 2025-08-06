import { test, expect } from '@playwright/test'

test.describe('Top Performers Ticker', () => {
  test('ticker displays with top performing tokens', async ({ page }) => {
    // Navigate to the deployed site
    await page.goto('https://lively-torrone-8199e0.netlify.app/')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if ticker is visible
    const ticker = page.locator('.animate-scroll').first()
    
    // Wait for ticker to be visible (up to 10 seconds)
    await expect(ticker).toBeVisible({ timeout: 10000 })
    
    // Check for token elements with gains
    const tokenElements = page.locator('.animate-scroll span').filter({ hasText: 'X' })
    const count = await tokenElements.count()
    
    console.log(`Found ${count} tokens with X gains in ticker`)
    
    // Should have at least some tokens
    expect(count).toBeGreaterThan(0)
    
    // Check for illuminated high gainers (50X+)
    const highGainers = page.locator('.text-orange-400, .text-yellow-400')
    const highGainerCount = await highGainers.count()
    
    console.log(`Found ${highGainerCount} high gainers (50X+) with special illumination`)
    
    // Take a screenshot of the ticker
    await page.screenshot({ 
      path: 'ticker-screenshot.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 100 }
    })
    
    console.log('Ticker screenshot saved as ticker-screenshot.png')
  })
})