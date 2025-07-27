import { test, expect } from '@playwright/test'

test.describe('Lightweight Chart Implementation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/test-chart')
  })

  test('should load chart page without errors', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Lightweight Charts Test')
    
    // Check that all three examples are present
    await expect(page.locator('h2')).toHaveCount(3)
    await expect(page.locator('h2').nth(0)).toContainText('T Token')
    await expect(page.locator('h2').nth(1)).toContainText('BUNKER Token')
    await expect(page.locator('h2').nth(2)).toContainText('Micro Cap Token')
  })

  test('should display chart containers', async ({ page }) => {
    // Wait for chart containers to be visible
    const chartContainers = page.locator('.bg-gray-900.rounded-lg')
    await expect(chartContainers).toHaveCount(3)
    
    // Check first chart has correct token info
    const firstChart = chartContainers.nth(0)
    await expect(firstChart.locator('h3')).toContainText('T - Lightweight Charts Test')
    await expect(firstChart).toContainText('Entry: $0.0152')
    await expect(firstChart).toContainText('ATH: $0.3301')
    await expect(firstChart).toContainText('+2072%') // Percentage gain
  })

  test('should render canvas elements for charts', async ({ page }) => {
    // Wait for Lightweight Charts to create canvas elements
    await page.waitForTimeout(1000) // Give charts time to initialize
    
    // Check that canvas elements are created (Lightweight Charts uses canvas)
    const canvasElements = page.locator('canvas')
    await expect(canvasElements).toHaveCount(3) // One for each chart
    
    // Verify canvases have reasonable dimensions
    const firstCanvas = canvasElements.nth(0)
    const box = await firstCanvas.boundingBox()
    expect(box?.width).toBeGreaterThan(300)
    expect(box?.height).toBe(500) // We set height to 500 in the component
  })

  test('should display price information correctly', async ({ page }) => {
    // Check BUNKER token prices
    const bunkerChart = page.locator('.bg-gray-900.rounded-lg').nth(1)
    await expect(bunkerChart).toContainText('Entry: $0.0023')
    await expect(bunkerChart).toContainText('ATH: $0.009786')
    await expect(bunkerChart).toContainText('+325%') // Approximate percentage
    
    // Check micro cap token with very small prices
    const microChart = page.locator('.bg-gray-900.rounded-lg').nth(2)
    await expect(microChart).toContainText('Entry: $0.00000234')
    await expect(microChart).toContainText('ATH: $0.00001567')
  })

  test('should not have any console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.reload()
    await page.waitForTimeout(2000) // Wait for charts to fully load
    
    // Check no errors were logged
    expect(errors).toHaveLength(0)
  })
})