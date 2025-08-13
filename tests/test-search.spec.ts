import { test, expect } from '@playwright/test'

test.describe('Search functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://lively-torrone-8199e0.netlify.app')
    await page.waitForLoadState('networkidle')
  })

  test('should show search icon next to RECENT CALLS', async ({ page }) => {
    // Find the search icon next to RECENT CALLS
    const searchIcon = page.locator('button[aria-label="Search"]').first()
    await expect(searchIcon).toBeVisible()
  })

  test('should open search input when clicking icon', async ({ page }) => {
    // Click search icon
    const searchIcon = page.locator('button[aria-label="Search"]').first()
    await searchIcon.click()
    
    // Check that input appears
    const searchInput = page.locator('input[placeholder*="Search ticker"]')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toBeFocused()
  })

  test('should search by ticker', async ({ page }) => {
    // Open search
    const searchIcon = page.locator('button[aria-label="Search"]').first()
    await searchIcon.click()
    
    // Type a ticker (let's search for a common one)
    const searchInput = page.locator('input[placeholder*="Search ticker"]')
    await searchInput.fill('TRUMP')
    
    // Wait for results to update
    await page.waitForTimeout(1000)
    
    // Check that we get some results (or a no results message)
    const hasResults = await page.locator('.font-semibold.text-white').count() > 0
    const hasNoResultsMessage = await page.locator('text=/No tokens found/').isVisible().catch(() => false)
    
    expect(hasResults || hasNoResultsMessage).toBeTruthy()
  })

  test('should search by contract address', async ({ page }) => {
    // Open search
    const searchIcon = page.locator('button[aria-label="Search"]').first()
    await searchIcon.click()
    
    // Type part of a contract address
    const searchInput = page.locator('input[placeholder*="Search ticker"]')
    await searchInput.fill('0x')
    
    // Wait for results
    await page.waitForTimeout(500)
    
    // Results should update (we just check that the search executes without error)
    await expect(page.locator('.max-w-\\[1200px\\]')).toBeVisible()
  })

  test('should clear search when clicking X', async ({ page }) => {
    // Open search
    const searchIcon = page.locator('button[aria-label="Search"]').first()
    await searchIcon.click()
    
    // Type something
    const searchInput = page.locator('input[placeholder*="Search ticker"]')
    await searchInput.fill('TEST')
    
    // Click clear button
    const clearButton = page.locator('button[aria-label="Clear search"]')
    await clearButton.click()
    
    // Search should be closed
    await expect(searchInput).not.toBeVisible()
    await expect(searchIcon).toBeVisible()
  })

  test('should show no results message for non-existent token', async ({ page }) => {
    // Open search
    const searchIcon = page.locator('button[aria-label="Search"]').first()
    await searchIcon.click()
    
    // Search for something that doesn't exist
    const searchInput = page.locator('input[placeholder*="Search ticker"]')
    await searchInput.fill('ZZZZZZZ999')
    
    // Wait for results
    await page.waitForTimeout(500)
    
    // Should show no results message
    const noResults = page.locator('text=/No tokens found matching/')
    await expect(noResults).toBeVisible()
  })
})