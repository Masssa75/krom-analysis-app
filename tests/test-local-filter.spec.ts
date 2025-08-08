import { test, expect } from '@playwright/test'

test.describe('Token Type Filter - Local Test', () => {
  test('should filter tokens correctly by type on localhost', async ({ page }) => {
    // Enable request/response logging
    const apiCalls: string[] = []
    page.on('response', response => {
      if (response.url().includes('/api/recent-calls')) {
        apiCalls.push(response.url())
        response.json().then(data => {
          console.log('API Response:', {
            url: response.url(),
            tokenType: new URL(response.url()).searchParams.get('tokenType'),
            tokenCount: data.data?.length,
            tokens: data.data?.map((t: any) => ({
              ticker: t.ticker,
              analysis_type: t.analysis_token_type,
              x_type: t.x_analysis_token_type
            }))
          })
        }).catch(() => {})
      }
    })
    
    // Go to localhost
    await page.goto('http://localhost:3000')
    
    // Wait for the page to load
    await page.waitForTimeout(2000)
    
    // Click on Token Type filter to expand it
    const tokenTypeHeader = page.locator('h3:has-text("TOKEN TYPE")').first()
    await tokenTypeHeader.click()
    
    // Wait for expansion
    await page.waitForTimeout(500)
    
    // Uncheck Meme Tokens to show only Utility
    console.log('Unchecking Meme Tokens...')
    const memeCheckbox = page.locator('div').filter({ hasText: /^Meme Tokens$/ }).locator('div').first()
    await memeCheckbox.click()
    
    // Wait for the filter to apply
    await page.waitForTimeout(2000)
    
    // Check the last API call
    const lastCall = apiCalls[apiCalls.length - 1]
    console.log('Last API call:', lastCall)
    
    // Verify the tokenType parameter
    const url = new URL(lastCall)
    const tokenType = url.searchParams.get('tokenType')
    console.log('Token type parameter:', tokenType)
    
    expect(tokenType).toBe('utility')
    
    // Now check Meme and uncheck Utility
    console.log('Checking Meme, unchecking Utility...')
    await memeCheckbox.click() // Re-check meme
    await page.waitForTimeout(500)
    
    const utilityCheckbox = page.locator('div').filter({ hasText: /^Utility Tokens$/ }).locator('div').first()
    await utilityCheckbox.click() // Uncheck utility
    
    await page.waitForTimeout(2000)
    
    const lastCall2 = apiCalls[apiCalls.length - 1]
    const url2 = new URL(lastCall2)
    const tokenType2 = url2.searchParams.get('tokenType')
    console.log('Token type parameter after switching:', tokenType2)
    
    expect(tokenType2).toBe('meme')
  })
})