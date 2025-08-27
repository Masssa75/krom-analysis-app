// Test script to verify Stage 2 display
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Loading KROM app...');
  await page.goto('http://localhost:3001');
  
  // Wait for the page to load
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
  
  console.log('Searching for UIUI token...');
  // Search for UIUI which has Stage 2 analysis
  await page.type('input[placeholder*="Search"]', 'UIUI');
  
  // Wait for results to update
  await page.waitForTimeout(2000);
  
  // Check if Stage 2 elements are visible
  const stage2Score = await page.evaluate(() => {
    const scoreElements = Array.from(document.querySelectorAll('span'));
    const s2Label = scoreElements.find(el => el.textContent === 'S2');
    if (s2Label) {
      const scoreDiv = s2Label.nextElementSibling;
      return scoreDiv ? scoreDiv.textContent : null;
    }
    return null;
  });
  
  const stage2Badge = await page.evaluate(() => {
    const badges = Array.from(document.querySelectorAll('span'));
    const w2Badge = badges.find(el => el.textContent && el.textContent.includes('W2:'));
    return w2Badge ? w2Badge.textContent : null;
  });
  
  console.log('Stage 2 Score found:', stage2Score);
  console.log('Stage 2 Badge found:', stage2Badge);
  
  if (stage2Score === '2.0' && stage2Badge === 'W2: HONEYPOT') {
    console.log('✅ SUCCESS: Stage 2 display is working correctly!');
    console.log('- Score displayed: 2.0');
    console.log('- Badge displayed: W2: HONEYPOT');
  } else {
    console.log('⚠️  Stage 2 elements not displaying as expected');
  }
  
  // Try hovering to see tooltip
  if (stage2Badge) {
    console.log('\nTrying to hover over Stage 2 badge to show tooltip...');
    const badgeElement = await page.$('span::-p-text(W2:)');
    if (badgeElement) {
      await badgeElement.hover();
      await page.waitForTimeout(500);
      console.log('Tooltip should be visible now (check browser window)');
    }
  }
  
  console.log('\nNow searching for AINU token...');
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search"]');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  
  await page.type('input[placeholder*="Search"]', 'AINU');
  await page.waitForTimeout(2000);
  
  const ainuBadge = await page.evaluate(() => {
    const badges = Array.from(document.querySelectorAll('span'));
    const w2Badge = badges.find(el => el.textContent && el.textContent.includes('W2:'));
    return w2Badge ? w2Badge.textContent : null;
  });
  
  console.log('AINU Stage 2 Badge:', ainuBadge);
  
  console.log('\nTest complete! Check the browser window to see the visual display.');
  console.log('Press Ctrl+C to close the browser.');
  
  // Keep browser open for manual inspection
  await page.waitForTimeout(60000);
  await browser.close();
})();