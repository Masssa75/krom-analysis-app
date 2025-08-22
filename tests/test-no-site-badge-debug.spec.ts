import { test, expect } from '@playwright/test'

test('Debug NO SITE badge styles', async ({ page }) => {
  // Navigate to the page
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  
  // Wait for the page to load
  await page.waitForSelector('text=RECENT CALLS', { timeout: 30000 })
  await page.waitForTimeout(2000)
  
  // Enable website analysis column
  const settingsButton = page.locator('button[title="Column Settings"]').first()
  await settingsButton.click()
  await page.waitForTimeout(500)
  
  const websiteCheckbox = page.locator('text=Website Analysis').locator('..').locator('input[type="checkbox"]').first()
  const isChecked = await websiteCheckbox.isChecked()
  
  if (!isChecked) {
    console.log('Enabling Website Analysis column...')
    await websiteCheckbox.click()
    await page.waitForTimeout(500)
  }
  
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  
  // Find NO SITE badges
  const noSiteBadges = await page.locator('span').filter({ hasText: /NO\s*SITE/ }).all()
  const basicBadges = await page.locator('span').filter({ hasText: /W:\s*BASIC/ }).all()
  
  console.log(`Found ${noSiteBadges.length} NO SITE badges`)
  console.log(`Found ${basicBadges.length} W: BASIC badges`)
  
  // Check first NO SITE badge
  if (noSiteBadges.length > 0) {
    const badge = noSiteBadges[0]
    const text = await badge.textContent()
    const box = await badge.boundingBox()
    
    console.log('\n=== NO SITE Badge ===')
    console.log(`Text: "${text}"`)
    console.log(`Height: ${box?.height}px`)
    
    // Get computed styles
    const styles = await badge.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        display: computed.display,
        whiteSpace: computed.whiteSpace,
        lineHeight: computed.lineHeight,
        fontSize: computed.fontSize,
        height: computed.height,
        padding: computed.padding,
        boxSizing: computed.boxSizing,
        width: computed.width,
        minWidth: computed.minWidth,
        maxWidth: computed.maxWidth,
        overflow: computed.overflow,
        wordBreak: computed.wordBreak,
        wordWrap: computed.wordWrap
      }
    })
    console.log('Computed styles:', JSON.stringify(styles, null, 2))
    
    // Check the actual HTML
    const html = await badge.evaluate(el => el.outerHTML)
    console.log('HTML:', html)
    
    // Check text nodes
    const textNodes = await badge.evaluate(el => {
      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        null
      )
      const nodes = []
      let node
      while (node = walker.nextNode()) {
        nodes.push({
          text: node.textContent,
          length: node.textContent?.length
        })
      }
      return nodes
    })
    console.log('Text nodes:', textNodes)
  }
  
  // Compare with BASIC badge
  if (basicBadges.length > 0) {
    const badge = basicBadges[0]
    const text = await badge.textContent()
    const box = await badge.boundingBox()
    
    console.log('\n=== W: BASIC Badge ===')
    console.log(`Text: "${text}"`)
    console.log(`Height: ${box?.height}px`)
    
    const styles = await badge.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        display: computed.display,
        whiteSpace: computed.whiteSpace,
        lineHeight: computed.lineHeight,
        fontSize: computed.fontSize,
        height: computed.height,
        padding: computed.padding
      }
    })
    console.log('Key styles:', JSON.stringify(styles, null, 2))
  }
})