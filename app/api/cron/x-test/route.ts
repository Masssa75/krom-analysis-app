import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Simple auth check
  const authToken = request.nextUrl.searchParams.get('auth');
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test: Just fetch one call that needs X analysis
    const { data: testCall, error } = await supabase
      .from('crypto_calls')
      .select('krom_id, ticker, x_raw_tweets')
      .not('x_raw_tweets', 'is', null)
      .is('x_analysis_score', null)
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message 
      }, { status: 500 });
    }

    if (!testCall) {
      return NextResponse.json({ 
        message: 'No calls need X analysis' 
      });
    }

    // Simple test update
    const { error: updateError } = await supabase
      .from('crypto_calls')
      .update({
        x_analysis_score: 5,
        x_analysis_token_type: 'meme',
        x_analysis_reasoning: 'Test X analysis from cron'
      })
      .eq('krom_id', testCall.krom_id);

    if (updateError) {
      return NextResponse.json({ 
        error: 'Update failed',
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analyzed: testCall.krom_id,
      ticker: testCall.ticker,
      tweetsCount: testCall.x_raw_tweets?.length || 0
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}