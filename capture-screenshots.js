const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const websites = [
    { url: 'https://www.fedora.club', name: 'fedora' },
    { url: 'https://www.ainu.pro', name: 'ainu' },
    { url: 'https://www.uiui.wtf', name: 'uiui' },
    { url: 'https://bio.xyz', name: 'bio' }
  ];

  for (const site of websites) {
    console.log(`Capturing screenshot for ${site.url}...`);
    const page = await context.newPage();
    
    try {
      await page.goto(site.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait a bit for any animations to complete
      await page.waitForTimeout(2000);
      
      // Capture full page screenshot
      await page.screenshot({
        path: `public/temp-screenshots/${site.name}.png`,
        fullPage: false
      });
      
      console.log(`✓ Saved ${site.name}.png`);
    } catch (error) {
      console.log(`✗ Failed to capture ${site.name}: ${error.message}`);
    }
    
    await page.close();
  }

  await browser.close();
  console.log('Done capturing screenshots!');
}

captureScreenshots().catch(console.error);