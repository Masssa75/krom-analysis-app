import { test, expect } from '@playwright/test'

test('Date column is displayed in analyzed calls table', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  await page.waitForLoadState('networkidle')
  
  // Wait for the analyzed calls table to load
  await page.waitForSelector('table', { timeout: 30000 })
  
  // Check that the Date column header exists
  const dateHeader = await page.locator('th:has-text("Date")').count()
  expect(dateHeader).toBeGreaterThan(0)
  
  // Check that date values are displayed in the table
  // Looking for the date format like "Jul 20, 24" or similar
  const datePattern = /[A-Z][a-z]{2}\s+\d{1,2},\s+\d{2}/
  const dateCell = await page.locator('td').filter({ hasText: datePattern }).first()
  
  // Verify at least one date cell exists
  const dateCellCount = await page.locator('td').filter({ hasText: datePattern }).count()
  expect(dateCellCount).toBeGreaterThan(0)
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'date-column-verification.png', fullPage: false })
})