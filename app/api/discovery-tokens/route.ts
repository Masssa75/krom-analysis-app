import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sortBy') || 'buy_timestamp'; // 'buy_timestamp' or 'website_score'
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const minWebsiteScore = searchParams.get('minWebsiteScore') ? parseInt(searchParams.get('minWebsiteScore')!) : 0;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '8'); // 2 rows x 4 columns
  const offset = (page - 1) * limit;

  try {
    // Build query for utility tokens with websites
    let query = supabase
      .from('crypto_calls')
      .select('*', { count: 'exact' })
      .eq('analysis_token_type', 'utility')
      .not('website_url', 'is', null)
      .not('website_url', 'eq', '')
      .not('website_url', 'eq', 'N/A')
      .not('website_url', 'eq', 'None')
      .gte('website_score', minWebsiteScore);

    // Apply sorting
    if (sortBy === 'website_score') {
      query = query.order('website_score', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('buy_timestamp', { ascending: sortOrder === 'asc' });
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching discovery tokens:', error);
      throw error;
    }

    // Transform data for frontend
    const tokens = data?.map(token => ({
      id: token.id,
      name: token.ticker?.replace('$', '') || 'Unknown',
      ticker: token.ticker || '$UNKNOWN',
      url: token.website_url,
      websiteScore: token.website_score || 0,
      websiteAnalysis: token.website_analysis,
      websiteAnalysisFull: token.website_analysis_full || token.website_analysis,
      description: token.analysis_description || token.website_analysis_full?.quick_take || token.website_quick_take || null,
      marketCap: token.current_market_cap || token.market_cap_at_call,
      liquidity: token.liquidity_usd,
      callDate: token.buy_timestamp,
      network: token.network,
      contractAddress: token.contract_address,
      analysisScore: token.analysis_score,
      analysisTier: token.analysis_tier || token.website_tier,
      analysisReasoning: token.analysis_reasoning || token.website_analysis_reasoning,
      roi: token.roi_percent,
      currentPrice: token.current_price,
      priceAtCall: token.price_at_call,
      screenshotUrl: token.website_screenshot_url,
      screenshotCapturedAt: token.website_screenshot_captured_at,
    })) || [];

    return NextResponse.json({
      tokens,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discovery tokens' },
      { status: 500 }
    );
  }
}