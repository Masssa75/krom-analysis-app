// API endpoint to fetch recent calls
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Fetch recent calls ordered by timestamp
    const { data, error } = await supabase
      .from('crypto_calls')
      .select(`
        id,
        ticker,
        network,
        contract_address,
        buy_timestamp,
        price_at_call,
        ath_price,
        ath_roi_percent,
        current_price,
        roi_percent,
        analysis_score,
        analysis_tier,
        x_analysis_score,
        x_analysis_tier,
        analysis_token_type,
        market_cap_at_call,
        current_market_cap,
        source,
        raw_data
      `)
      .or('is_invalidated.is.null,is_invalidated.eq.false')
      .order('buy_timestamp', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Error fetching recent calls:', error)
      return NextResponse.json({ error: 'Failed to fetch recent calls' }, { status: 500 })
    }
    
    // Extract group name from raw_data
    const callsWithGroups = (data || []).map(call => {
      let groupName = 'Unknown Group'
      if (call.raw_data && typeof call.raw_data === 'object') {
        groupName = call.raw_data.group_username || call.raw_data.group_name || 'Unknown Group'
      }
      
      return {
        ...call,
        group_name: groupName
      }
    })
    
    return NextResponse.json({ data: callsWithGroups })
  } catch (error) {
    console.error('Error in recent-calls API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}