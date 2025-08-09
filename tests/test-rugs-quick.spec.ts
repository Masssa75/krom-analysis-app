import { test, expect } from '@playwright/test'

test.setTimeout(30000)

test('Quick Rugs Filter Test', async ({ page }) => {
  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  
  // Wait for the page to load
  await page.waitForSelector('h1:has-text("KROM")', { timeout: 10000 })
  
  // Find and click the Rugs filter section
  await page.click('h3:has-text("RUGS")')
  
  // Check if Include Rugs checkbox is visible
  const includeRugsVisible = await page.isVisible('text=Include Rugs')
  console.log('Include Rugs checkbox visible:', includeRugsVisible)
  expect(includeRugsVisible).toBeTruthy()
  
  // Check if the tooltip text is visible
  const tooltipVisible = await page.isVisible('text=When unchecked, hides tokens with:')
  console.log('Tooltip text visible:', tooltipVisible)
  expect(tooltipVisible).toBeTruthy()
  
  console.log('✓ Rugs filter UI elements are present and working')
})