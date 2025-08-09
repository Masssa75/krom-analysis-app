import { test, expect } from '@playwright/test'

test('Test Rugs Filter', async ({ page }) => {
  // Navigate to the app
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  
  // Wait for the page to load
  await page.waitForSelector('h1:has-text("KROM")')
  
  // Wait for Recent Calls section to load
  await page.waitForSelector('text=RECENT CALLS', { timeout: 10000 })
  
  // Find the Rugs filter section and click to expand it
  await page.click('h3:has-text("RUGS")')
  
  // Wait for the filter section to expand
  await page.waitForSelector('text=Include Rugs', { timeout: 5000 })
  
  // Get initial count of tokens
  await page.waitForTimeout(1000) // Wait for data to load
  const initialCountText = await page.textContent('text=/Showing \\d+ of \\d+ calls/')
  console.log('Initial count:', initialCountText)
  
  // Check if the "Include Rugs" checkbox is unchecked by default (excluding rugs)
  const checkbox = page.locator('div').filter({ hasText: /^Include Rugs$/ }).locator('div').first()
  const isChecked = await checkbox.evaluate(el => el.classList.contains('bg-[#00ff88]'))
  console.log('Include Rugs checkbox checked:', isChecked)
  
  // If rugs are excluded by default, click to include them
  if (!isChecked) {
    await checkbox.click()
    await page.waitForTimeout(2000) // Wait for data to reload
    
    const withRugsCount = await page.textContent('text=/Showing \\d+ of \\d+ calls/')
    console.log('Count with rugs included:', withRugsCount)
    
    // Click again to exclude rugs
    await checkbox.click()
    await page.waitForTimeout(2000) // Wait for data to reload
    
    const withoutRugsCount = await page.textContent('text=/Showing \\d+ of \\d+ calls/')
    console.log('Count with rugs excluded:', withoutRugsCount)
    
    // Parse the counts to compare
    const parseCount = (text: string | null) => {
      if (!text) return 0
      const match = text.match(/Showing \d+ of (\d+) calls/)
      return match ? parseInt(match[1]) : 0
    }
    
    const withRugs = parseCount(withRugsCount)
    const withoutRugs = parseCount(withoutRugsCount)
    
    console.log(`Tokens with rugs: ${withRugs}, without rugs: ${withoutRugs}`)
    
    // The count without rugs should be less than or equal to with rugs
    expect(withoutRugs).toBeLessThanOrEqual(withRugs)
    console.log('✓ Rugs filter is working correctly')
  } else {
    // If rugs are included by default, click to exclude them
    await checkbox.click()
    await page.waitForTimeout(2000) // Wait for data to reload
    
    const withoutRugsCount = await page.textContent('text=/Showing \\d+ of \\d+ calls/')
    console.log('Count with rugs excluded:', withoutRugsCount)
    
    // Click again to include rugs
    await checkbox.click()
    await page.waitForTimeout(2000) // Wait for data to reload
    
    const withRugsCount = await page.textContent('text=/Showing \\d+ of \\d+ calls/')
    console.log('Count with rugs included:', withRugsCount)
    
    // Parse the counts to compare
    const parseCount = (text: string | null) => {
      if (!text) return 0
      const match = text.match(/Showing \d+ of (\d+) calls/)
      return match ? parseInt(match[1]) : 0
    }
    
    const withRugs = parseCount(withRugsCount)
    const withoutRugs = parseCount(withoutRugsCount)
    
    console.log(`Tokens with rugs: ${withRugs}, without rugs: ${withoutRugs}`)
    
    // The count without rugs should be less than or equal to with rugs
    expect(withoutRugs).toBeLessThanOrEqual(withRugs)
    console.log('✓ Rugs filter is working correctly')
  }
  
  // Test the filter tooltip text
  const tooltipText = await page.textContent('text=When unchecked, hides tokens with:')
  expect(tooltipText).toBeTruthy()
  console.log('✓ Filter tooltip is present')
})