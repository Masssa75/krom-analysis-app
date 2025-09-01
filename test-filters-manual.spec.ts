import { test, expect } from '@playwright/test';

test.describe('Manual Filter Check', () => {
  test('Check filter elements are present', async ({ page }) => {
    // Go to the production site
    await page.goto('https://krom1.com/projects-rated');
    
    // Wait for page to load
    await page.waitForSelector('.bg-\\[\\#111214\\]', { timeout: 20000 });
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'filters-page.png', fullPage: true });
    
    // Get all text content from the sidebar
    const sidebarContent = await page.locator('.w-\\[300px\\]').first().textContent();
    console.log('Sidebar content:', sidebarContent);
    
    // Try to find all input elements
    const inputs = await page.locator('input').all();
    console.log(`\nFound ${inputs.length} input elements`);
    
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const value = await inputs[i].getAttribute('value');
      const checked = await inputs[i].isChecked().catch(() => 'N/A');
      console.log(`Input ${i}: type=${type}, value=${value}, checked=${checked}`);
    }
    
    // Get initial project count
    const initialCount = await page.locator('.bg-\\[\\#111214\\]').count();
    console.log(`\nInitial projects: ${initialCount}`);
    
    // Try clicking the first checkbox we find
    if (inputs.length > 0) {
      const firstCheckbox = inputs.find(async (input) => {
        const type = await input.getAttribute('type');
        return type === 'checkbox';
      });
      
      if (firstCheckbox) {
        await firstCheckbox.click();
        await page.waitForTimeout(1000);
        
        const newCount = await page.locator('.bg-\\[\\#111214\\]').count();
        console.log(`Projects after clicking first checkbox: ${newCount}`);
      }
    }
    
    expect(initialCount).toBeGreaterThan(0);
  });
});