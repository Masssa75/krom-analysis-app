const { createClient } = require('@supabase/supabase-js');

// Use the environment variables from the parent .env
const supabaseUrl = 'https://eucfoommxxvqmmwdbkdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2Zvb21teHh2cW1td2Ria2R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU2Mjg4MSwiZXhwIjoyMDYzMTM4ODgxfQ.VcC7Bp3zMFYor3eVDonoG7BuS7AavemQnSOhrWcY5Y4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Checking Supabase database...\n');
  
  // First, check what tables exist
  const { data: tables, error: tablesError } = await supabase
    .from('crypto_calls')
    .select('*')
    .limit(1);
    
  if (tablesError) {
    console.error('Error accessing crypto_calls table:', tablesError);
    
    // Try to list all tables
    const { data: allTables, error: allTablesError } = await supabase.rpc('get_tables');
    if (!allTablesError && allTables) {
      console.log('Available tables:', allTables);
    }
  }
  
  // Get sample of oldest calls without analysis_score
  console.log('\n--- Oldest unanalyzed calls ---');
  const { data: unanalyzedCalls, error: unanalyzedError } = await supabase
    .from('crypto_calls')
    .select('krom_id, ticker, buy_timestamp, raw_data')
    .is('analysis_score', null)
    .order('buy_timestamp', { ascending: true })
    .limit(5);
    
  if (unanalyzedError) {
    console.error('Error fetching unanalyzed calls:', unanalyzedError);
  } else if (unanalyzedCalls && unanalyzedCalls.length > 0) {
    console.log(`Found ${unanalyzedCalls.length} unanalyzed calls:`);
    unanalyzedCalls.forEach((call, i) => {
      console.log(`\n${i + 1}. Ticker: ${call.ticker || 'NULL'}`);
      console.log(`   ID: ${call.krom_id}`);
      console.log(`   Timestamp: ${call.buy_timestamp}`);
      if (call.raw_data) {
        console.log(`   Raw data keys: ${Object.keys(call.raw_data).join(', ')}`);
      }
    });
  } else {
    console.log('No unanalyzed calls found');
  }
  
  // Get recently analyzed calls
  console.log('\n\n--- Recently analyzed calls ---');
  const { data: analyzedCalls, error: analyzedError } = await supabase
    .from('crypto_calls')
    .select('krom_id, ticker, analysis_score, contract_address')
    .not('analysis_score', 'is', null)
    .order('buy_timestamp', { descending: true })
    .limit(5);
    
  if (analyzedError) {
    console.error('Error fetching analyzed calls:', analyzedError);
  } else if (analyzedCalls && analyzedCalls.length > 0) {
    console.log(`Found ${analyzedCalls.length} analyzed calls:`);
    analyzedCalls.forEach((call, i) => {
      console.log(`\n${i + 1}. Ticker: ${call.ticker}`);
      console.log(`   Score: ${call.analysis_score}`);
      console.log(`   Contract: ${call.contract_address || 'NULL'}`);
    });
  } else {
    console.log('No analyzed calls found');
  }
  
  // Check total counts
  console.log('\n\n--- Database Statistics ---');
  const { count: totalCount } = await supabase
    .from('crypto_calls')
    .select('*', { count: 'exact', head: true });
    
  const { count: analyzedCount } = await supabase
    .from('crypto_calls')
    .select('*', { count: 'exact', head: true })
    .not('analysis_score', 'is', null);
    
  console.log(`Total calls: ${totalCount}`);
  console.log(`Analyzed calls: ${analyzedCount}`);
  console.log(`Unanalyzed calls: ${totalCount - analyzedCount}`);
}

checkDatabase().catch(console.error);