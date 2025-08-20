import { test, expect } from '@playwright/test';

test.describe('Token Type Filter Investigation', () => {
  test('Check meme filter behavior with website sorting', async ({ page }) => {
    // Go to the live site
    await page.goto('https://lively-torrone-8199e0.netlify.app');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Open token type filter if collapsed
    const tokenTypeSection = page.locator('h3:has-text("TOKEN TYPE")').first();
    await tokenTypeSection.click();
    await page.waitForTimeout(500);
    
    // Deselect meme tokens
    const memeCheckbox = page.locator('label:has-text("Meme Tokens")').locator('div').first();
    await memeCheckbox.click();
    await page.waitForTimeout(1000); // Wait for filter to apply
    
    // Sort by website score
    await page.locator('button:has-text("Sort by")').click();
    await page.locator('text=Website Score').click();
    await page.waitForTimeout(2000); // Wait for sort to apply
    
    // Get the first 10 tokens and their types
    const tokens = await page.locator('.flex.justify-between.items-center.py-3').all();
    
    console.log('\n=== Checking first 10 tokens after filtering ===\n');
    
    for (let i = 0; i < Math.min(10, tokens.length); i++) {
      const token = tokens[i];
      
      // Get ticker name
      const ticker = await token.locator('.font-semibold.text-base').first().textContent();
      
      // Check for token type badge
      const typeBadge = token.locator('span:has-text("UTILITY"), span:has-text("MEME")');
      const badgeCount = await typeBadge.count();
      
      let tokenType = 'UNKNOWN';
      if (badgeCount > 0) {
        tokenType = await typeBadge.first().textContent() || 'UNKNOWN';
      }
      
      // Get website score if visible
      const webScoreElement = token.locator('div:has(span:has-text("WEB")) >> div.text-lg');
      let webScore = 'N/A';
      if (await webScoreElement.count() > 0) {
        webScore = await webScoreElement.textContent() || 'N/A';
      }
      
      console.log(`${i + 1}. ${ticker}: Type=${tokenType}, WebScore=${webScore}`);
      
      // Check if it's a meme token (should not be showing)
      if (tokenType === 'MEME') {
        console.log(`  ⚠️ ISSUE: Meme token showing when memes are deselected!`);
      }
    }
    
    // Also check the API call to see what's being sent
    console.log('\n=== Checking API parameters ===\n');
    
    // Intercept the API call
    page.on('response', async response => {
      if (response.url().includes('/api/recent-calls')) {
        const url = new URL(response.url());
        console.log('API Call Parameters:');
        console.log('- tokenType:', url.searchParams.get('tokenType'));
        console.log('- sortBy:', url.searchParams.get('sortBy'));
        console.log('- networks:', url.searchParams.get('networks'));
        
        // Check the response
        const data = await response.json();
        console.log(`- Total tokens returned: ${data.totalCount}`);
      }
    });
    
    // Trigger a new API call by changing page
    await page.locator('button:has-text("2")').first().click();
    await page.waitForTimeout(2000);
  });

  test('Test token type filter logic directly', async ({ page }) => {
    // Test the API directly to understand the filtering logic
    const apiUrl = 'https://lively-torrone-8199e0.netlify.app/api/recent-calls';
    
    console.log('\n=== Direct API Testing ===\n');
    
    // Test 1: Get all tokens
    const allResponse = await page.request.get(`${apiUrl}?limit=100`);
    const allData = await allResponse.json();
    console.log(`Total tokens (no filter): ${allData.totalCount}`);
    
    // Test 2: Get utility only
    const utilityResponse = await page.request.get(`${apiUrl}?tokenType=utility&limit=100`);
    const utilityData = await utilityResponse.json();
    console.log(`Utility tokens only: ${utilityData.totalCount}`);
    
    // Test 3: Get meme only
    const memeResponse = await page.request.get(`${apiUrl}?tokenType=meme&limit=100`);
    const memeData = await memeResponse.json();
    console.log(`Meme tokens only: ${memeData.totalCount}`);
    
    // Analyze utility tokens to see if any are actually memes
    console.log('\n=== Analyzing "utility" tokens for memes ===\n');
    const utilityTokens = utilityData.data || [];
    
    let memeCount = 0;
    for (const token of utilityTokens.slice(0, 20)) {
      const types = {
        analysis: token.analysis_token_type,
        x_analysis: token.x_analysis_token_type,
        website: token.website_token_type
      };
      
      // Check if any analysis says it's a meme
      const hasMemeClassification = Object.values(types).includes('meme');
      
      if (hasMemeClassification) {
        memeCount++;
        console.log(`${token.ticker}:`);
        console.log(`  - Call Analysis: ${types.analysis || 'null'}`);
        console.log(`  - X Analysis: ${types.x_analysis || 'null'}`);
        console.log(`  - Website: ${types.website || 'null'}`);
        console.log(`  - Website Score: ${token.website_score}`);
      }
    }
    
    console.log(`\nFound ${memeCount} tokens with meme classification in first 20 "utility" results`);
  });
});