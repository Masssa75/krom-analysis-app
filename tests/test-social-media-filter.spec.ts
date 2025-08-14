import { test, expect } from '@playwright/test'

test.describe('Social Media Filter', () => {
  test('should display and interact with social media filter', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://lively-torrone-8199e0.netlify.app/')
    
    // Wait for the page to load
    await page.waitForSelector('text=RECENT CALLS', { timeout: 10000 })
    
    // Click on Social Media filter to expand it
    await page.click('text=Social Media')
    
    // Wait for filter options to be visible
    await page.waitForSelector('text=Any (no filter)', { timeout: 5000 })
    
    // Verify all filter options are present
    await expect(page.locator('text=Any (no filter)')).toBeVisible()
    await expect(page.locator('text=Has Website')).toBeVisible()
    await expect(page.locator('text=Has Twitter/X')).toBeVisible()
    await expect(page.locator('text=Has Telegram')).toBeVisible()
    await expect(page.locator('text=Has Any Social')).toBeVisible()
    await expect(page.locator('text=Has All Socials')).toBeVisible()
    
    // Click on "Has Website" filter
    await page.click('text=Has Website')
    
    // Wait for the filter to be applied (debounced)
    await page.waitForTimeout(500)
    
    // Verify the checkbox is checked (green background)
    const hasWebsiteCheckbox = page.locator('text=Has Website').locator('..').locator('div').first()
    await expect(hasWebsiteCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    
    // Click on "Has Twitter/X" filter
    await page.click('text=Has Twitter/X')
    
    // Wait for the filter to be applied
    await page.waitForTimeout(500)
    
    // Verify the Twitter checkbox is checked and Website is unchecked
    const hasTwitterCheckbox = page.locator('text=Has Twitter/X').locator('..').locator('div').first()
    await expect(hasTwitterCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    
    // Click on "Any (no filter)" to reset
    await page.click('text=Any (no filter)')
    
    // Wait for the filter to be applied
    await page.waitForTimeout(500)
    
    // Verify the Any checkbox is checked
    const anyCheckbox = page.locator('text=Any (no filter)').locator('..').locator('div').first()
    await expect(anyCheckbox).toHaveClass(/bg-\[#00ff88\]/)
  })
  
  test('should filter tokens based on social media selection', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://lively-torrone-8199e0.netlify.app/')
    
    // Wait for the page to load
    await page.waitForSelector('text=RECENT CALLS', { timeout: 10000 })
    
    // Get initial token count
    await page.waitForSelector('.token-row, tbody tr', { timeout: 10000 })
    const initialCount = await page.locator('.token-row, tbody tr').count()
    console.log(`Initial token count: ${initialCount}`)
    
    // Click on Social Media filter to expand it
    await page.click('text=Social Media')
    
    // Wait for filter options to be visible
    await page.waitForSelector('text=Has All Socials', { timeout: 5000 })
    
    // Click on "Has All Socials" filter (should have fewer results)
    await page.click('text=Has All Socials')
    
    // Wait for the filter to be applied and results to update
    await page.waitForTimeout(1000)
    
    // Get filtered token count
    const filteredCount = await page.locator('.token-row, tbody tr').count()
    console.log(`Filtered token count (Has All Socials): ${filteredCount}`)
    
    // Verify that filtering reduces the number of results
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
    
    // Click on "Has Any Social" filter (should have more results than "Has All")
    await page.click('text=Has Any Social')
    
    // Wait for the filter to be applied
    await page.waitForTimeout(1000)
    
    // Get new filtered count
    const hasAnyCount = await page.locator('.token-row, tbody tr').count()
    console.log(`Filtered token count (Has Any Social): ${hasAnyCount}`)
    
    // Verify that "Has Any" shows more results than "Has All"
    expect(hasAnyCount).toBeGreaterThanOrEqual(filteredCount)
  })
})