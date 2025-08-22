import { test, expect } from '@playwright/test'

test('Debug badge heights', async ({ page }) => {
  // Navigate to the page
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  
  // Wait for the page to load and badges to appear
  await page.waitForSelector('text=RECENT CALLS', { timeout: 30000 })
  
  // Wait a bit for all badges to render
  await page.waitForTimeout(3000)
  
  // Get all span elements that contain badge text
  const allSpans = await page.locator('span').filter({ hasText: /^[CXW]:/ }).all()
  
  console.log(`Found ${allSpans.length} total badge spans`)
  
  // Check each span
  for (let i = 0; i < Math.min(10, allSpans.length); i++) {
    const span = allSpans[i]
    const text = await span.textContent()
    const box = await span.boundingBox()
    const classes = await span.getAttribute('class')
    
    // Check if it's inside a tooltip wrapper
    const parent = await span.locator('..').first()
    const parentTag = await parent.evaluate(el => el.tagName.toLowerCase())
    const parentClasses = await parent.getAttribute('class')
    
    console.log(`Badge ${i}: "${text}"`)
    console.log(`  Height: ${box?.height}px`)
    console.log(`  Classes: ${classes}`)
    console.log(`  Parent: <${parentTag}> with classes: ${parentClasses}`)
    console.log('---')
  }
  
  // Also check for W: badges specifically
  console.log('\nLooking for W: badges specifically...')
  const wBadges = await page.locator('span').filter({ hasText: /W:/ }).count()
  console.log(`Found ${wBadges} spans containing "W:"`)
  
  // Try different selectors
  const noSiteBadges = await page.locator('span:has-text("NO SITE")').count()
  console.log(`Found ${noSiteBadges} spans containing "NO SITE"`)
  
  const wNoSite = await page.locator('span:has-text("W: NO SITE")').count()
  console.log(`Found ${wNoSite} spans containing "W: NO SITE"`)
  
  // Take a screenshot for visual inspection
  await page.screenshot({ path: 'badge-heights-debug.png', fullPage: false })
})