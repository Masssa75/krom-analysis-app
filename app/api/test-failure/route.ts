import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find a token to test with (preferably one that's already analyzed)
    const { data: testCall, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('id, krom_id, ticker')
      .not('analysis_score', 'is', null)
      .limit(1)
      .single();

    if (fetchError || !testCall) {
      return NextResponse.json({ error: 'No test token found' }, { status: 404 });
    }

    console.log(`Testing failure handling with token: ${testCall.ticker}`);

    // Simulate a failed analysis by directly updating the database
    const { error: updateError } = await supabase
      .from('crypto_calls')
      .update({
        analysis_score: 1,
        analysis_tier: 'FAILED',
        analysis_reasoning: 'ERROR: Test failure - API key invalid',
        analysis_duration_ms: 0,
        analyzed_at: new Date().toISOString()
      })
      .eq('krom_id', testCall.krom_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Also test X analysis failure
    const { error: xUpdateError } = await supabase
      .from('crypto_calls')
      .update({
        x_analysis_score: 1,
        x_analysis_tier: 'FAILED',
        x_analysis_reasoning: 'ERROR: Test failure - OpenRouter API error',
        x_analysis_duration_ms: 0,
        x_analyzed_at: new Date().toISOString()
      })
      .eq('krom_id', testCall.krom_id);

    if (xUpdateError) {
      return NextResponse.json({ error: xUpdateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully simulated failures for ${testCall.ticker}`,
      token: testCall.ticker,
      krom_id: testCall.krom_id,
      instruction: 'Check the UI at https://lively-torrone-8199e0.netlify.app to see "C: FAILED" and "X: FAILED" badges'
    });
    
  } catch (error) {
    console.error('Test failure error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate failure' },
      { status: 500 }
    );
  }
}