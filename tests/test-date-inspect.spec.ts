import { test, expect } from '@playwright/test'

test('Inspect date cell HTML structure', async ({ page }) => {
  await page.goto('https://lively-torrone-8199e0.netlify.app')
  await page.waitForLoadState('networkidle')
  
  // Wait for the analyzed calls table to load
  await page.waitForSelector('table', { timeout: 30000 })
  
  // Find the first date cell
  const datePattern = /[A-Z][a-z]{2}\s+\d{1,2}/
  const dateCell = await page.locator('td').filter({ hasText: datePattern }).first()
  
  // Get the inner HTML
  const innerHTML = await dateCell.innerHTML()
  console.log('Date cell HTML:', innerHTML)
  
  // Get the outer HTML
  const outerHTML = await dateCell.evaluate(el => el.outerHTML)
  console.log('Date cell outer HTML:', outerHTML)
  
  // Check computed styles
  const styles = await dateCell.evaluate(el => {
    const computed = window.getComputedStyle(el)
    return {
      cursor: computed.cursor,
      display: computed.display,
      position: computed.position
    }
  })
  console.log('Date cell styles:', styles)
  
  // Check the span element specifically
  const span = await dateCell.locator('span').first()
  if (await span.count() > 0) {
    const spanHTML = await span.evaluate(el => el.outerHTML)
    console.log('Span HTML:', spanHTML)
    
    const spanStyles = await span.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        cursor: computed.cursor,
        display: computed.display
      }
    })
    console.log('Span styles:', spanStyles)
  }
})