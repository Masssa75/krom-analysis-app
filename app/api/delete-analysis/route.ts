import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;
    
  try {
    const { krom_id } = await request.json();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    if (!krom_id) {
      return NextResponse.json({ error: 'krom_id is required' }, { status: 400 });
    }

    // Clear ONLY the NEW analysis columns (keep original tier-based analysis)
    const { error: updateError } = await supabase
      .from('crypto_calls')
      .update({
        // NEW analysis columns to clear
        analysis_score: null,
        analysis_model: null,
        analysis_legitimacy_factor: null,
        analysis_reasoning: null,
        analysis_batch_id: null,
        analysis_batch_timestamp: null,
        analysis_duration_ms: null,
        analysis_prompt_used: null,
        analysis_confidence: null,
        analysis_token_type: null,
        analysis_reanalyzed_at: null,
        
        // NEW X analysis columns to clear
        x_analysis_score: null,
        x_analysis_model: null,
        x_best_tweet: null,
        x_legitimacy_factor: null,
        x_analysis_reasoning: null,
        x_analysis_batch_id: null,
        x_analysis_batch_timestamp: null,
        x_analysis_duration_ms: null,
        x_analysis_prompt_used: null,
        x_analysis_token_type: null,
        x_reanalyzed_at: null,
        
        // IMPORTANT: We do NOT clear these original columns:
        // - analysis_tier (ALPHA/SOLID/BASIC/TRASH)
        // - analysis_description
        // - analyzed_at (original analysis timestamp)
        // - x_analysis_tier
        // - x_analysis_summary
        // - x_analyzed_at (original X analysis timestamp)
      })
      .eq('krom_id', krom_id);
    
    if (updateError) {
      console.error('Error clearing analysis:', updateError);
      return NextResponse.json({ error: 'Failed to clear analysis data' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Analysis data cleared successfully',
      krom_id: krom_id
    });
    
  } catch (err) {
    console.error('Delete analysis error:', err);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}