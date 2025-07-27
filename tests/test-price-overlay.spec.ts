import { test, expect } from '@playwright/test'

test.describe('Price Overlay Implementation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/test-chart')
  })

  test('should load page and display overlay demos', async ({ page }) => {
    // Check page title (be more specific to avoid multiple h1s)
    await expect(page.locator('h1.text-2xl')).toContainText('Price Overlay Demo')
    
    // Check that all three examples are present
    const examples = page.locator('h2')
    await expect(examples).toHaveCount(3)
    await expect(examples.nth(0)).toContainText('T Token')
    await expect(examples.nth(1)).toContainText('BUNKER Token')
    await expect(examples.nth(2)).toContainText('Micro Cap Token')
  })

  test('should display price overlays correctly', async ({ page }) => {
    // Check first demo container
    const firstDemo = page.locator('.bg-gray-900.rounded-lg').nth(0)
    await expect(firstDemo).toBeVisible()
    
    // Check overlay labels are present
    const overlayContainer = firstDemo.locator('.absolute.top-4.right-4')
    await expect(overlayContainer).toBeVisible()
    
    // Check Entry price label
    const entryLabel = overlayContainer.locator('.bg-green-500\\/90')
    await expect(entryLabel).toContainText('Entry: $0.0152')
    
    // Check ATH price label with percentage
    const athLabel = overlayContainer.locator('.bg-red-500\\/90')
    await expect(athLabel).toContainText('ATH: $0.3301')
    await expect(athLabel).toContainText('+2072%')
    
    // Check Current price label
    const currentLabel = overlayContainer.locator('.bg-blue-500\\/90')
    await expect(currentLabel).toContainText('Now: $0.0895')
    await expect(currentLabel).toContainText('+489%')
  })

  test('should display bottom price bar', async ({ page }) => {
    // Check bottom bar in first demo
    const bottomBar = page.locator('.bg-gray-900.rounded-lg').nth(0).locator('.absolute.bottom-0')
    await expect(bottomBar).toBeVisible()
    
    // Check all three price sections
    const priceSection = bottomBar.locator('.text-center')
    await expect(priceSection).toHaveCount(3)
    
    // Entry section
    await expect(priceSection.nth(0)).toContainText('Entry')
    await expect(priceSection.nth(0)).toContainText('$0.0152')
    
    // ATH section
    await expect(priceSection.nth(1)).toContainText('ATH')
    await expect(priceSection.nth(1)).toContainText('$0.3301')
    await expect(priceSection.nth(1)).toContainText('+2072%')
    
    // Current section
    await expect(priceSection.nth(2)).toContainText('Current')
    await expect(priceSection.nth(2)).toContainText('$0.0895')
  })

  test('should display GeckoTerminal iframe', async ({ page }) => {
    // Check that iframes are present
    const iframes = page.locator('iframe')
    await expect(iframes).toHaveCount(3)
    
    // Check first iframe has correct attributes
    const firstIframe = iframes.nth(0)
    await expect(firstIframe).toHaveAttribute('title', 'GeckoTerminal chart for T')
    
    // Check iframe source includes GeckoTerminal URL
    const src = await firstIframe.getAttribute('src')
    expect(src).toContain('geckoterminal.com')
    expect(src).toContain('arbitrum/pools/')
    expect(src).toContain('embed=1')
    expect(src).toContain('swaps=0') // Ensures transactions are hidden
  })

  test('should handle different price scales correctly', async ({ page }) => {
    // Check BUNKER token (small prices)
    const bunkerDemo = page.locator('.bg-gray-900.rounded-lg').nth(1)
    const bunkerOverlay = bunkerDemo.locator('.absolute.top-4.right-4')
    
    await expect(bunkerOverlay.locator('.bg-green-500\\/90')).toContainText('Entry: $0.002300')
    await expect(bunkerOverlay.locator('.bg-red-500\\/90')).toContainText('ATH: $0.009786')
    
    // Check MICRO token (very small prices)
    const microDemo = page.locator('.bg-gray-900.rounded-lg').nth(2)
    const microOverlay = microDemo.locator('.absolute.top-4.right-4')
    
    await expect(microOverlay.locator('.bg-green-500\\/90')).toContainText('Entry: $2.34e-6')
    await expect(microOverlay.locator('.bg-red-500\\/90')).toContainText('ATH: $0.000016')
  })

  test('overlay labels should not block iframe interaction', async ({ page }) => {
    // Check that overlay has pointer-events-none
    const overlayContainer = page.locator('.absolute.top-4.right-4').first()
    await expect(overlayContainer).toHaveClass(/pointer-events-none/)
  })
})