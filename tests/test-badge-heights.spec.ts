import { test, expect } from '@playwright/test'

test('Check badge heights are consistent', async ({ page }) => {
  // Navigate to the page
  await page.goto('https://krom1.com')
  
  // Wait for the page to load and badges to appear
  await page.waitForSelector('span:has-text("C:")', { timeout: 30000 })
  
  // Wait a bit for all badges to render
  await page.waitForTimeout(2000)
  
  // Get all badge elements
  const callBadges = await page.locator('span:has-text("C:")').all()
  const xBadges = await page.locator('span:has-text("X:")').all()
  // Get both regular website badges and NO SITE badges
  const websiteBadges = await page.locator('span').filter({ hasText: /^W:/ }).all()
  
  console.log(`Found ${callBadges.length} Call badges`)
  console.log(`Found ${xBadges.length} X badges`)
  console.log(`Found ${websiteBadges.length} Website badges`)
  
  // Check heights of first few badges of each type
  const badgeHeights = {
    call: [],
    x: [],
    website: []
  }
  
  // Get heights for Call badges
  for (let i = 0; i < Math.min(3, callBadges.length); i++) {
    const box = await callBadges[i].boundingBox()
    if (box) {
      badgeHeights.call.push(box.height)
      console.log(`Call badge ${i}: height = ${box.height}px`)
    }
  }
  
  // Get heights for X badges
  for (let i = 0; i < Math.min(3, xBadges.length); i++) {
    const box = await xBadges[i].boundingBox()
    if (box) {
      badgeHeights.x.push(box.height)
      console.log(`X badge ${i}: height = ${box.height}px`)
    }
  }
  
  // Get heights for Website badges
  for (let i = 0; i < Math.min(3, websiteBadges.length); i++) {
    const box = await websiteBadges[i].boundingBox()
    if (box) {
      badgeHeights.website.push(box.height)
      console.log(`Website badge ${i}: height = ${box.height}px`)
    }
  }
  
  // Check computed styles for font sizes
  if (callBadges.length > 0) {
    const callFontSize = await callBadges[0].evaluate(el => window.getComputedStyle(el).fontSize)
    console.log(`Call badge computed font-size: ${callFontSize}`)
  }
  
  if (xBadges.length > 0) {
    const xFontSize = await xBadges[0].evaluate(el => window.getComputedStyle(el).fontSize)
    console.log(`X badge computed font-size: ${xFontSize}`)
  }
  
  if (websiteBadges.length > 0) {
    const websiteFontSize = await websiteBadges[0].evaluate(el => window.getComputedStyle(el).fontSize)
    console.log(`Website badge computed font-size: ${websiteFontSize}`)
  }
  
  // Take a screenshot of badges for visual inspection
  const firstRow = await page.locator('[class*="border-b border-\\[#1a1c1f\\]"]').first()
  await firstRow.screenshot({ path: 'badge-heights-test.png' })
  
  // Check if all heights are similar (within 2px tolerance)
  const allHeights = [...badgeHeights.call, ...badgeHeights.x, ...badgeHeights.website]
  const minHeight = Math.min(...allHeights)
  const maxHeight = Math.max(...allHeights)
  
  console.log(`Height range: ${minHeight}px - ${maxHeight}px`)
  console.log(`Difference: ${maxHeight - minHeight}px`)
  
  // Fail if difference is more than 2px
  expect(maxHeight - minHeight).toBeLessThanOrEqual(2)
})