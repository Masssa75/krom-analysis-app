const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDetails() {
  // Check what calls are being processed
  const { data: callsToProcess } = await supabase
    .from('crypto_calls')
    .select('krom_id, ticker, raw_data, price_at_call, current_price, price_fetched_at')
    .not('raw_data->token->ca', 'is', null)
    .is('price_at_call', null)
    .or('analysis_score.not.is.null,x_analysis_score.not.is.null')
    .order('analysis_score', { ascending: false, nullsFirst: false })
    .limit(5);

  console.log('Next calls to be processed:');
  callsToProcess?.forEach(call => {
    const ca = call.raw_data?.token?.ca;
    console.log(`- ${call.ticker}: CA=${ca ? ca.substring(0, 10) + '...' : 'none'}`);
  });

  // Check recent successful price fetches
  const { data: successfulFetches } = await supabase
    .from('crypto_calls')
    .select('ticker, raw_data, current_price, price_fetched_at')
    .not('current_price', 'is', null)
    .not('price_fetched_at', 'is', null)
    .order('price_fetched_at', { ascending: false })
    .limit(5);

  console.log('\nRecent successful price fetches:');
  successfulFetches?.forEach(call => {
    const ca = call.raw_data?.token?.ca;
    console.log(`- ${call.ticker}: $${call.current_price} (CA=${ca ? ca.substring(0, 10) + '...' : 'none'})`);
  });

  // Count by price status
  const { count: totalWithCA } = await supabase
    .from('crypto_calls')
    .select('*', { count: 'exact', head: true })
    .not('raw_data->token->ca', 'is', null);

  const { count: withPrices } = await supabase
    .from('crypto_calls')
    .select('*', { count: 'exact', head: true })
    .not('current_price', 'is', null);

  const { count: attemptedButNull } = await supabase
    .from('crypto_calls')
    .select('*', { count: 'exact', head: true })
    .not('price_fetched_at', 'is', null)
    .is('current_price', null);

  console.log(`\nPrice fetch statistics:`);
  console.log(`Total calls with contract addresses: ${totalWithCA}`);
  console.log(`Successfully fetched prices: ${withPrices}`);
  console.log(`Attempted but got null price: ${attemptedButNull}`);
}

checkDetails().catch(console.error);