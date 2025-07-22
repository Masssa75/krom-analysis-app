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
    const includeAnalyzed = searchParams.get('includeAnalyzed') === 'true'

    // Build query
    let query = supabase
      .from('crypto_calls')
      .select('krom_id, ticker, buy_timestamp, raw_data, analysis_tier, analysis_score, x_analysis_tier, x_analyzed_at')
      .not('raw_data->token->ca', 'is', null)  // Must have contract address
      .order('buy_timestamp', { ascending: true })  // Oldest first
      .limit(limit)
    
    // Only filter out previously X-analyzed if not including analyzed
    if (!includeAnalyzed) {
      query = query.is('x_analyzed_at', null)
    }
    
    const { data: calls, error } = await query

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
      analysis_tier: call.analysis_tier,
      x_analysis_tier: call.x_analysis_tier,
      x_analyzed_at: call.x_analyzed_at
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