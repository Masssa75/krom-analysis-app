import { test } from '@playwright/test'

test('Take screenshot of badges', async ({ page }) => {
  // Navigate to the page
  await page.goto('https://krom1.com')
  
  // Wait for badges to load
  await page.waitForSelector('span:has-text("C:")', { timeout: 30000 })
  await page.waitForTimeout(2000)
  
  // Take full page screenshot
  await page.screenshot({ path: 'full-page-badges.png', fullPage: false })
  
  // Take screenshot of first 5 rows
  const rows = await page.locator('[class*="border-b border-\\[#1a1c1f\\]"]').all()
  
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    await rows[i].screenshot({ path: `row-${i}-badges.png` })
    
    // Log what badges are in this row
    const callBadge = await rows[i].locator('span:has-text("C:")').first()
    const xBadge = await rows[i].locator('span:has-text("X:")').first()
    const wBadge = await rows[i].locator('span').filter({ hasText: /^W:/ }).first()
    
    const hasCall = await callBadge.count() > 0
    const hasX = await xBadge.count() > 0
    const hasW = await wBadge.count() > 0
    
    console.log(`Row ${i}: C=${hasCall}, X=${hasX}, W=${hasW}`)
    
    if (hasCall) {
      const text = await callBadge.textContent()
      console.log(`  Call badge: "${text}"`)
    }
    if (hasX) {
      const text = await xBadge.textContent()
      console.log(`  X badge: "${text}"`)
    }
    if (hasW) {
      const text = await wBadge.textContent()
      console.log(`  W badge: "${text}"`)
    }
  }
})