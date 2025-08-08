import { test, expect } from '@playwright/test'

test('Floating action menu works correctly', async ({ page }) => {
  // Navigate to the deployed app
  await page.goto('https://lively-torrone-8199e0.netlify.app/')
  
  // Find the main FAB button (green gradient button with Plus icon)
  const fabButton = page.locator('button').filter({
    has: page.locator('svg')
  }).filter({
    hasText: /^$/ // Empty button with just an icon
  }).last() // Get the last one (FAB is at the bottom)
  
  // Check the button is visible
  await expect(fabButton).toBeVisible()
  
  // Click to open the menu
  await fabButton.click()
  
  // Wait for menu items to appear
  await page.waitForTimeout(500)
  
  // Check that menu items are visible
  const settingsLabel = page.locator('span:has-text("Settings")')
  const leaderboardLabel = page.locator('span:has-text("Leaderboard")')
  const analyticsLabel = page.locator('span:has-text("Analytics")')
  const roadmapLabel = page.locator('span:has-text("Roadmap")')
  const chartsLabel = page.locator('span:has-text("Charts")')
  
  await expect(settingsLabel).toBeVisible()
  await expect(leaderboardLabel).toBeVisible()
  await expect(analyticsLabel).toBeVisible()
  await expect(roadmapLabel).toBeVisible()
  await expect(chartsLabel).toBeVisible()
  
  // Check overlay is visible
  const overlay = page.locator('div.fixed.inset-0.bg-black\\/50')
  await expect(overlay).toBeVisible()
  
  // Click overlay to close menu
  await overlay.click()
  
  // Wait for animation to complete
  await page.waitForTimeout(500)
  
  // Check that overlay is hidden
  await expect(overlay).not.toBeVisible()
  
  // Menu items should be hidden too (parent container has opacity-0)
  const menuContainer = page.locator('.absolute.bottom-\\[70px\\].right-0').first()
  await expect(menuContainer).toHaveCSS('opacity', '0')
  
  console.log('✅ Floating action menu opens and closes correctly')
})