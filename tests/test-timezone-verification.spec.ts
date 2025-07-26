import { test, expect } from '@playwright/test'

test('Verify Thai timezone conversion in tooltip', async ({ page }) => {
  // First, let's test the timezone conversion locally
  const testDate = '2025-07-26T02:10:00Z' // UTC time
  const thaiTime = new Date(testDate).toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  console.log('UTC time:', testDate)
  console.log('Thai time:', thaiTime)
  console.log('Expected: Jul 26, 2025, 09:10 AM (Thai time is UTC+7)')
  
  // Now test on the actual page
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  await page.waitForLoadState('networkidle')
  
  // Wait for table
  await page.waitForSelector('table', { timeout: 30000 })
  
  // Get first date cell
  const datePattern = /[A-Z][a-z]{2}\s+\d{1,2}/
  const dateCell = await page.locator('td').filter({ hasText: datePattern }).first()
  const dateSpan = await dateCell.locator('span').first()
  
  // Get the title attribute
  const titleAttr = await dateSpan.getAttribute('title')
  console.log('Actual tooltip text:', titleAttr)
  
  // Verify it contains Thai Time indicator
  expect(titleAttr).toContain('(Thai Time)')
  
  // Check visual indicators
  const className = await dateSpan.getAttribute('class')
  console.log('Classes:', className)
  expect(className).toContain('cursor-help')
  expect(className).toContain('border-dotted')
  
  // Hover and take screenshot
  await dateSpan.hover()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'thai-timezone-tooltip.png', fullPage: false })
})