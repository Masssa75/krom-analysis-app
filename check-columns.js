const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eucfoommxxvqmmwdbkdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2Zvb21teHh2cW1td2Ria2R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU2Mjg4MSwiZXhwIjoyMDYzMTM4ODgxfQ.VcC7Bp3zMFYor3eVDonoG7BuS7AavemQnSOhrWcY5Y4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  // Get one row to see the structure
  const { data, error } = await supabase
    .from('crypto_calls')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columns in crypto_calls table:');
    console.log(Object.keys(data[0]));
    
    console.log('\nSample row:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkColumns().catch(console.error);