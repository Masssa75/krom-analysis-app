import { test, expect } from '@playwright/test'

test('Networks filter basic functionality', async ({ page }) => {
  // Navigate to the page
  await page.goto('http://localhost:3000')
  
  // Wait for the page to load
  await page.waitForSelector('text=RECENT CALLS', { timeout: 10000 })
  
  // Expand networks filter
  await page.locator('text=NETWORKS').click()
  await page.waitForTimeout(500)
  
  // All networks should be selected by default
  const checkedBoxes = await page.locator('.bg-\\[\\#00ff88\\]').count()
  
  // Should have at least 4 checked (4 networks + any other green elements)
  expect(checkedBoxes).toBeGreaterThanOrEqual(4)
  
  // Click Solana checkbox to uncheck it
  const solanaCheckbox = page.locator('text=Solana').locator('..').locator('div').first()
  await solanaCheckbox.click()
  await page.waitForTimeout(2000) // Give time for the data to reload
  
  // Count table rows before and after
  const tableRows = await page.locator('tbody tr').count()
  console.log('Table rows after unchecking Solana:', tableRows)
  
  // Should have some rows (but not all)
  expect(tableRows).toBeGreaterThan(0)
  expect(tableRows).toBeLessThanOrEqual(20) // Max items per page
  
  // Re-check Solana
  await solanaCheckbox.click()
  await page.waitForTimeout(2000)
  
  // Should have rows again
  const rowsAfterRecheck = await page.locator('tbody tr').count()
  expect(rowsAfterRecheck).toBeGreaterThan(0)
})