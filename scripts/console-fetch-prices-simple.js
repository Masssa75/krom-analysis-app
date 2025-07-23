// Copy and paste this ENTIRE code block into the browser console

(async function() {
  console.log('Starting to fetch prices...');
  
  // Find all "Get Price" buttons
  const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent && btn.textContent.includes('Get Price')
  );
  
  console.log(`Found ${buttons.length} items without prices`);
  
  if (buttons.length === 0) {
    console.log('No items need price fetching on this page!');
    return;
  }
  
  // Click each button with a delay
  for (let i = 0; i < buttons.length; i++) {
    console.log(`Fetching price ${i + 1} of ${buttons.length}...`);
    
    // Click the button
    buttons[i].click();
    
    // Wait 2.5 seconds between clicks
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
  
  console.log('✅ Done! All prices fetched.');
})();