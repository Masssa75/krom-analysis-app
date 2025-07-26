import { test, expect } from '@playwright/test'

test('GeckoTerminal chart view displays correctly', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  await page.waitForLoadState('networkidle')
  
  // Wait for the table to load
  await page.waitForSelector('table', { timeout: 30000 })
  
  // Find and click the first token with a contract (clickable token name)
  const firstTokenButton = await page.locator('button.font-mono').first()
  const tokenName = await firstTokenButton.textContent()
  console.log('Opening chart for token:', tokenName)
  
  await firstTokenButton.click()
  
  // Wait for the GeckoTerminal panel to open
  await page.waitForSelector('h3:has-text("GeckoTerminal Chart")', { timeout: 5000 })
  
  // Verify the panel elements
  // 1. Check title contains token name
  const chartTitle = await page.locator('h3:has-text("GeckoTerminal Chart")').textContent()
  expect(chartTitle).toContain(tokenName)
  
  // 2. Check call date/time is displayed
  const callTimeElement = await page.locator('span:has-text("Call:")').count()
  expect(callTimeElement).toBeGreaterThan(0)
  
  // 3. Check price information is displayed (Entry, ATH, Now)
  const entryLabel = await page.locator('div:has-text("Entry")').first().count()
  const athLabel = await page.locator('div:has-text("ATH")').first().count()
  const nowLabel = await page.locator('div:has-text("Now")').first().count()
  
  expect(entryLabel).toBeGreaterThan(0)
  expect(athLabel).toBeGreaterThan(0)
  expect(nowLabel).toBeGreaterThan(0)
  
  // 4. Check iframe is present
  const iframe = await page.locator('iframe[title*="GeckoTerminal chart"]').count()
  expect(iframe).toBe(1)
  
  // 5. Verify no "Open in GeckoTerminal" button (removed)
  const openButton = await page.locator('button:has-text("Open in GeckoTerminal")').count()
  expect(openButton).toBe(0)
  
  // 6. Verify no bottom bar with text about chart not loading
  const bottomBarText = await page.locator('text="If the chart doesn\'t load"').count()
  expect(bottomBarText).toBe(0)
  
  // Take screenshot
  await page.screenshot({ path: 'geckoterminal-chart-view.png', fullPage: false })
  
  // Close the panel
  await page.locator('button[aria-label*="Close"]').or(page.locator('button:has(svg.lucide-x)')).first().click()
  
  // Verify panel is closed
  await expect(page.locator('h3:has-text("GeckoTerminal Chart")')).toHaveCount(0)
})