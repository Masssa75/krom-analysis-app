import { test, expect } from '@playwright/test'

test('Contract address is displayed below KROM logo', async ({ page }) => {
  // Navigate to the deployed app
  await page.goto('https://lively-torrone-8199e0.netlify.app/')
  
  // Check that "Contract Address:" label is visible
  const contractLabel = page.locator('div').filter({ hasText: /^Contract Address:$/ })
  await expect(contractLabel).toBeVisible()
  await expect(contractLabel).toHaveText('Contract Address:')
  
  // Check that the contract address is displayed
  const contractAddress = page.locator('div.font-mono').filter({
    hasText: '9eCEK7ttNtroHsFLnW8jW7pS9MtSAPrPPrZ6QCUFpump'
  })
  await expect(contractAddress).toBeVisible()
  
  // Verify it's in the correct location (in the sidebar header)
  const sidebarHeader = page.locator('.p-5.border-b.border-\\[\\#1a1c1f\\]').first()
  await expect(sidebarHeader).toContainText('KROM')
  await expect(sidebarHeader).toContainText('Advanced AI Powered Token Discovery')
  await expect(sidebarHeader).toContainText('Contract Address:')
  await expect(sidebarHeader).toContainText('9eCEK7ttNtroHsFLnW8jW7pS9MtSAPrPPrZ6QCUFpump')
  
  // Check styling
  await expect(contractAddress).toHaveCSS('font-family', /mono/i)
  await expect(contractAddress).toHaveCSS('word-break', 'break-all')
  
  console.log('✅ Contract address displayed correctly below KROM logo')
})