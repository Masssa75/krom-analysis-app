import { test, expect } from '@playwright/test'

test('Test website badge heights when visible', async ({ page }) => {
  // Navigate to the page
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  
  // Wait for the page to load
  await page.waitForSelector('text=RECENT CALLS', { timeout: 30000 })
  await page.waitForTimeout(2000)
  
  // Click the settings button to show column settings
  const settingsButton = page.locator('button[title="Column Settings"]').first()
  await settingsButton.click()
  await page.waitForTimeout(500)
  
  // Check if website analysis is visible
  const websiteCheckbox = page.locator('text=Website Analysis').locator('..').locator('input[type="checkbox"]').first()
  const isChecked = await websiteCheckbox.isChecked()
  
  if (!isChecked) {
    console.log('Enabling Website Analysis column...')
    await websiteCheckbox.click()
    await page.waitForTimeout(500)
  }
  
  // Close the settings modal by clicking the X or pressing Escape
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  
  // Now check for website badges
  const websiteBadges = await page.locator('span').filter({ hasText: /W:/ }).all()
  console.log(`Found ${websiteBadges.length} Website badges`)
  
  // Check heights
  const heights = []
  for (let i = 0; i < Math.min(5, websiteBadges.length); i++) {
    const badge = websiteBadges[i]
    const text = await badge.textContent()
    const box = await badge.boundingBox()
    if (box) {
      heights.push(box.height)
      console.log(`Website badge ${i}: "${text}" - ${box.height}px`)
    }
  }
  
  // Check if all heights are consistent
  if (heights.length > 0) {
    const minHeight = Math.min(...heights)
    const maxHeight = Math.max(...heights)
    console.log(`Height range: ${minHeight}px - ${maxHeight}px`)
    console.log(`Difference: ${maxHeight - minHeight}px`)
    
    expect(maxHeight - minHeight).toBeLessThanOrEqual(2)
  }
})