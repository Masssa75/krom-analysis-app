import { test, expect } from '@playwright/test'

test('debug chart error', async ({ page }) => {
  // Navigate and wait for error details
  await page.goto('http://localhost:3001/test-chart')
  
  // Wait for error to appear
  await page.waitForSelector('#nextjs__container_errors_desc', { timeout: 5000 })
  
  // Get error details
  const errorType = await page.locator('#nextjs__container_errors_desc h2').textContent()
  const errorMessage = await page.locator('#nextjs__container_errors_desc').textContent()
  
  console.log('Error Type:', errorType)
  console.log('Error Message:', errorMessage)
  
  // Get stack trace if available
  const stackTrace = await page.locator('pre').first().textContent().catch(() => 'No stack trace')
  console.log('Stack Trace:', stackTrace)
})