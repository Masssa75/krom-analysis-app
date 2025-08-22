import { test, expect } from '@playwright/test'

test('Check for text wrapping in badges', async ({ page }) => {
  // Navigate to the page
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  
  // Wait for the page to load
  await page.waitForSelector('text=RECENT CALLS', { timeout: 30000 })
  await page.waitForTimeout(3000)
  
  // Get all badge spans
  const badges = await page.locator('span').filter({ hasText: /^[CXW]:/ }).all()
  
  console.log(`Checking ${badges.length} badges for wrapping issues...`)
  
  const heightMap = new Map()
  
  for (let i = 0; i < badges.length; i++) {
    const badge = badges[i]
    const text = await badge.textContent()
    const box = await badge.boundingBox()
    
    if (box) {
      // Group by height
      if (!heightMap.has(box.height)) {
        heightMap.set(box.height, [])
      }
      heightMap.get(box.height).push(text)
      
      // Check computed styles
      if (box.height > 15) {
        const styles = await badge.evaluate(el => {
          const computed = window.getComputedStyle(el)
          return {
            display: computed.display,
            whiteSpace: computed.whiteSpace,
            lineHeight: computed.lineHeight,
            fontSize: computed.fontSize,
            height: computed.height,
            padding: computed.padding,
            boxSizing: computed.boxSizing
          }
        })
        console.log(`Tall badge: "${text}" (${box.height}px)`)
        console.log('  Styles:', JSON.stringify(styles, null, 2))
        
        // Check if text has any special characters
        console.log('  Text length:', text?.length)
        console.log('  Has whitespace:', /\s/.test(text || ''))
        console.log('  Has newline:', /\n/.test(text || ''))
      }
    }
  }
  
  // Print summary
  console.log('\n=== Height Summary ===')
  for (const [height, texts] of heightMap.entries()) {
    console.log(`${height}px: ${texts.length} badges`)
    console.log(`  Examples: ${texts.slice(0, 3).join(', ')}`)
  }
})