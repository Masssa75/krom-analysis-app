// API endpoint to fetch top performing calls based on ATH ROI
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'all'
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Calculate date filters based on period
    let dateFilter = null
    const now = new Date()
    
    switch(period) {
      case '24h':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        // 'all' - no date filter
        break
    }
    
    // Build query
    let query = supabase
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
        x_analysis_tier
      `)
      .not('ath_roi_percent', 'is', null)
      .gt('ath_roi_percent', 0)
      .order('ath_roi_percent', { ascending: false })
      .limit(9)
    
    // Apply date filter if needed
    if (dateFilter) {
      query = query.gte('buy_timestamp', dateFilter.toISOString())
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching top calls:', error)
      return NextResponse.json({ error: 'Failed to fetch top calls' }, { status: 500 })
    }
    
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error in top-calls API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}