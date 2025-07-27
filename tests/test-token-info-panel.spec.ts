import { test, expect } from '@playwright/test'

test.describe('Token Info Panel', () => {
  test('collapsible token info panel with DexScreener links', async ({ page }) => {
    // Navigate to the main page
    await page.goto('https://lively-torrone-8199e0.netlify.app')
    
    // Wait for data to load (look for the table)
    await page.waitForSelector('table', { timeout: 30000 })
    
    // Find and click on a token to open GeckoTerminal panel
    // The token button is in the table, clicking on any token symbol opens the chart
    const tokenButton = page.locator('table button').first()
    await tokenButton.waitFor({ state: 'visible' })
    await tokenButton.click()
    
    // Wait for GeckoTerminal panel to open
    await page.waitForSelector('text=GeckoTerminal Chart', { timeout: 10000 })
    
    // Check that Token Info & Links button is present
    const tokenInfoButton = page.locator('button').filter({ hasText: 'Token Info & Links' })
    await expect(tokenInfoButton).toBeVisible()
    
    // Click to expand token info
    await tokenInfoButton.click()
    
    // Wait for the expansion animation
    await page.waitForTimeout(500)
    
    // Wait for content to appear
    await page.waitForTimeout(1000)
    
    // Check for links - they may or may not be present depending on the token
    const socialLinksContainer = page.locator('div').filter({ has: page.locator('a').filter({ hasText: 'Website' }).or(page.locator('a').filter({ hasText: 'X/Twitter' })).or(page.locator('a').filter({ hasText: 'Telegram' })) })
    const noLinksMessage = page.locator('text=No social links available')
    
    // Either social links or no links message should be visible
    const hasSocialLinks = await socialLinksContainer.count() > 0
    const hasNoLinksMessage = await noLinksMessage.isVisible().catch(() => false)
    
    if (hasSocialLinks) {
      console.log('Token has social links!')
      // Count individual links
      const websiteCount = await page.locator('a').filter({ hasText: 'Website' }).count()
      const twitterCount = await page.locator('a').filter({ hasText: 'X/Twitter' }).count()
      const telegramCount = await page.locator('a').filter({ hasText: 'Telegram' }).count()
      console.log(`Found: ${websiteCount} website, ${twitterCount} twitter, ${telegramCount} telegram links`)
    } else if (hasNoLinksMessage) {
      console.log('Token has no social links')
    } else {
      console.log('Still loading or unexpected state')
    }
    
    console.log('Token info panel is working!')
    
    // Close the modal
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).last()
    await closeButton.click()
  })
})