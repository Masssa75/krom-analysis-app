import { test, expect } from '@playwright/test'

test.describe('Networks Filter', () => {
  test('Networks filter works correctly', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:3000')
    
    // Wait for the page to load
    await page.waitForSelector('text=RECENT CALLS', { timeout: 10000 })
    
    // Expand networks filter
    await page.locator('text=NETWORKS').click()
    await page.waitForTimeout(500)
    
    // Verify all networks are selected by default
    const ethereumCheckbox = page.locator('text=Ethereum').locator('..').locator('div').first()
    const solanaCheckbox = page.locator('text=Solana').locator('..').locator('div').first()
    const bscCheckbox = page.locator('text=BSC').locator('..').locator('div').first()
    const baseCheckbox = page.locator('text=Base').locator('..').locator('div').first()
    
    await expect(ethereumCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    await expect(solanaCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    await expect(bscCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    await expect(baseCheckbox).toHaveClass(/bg-\[#00ff88\]/)
    
    // Uncheck Solana - click the checkbox, not the label
    await solanaCheckbox.click()
    await page.waitForTimeout(1000)
    
    // Verify Solana checkbox is unchecked
    await expect(solanaCheckbox).not.toHaveClass(/bg-\[#00ff88\]/)
    
    // Check that no SOL tokens appear in the network column
    // The network label for SOL tokens is in a span with green background
    const solTokens = await page.locator('tbody tr').filter({ hasText: 'SOL' }).count()
    
    // If there are any SOL tokens visible, this should be 0
    expect(solTokens).toBe(0)
    
    // Check Solana again
    await solanaCheckbox.click()
    await page.waitForTimeout(1000)
    
    // Uncheck Ethereum
    await ethereumCheckbox.click()
    await page.waitForTimeout(1000)
    
    // Verify no ETH tokens appear
    const ethTokens = await page.locator('span:has-text("ETH")').count()
    expect(ethTokens).toBe(0)
    
    // Try to uncheck all (should not allow)
    await solanaCheckbox.click()
    await bscCheckbox.click()
    await baseCheckbox.click()
    await page.waitForTimeout(500)
    
    // At least one should still be selected (Base should remain selected)
    const checkedCount = await page.locator('.bg-\\[\\#00ff88\\]').count()
    expect(checkedCount).toBeGreaterThan(0)
  })
  
  test('Networks filter works with Token Type filter', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:3000')
    
    // Wait for the page to load
    await page.waitForSelector('text=RECENT CALLS', { timeout: 10000 })
    
    // Expand Token Type filter - wait for it to be visible first
    await page.waitForSelector('text=TOKEN TYPE', { state: 'visible' })
    await page.locator('text=TOKEN TYPE').click()
    await page.waitForTimeout(500)
    
    // Wait for the checkbox to be visible before clicking
    await page.waitForSelector('text=Utility Tokens', { state: 'visible' })
    
    // Uncheck Utility tokens - click the checkbox, not the label
    const utilityCheckbox = page.locator('text=Utility Tokens').locator('..').locator('div').first()
    await utilityCheckbox.click({ force: true })
    await page.waitForTimeout(1000)
    
    // Expand Networks filter
    await page.locator('text=NETWORKS').click()
    await page.waitForTimeout(500)
    
    // Uncheck Ethereum - click the checkbox
    const ethereumCheckbox = page.locator('text=Ethereum').locator('..').locator('div').first()
    await ethereumCheckbox.click()
    await page.waitForTimeout(1000)
    
    // Verify filters are working together
    // Should only show Meme tokens on Solana, BSC, or Base
    const tableRows = await page.locator('tbody tr').count()
    
    // Check that we have some results
    expect(tableRows).toBeGreaterThan(0)
    
    // Verify no ETH tokens appear
    const ethTokens = await page.locator('span:has-text("ETH")').count()
    expect(ethTokens).toBe(0)
  })
})