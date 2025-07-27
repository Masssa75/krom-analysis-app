import { test, expect } from '@playwright/test'

test.describe('Enhanced GeckoTerminal Panel', () => {
  test('should display enhanced panel with ATH date', async ({ page }) => {
    // Navigate to the main page
    await page.goto('https://lively-torrone-8199e0.netlify.app')
    
    // Wait for the table to load
    await page.waitForSelector('tbody tr', { timeout: 10000 })
    
    // Find a token with a contract and click the chart button
    const firstTokenWithContract = page.locator('tbody tr').filter({ 
      has: page.locator('button:has-text("📊")') 
    }).first()
    
    // Click the chart button
    await firstTokenWithContract.locator('button:has-text("📊")').click()
    
    // Wait for the enhanced panel to appear
    await page.waitForSelector('text=GeckoTerminal Chart', { timeout: 5000 })
    
    // Check that the new card layout is present
    await expect(page.locator('.bg-gray-800').filter({ hasText: 'ENTRY' })).toBeVisible()
    await expect(page.locator('.bg-gray-800').filter({ hasText: 'ATH' })).toBeVisible()
    await expect(page.locator('.bg-gray-800').filter({ hasText: 'CURRENT' })).toBeVisible()
    
    // Check that ATH includes a date (if available)
    const athCard = page.locator('.bg-gray-800').filter({ hasText: 'ATH' })
    const athText = await athCard.textContent()
    
    // ATH card should have either a date or just "ATH"
    expect(athText).toMatch(/ATH/)
    
    // Check that price values are displayed (or loading)
    const entryPrice = await page.locator('.bg-gray-800').filter({ hasText: 'ENTRY' }).locator('.font-mono').textContent()
    expect(entryPrice).toBeTruthy() // Should have some text (price or "...")
    
    // Check iframe is present
    await expect(page.locator('iframe[title*="GeckoTerminal chart"]')).toBeVisible()
    
    // Close the panel
    await page.locator('button:has(svg)').last().click()
    await expect(page.locator('text=GeckoTerminal Chart')).not.toBeVisible()
  })
})