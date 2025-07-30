import { test, expect } from '@playwright/test';

test('debug price refresh data', async ({ page }) => {
  // Intercept the analyzed calls response
  await page.route('**/api/analyzed*', async route => {
    const response = await route.fetch();
    const data = await response.json();
    
    console.log('\n=== ANALYZED CALLS RESPONSE ===');
    console.log('Total results:', data.results?.length);
    
    if (data.results?.length > 0) {
      const firstCall = data.results[0];
      console.log('\nFirst call structure:');
      console.log('- krom_id:', firstCall.krom_id);
      console.log('- token:', firstCall.token);
      console.log('- contract:', firstCall.contract);
      console.log('- network:', firstCall.network);
      console.log('- price_at_call:', firstCall.price_at_call);
      console.log('- current_price:', firstCall.current_price);
      console.log('- price_updated_at:', firstCall.price_updated_at);
      console.log('- analyzed_at:', firstCall.analyzed_at);
      console.log('- created_at:', firstCall.created_at);
      console.log('- buy_timestamp:', firstCall.buy_timestamp);
      console.log('- raw_data:', firstCall.raw_data ? 'present' : 'missing');
    }
    
    await route.fulfill({ response });
  });

  // Intercept refresh-prices request
  await page.route('**/api/refresh-prices', async route => {
    const request = route.request();
    const postData = request.postDataJSON();
    
    console.log('\n=== REFRESH PRICES REQUEST ===');
    console.log('Total tokens sent:', postData.tokens?.length);
    
    if (postData.tokens?.length > 0) {
      console.log('\nFirst token in request:');
      console.log(JSON.stringify(postData.tokens[0], null, 2));
      
      // Check how many are actually stale
      const now = new Date();
      let staleCount = 0;
      
      postData.tokens.forEach((token: any) => {
        if (token.price_updated_at) {
          const updated = new Date(token.price_updated_at);
          const ageMinutes = (now.getTime() - updated.getTime()) / (1000 * 60);
          
          // Check staleness based on token age
          const tokenAge = token.created_at 
            ? (now.getTime() - new Date(token.created_at).getTime()) / (1000 * 60 * 60)
            : Infinity;
            
          const cacheMinutes = tokenAge < 24 ? 5 : 60;
          
          if (ageMinutes > cacheMinutes) {
            staleCount++;
            console.log(`\nStale token: ${token.contract_address?.substring(0, 10)}...`);
            console.log(`- Age: ${ageMinutes.toFixed(1)} minutes`);
            console.log(`- Cache duration: ${cacheMinutes} minutes`);
          }
        }
      });
      
      console.log(`\nStale tokens: ${staleCount}/${postData.tokens.length}`);
    }
    
    // Let it continue
    await route.continue();
  });

  await page.goto('https://lively-torrone-8199e0.netlify.app');
  await page.waitForSelector('table');
  await page.waitForTimeout(3000);
});