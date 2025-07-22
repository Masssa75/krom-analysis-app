import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch calls that haven't been X analyzed yet
    // Prioritize calls with call analysis already done
    const { data: calls, error } = await supabase
      .from('crypto_calls')
      .select('krom_id, ticker, buy_timestamp, raw_data, analysis_tier, analysis_score')
      .is('x_analyzed_at', null)
      .not('raw_data->token->ca', 'is', null)
      .not('analysis_tier', 'is', null)  // Prefer calls with analysis already done
      .order('buy_timestamp', { ascending: true })  // Oldest first
      .limit(limit)

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch unanalyzed calls' 
      }, { status: 500 })
    }

    const results = calls.map(call => ({
      krom_id: call.krom_id,
      ticker: call.ticker,
      buy_timestamp: call.buy_timestamp,
      contract: call.raw_data?.token?.ca,
      analysis_score: call.analysis_score || call.raw_data?.analysis_score,
      analysis_tier: call.analysis_tier
    }))

    return NextResponse.json({
      success: true,
      count: results.length,
      results: results
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}