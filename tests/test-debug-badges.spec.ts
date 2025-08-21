import { test } from '@playwright/test'

test('Debug badge selectors', async ({ page }) => {
  // Navigate to the page
  await page.goto('https://krom1.com')
  
  // Wait for page to load
  await page.waitForTimeout(5000)
  
  // Take screenshot
  await page.screenshot({ path: 'debug-page.png', fullPage: false })
  
  // Try different selectors
  console.log('=== Checking for badge elements ===')
  
  // Check for any span elements
  const allSpans = await page.locator('span').count()
  console.log(`Total spans on page: ${allSpans}`)
  
  // Check for spans with "C:" text
  const cSpans = await page.locator('span:text("C:")').count()
  console.log(`Spans with "C:": ${cSpans}`)
  
  // Check with contains
  const cContains = await page.locator('span:text-matches("C:", "i")').count()
  console.log(`Spans containing "C:": ${cContains}`)
  
  // Check for any element with C:
  const anyC = await page.locator('*:text("C:")').count()
  console.log(`Any element with "C:": ${anyC}`)
  
  // Get first 10 span texts
  const spans = await page.locator('span').all()
  console.log('\n=== First 20 span texts ===')
  for (let i = 0; i < Math.min(20, spans.length); i++) {
    const text = await spans[i].textContent()
    if (text && text.trim()) {
      console.log(`Span ${i}: "${text}"`)
    }
  }
  
  // Check for specific classes
  const borderRows = await page.locator('.border-b').count()
  console.log(`\nElements with border-b class: ${borderRows}`)
  
  // Look for flex containers with badges
  const flexContainers = await page.locator('.flex.gap-1\\.5').count()
  console.log(`Flex containers with gap-1.5: ${flexContainers}`)
})