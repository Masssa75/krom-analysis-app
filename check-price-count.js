const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPriceCounts() {
  // Total calls with prices
  const { count: withPrices } = await supabase
    .from('crypto_calls')
    .select('*', { count: 'exact', head: true })
    .not('price_fetched_at', 'is', null);

  // Recent price fetches (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentPrices } = await supabase
    .from('crypto_calls')
    .select('*', { count: 'exact', head: true })
    .gte('price_fetched_at', oneHourAgo);

  // Check last 5 price fetches
  const { data: lastFetches } = await supabase
    .from('crypto_calls')
    .select('ticker, price_fetched_at, current_price, roi_percent')
    .not('price_fetched_at', 'is', null)
    .order('price_fetched_at', { ascending: false })
    .limit(5);

  console.log(`Total calls with prices: ${withPrices}`);
  console.log(`Prices fetched in last hour: ${recentPrices}`);
  console.log('\nLast 5 price fetches:');
  lastFetches?.forEach(call => {
    console.log(`- ${call.ticker}: fetched at ${call.price_fetched_at}, price: $${call.current_price}, ROI: ${call.roi_percent?.toFixed(2)}%`);
  });
}

checkPriceCounts().catch(console.error);