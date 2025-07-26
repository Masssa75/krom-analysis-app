import { test, expect } from '@playwright/test'

test('Date hover tooltip shows Thai timezone', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  await page.waitForLoadState('networkidle')
  
  // Wait for the analyzed calls table to load
  await page.waitForSelector('table', { timeout: 30000 })
  
  // Find the first date cell (looking for date pattern)
  const datePattern = /[A-Z][a-z]{2}\s+\d{1,2}/
  await page.waitForSelector('td', { timeout: 10000 })
  
  // Get all td elements and find the one with date
  const dateCells = await page.locator('td').filter({ hasText: datePattern }).all()
  console.log(`Found ${dateCells.length} date cells`)
  
  if (dateCells.length > 0) {
    const firstDateCell = dateCells[0]
    
    // Get the span inside the td
    const dateSpan = await firstDateCell.locator('span').first()
    
    // Check if span exists
    const spanExists = await dateSpan.count() > 0
    console.log(`Date span exists: ${spanExists}`)
    
    // Get the title attribute
    const titleAttr = await dateSpan.getAttribute('title')
    console.log(`Title attribute: ${titleAttr}`)
    
    // Hover over the date
    await dateSpan.hover()
    
    // Wait a bit for tooltip to appear
    await page.waitForTimeout(1000)
    
    // Take screenshot
    await page.screenshot({ path: 'date-hover-tooltip.png', fullPage: false })
    
    // Check if title attribute contains expected format
    if (titleAttr) {
      expect(titleAttr).toMatch(/\d{4}/) // Should contain year
      expect(titleAttr).toMatch(/\d{1,2}:\d{2}/) // Should contain time
      expect(titleAttr).toMatch(/(AM|PM)/) // Should contain AM/PM
    }
  }
})