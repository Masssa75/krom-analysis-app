import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Fetch top 9 utility tokens by liquidity
    const { data, error } = await supabase
      .from('crypto_calls')
      .select('ticker, network, contract_address, liquidity_usd, current_market_cap, analysis_score, x_analysis_score, roi_percent, analysis_reasoning, analysis_token_type, x_analysis_token_type')
      .or('analysis_token_type.eq.utility,x_analysis_token_type.eq.utility')
      .not('liquidity_usd', 'is', null)
      .order('liquidity_usd', { ascending: false })
      .limit(9)

    if (error) {
      console.error('Error fetching tokens:', error)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    // Set CORS headers to allow the HTML file to access this
    return NextResponse.json(data || [], {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}