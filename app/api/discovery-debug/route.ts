import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sortBy = searchParams.get('sortBy') || 'first_seen_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const offset = (page - 1) * limit;

  try {
    // Build base query - ALL tokens with websites
    let query = supabase
      .from('token_discovery')
      .select('*', { count: 'exact' })
      .not('website_url', 'is', null);

    // Apply filters
    switch (filter) {
      case 'analyzed':
        query = query.not('website_analyzed_at', 'is', null);
        break;
      case 'unanalyzed':
        query = query.is('website_analyzed_at', null);
        break;
      case 'lowscore':
        query = query.not('website_stage1_score', 'is', null).lte('website_stage1_score', 6);
        break;
      case 'scrape_failed':
        // Filter for tokens with very low text content (indicating scrape issues)
        query = query.not('website_stage1_analysis->scrape_metrics->text_length', 'is', null)
          .lt('website_stage1_analysis->scrape_metrics->text_length', 500);
        break;
      case 'promoted':
        // Tokens that qualify for promotion (score >= 7)
        query = query.gte('website_stage1_score', 7);
        break;
    }

    // Apply sorting
    const nullsFirst = sortOrder === 'desc' ? false : true;
    query = query.order(sortBy as any, { ascending: sortOrder === 'asc', nullsFirst });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tokens, error, count } = await query;

    if (error) {
      console.error('Error fetching discovery tokens:', error);
      throw error;
    }

    // Calculate statistics
    const statsQuery = supabase
      .from('token_discovery')
      .select('website_analyzed_at, website_stage1_score, website_stage1_analysis')
      .not('website_url', 'is', null);

    const { data: allTokens } = await statsQuery;

    const stats = {
      total: allTokens?.length || 0,
      analyzed: allTokens?.filter(t => t.website_analyzed_at !== null).length || 0,
      promotable: allTokens?.filter(t => t.website_stage1_score && t.website_stage1_score >= 7).length || 0,
      scrapeFailed: allTokens?.filter(t => {
        const textLen = (t.website_stage1_analysis as any)?.scrape_metrics?.text_length;
        return t.website_analyzed_at && textLen && textLen < 500;
      }).length || 0
    };

    // Format tokens for frontend
    const formattedTokens = tokens?.map(token => ({
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      network: token.network,
      contract_address: token.contract_address,
      website_url: token.website_url,
      website_analyzed_at: token.website_analyzed_at,
      website_stage1_score: token.website_stage1_score,
      website_stage1_tier: token.website_stage1_tier,
      website_stage1_analysis: token.website_stage1_analysis,
      current_liquidity_usd: token.current_liquidity_usd,
      current_volume_24h: token.current_volume_24h,
      current_market_cap: token.current_market_cap,
      first_seen_at: token.first_seen_at,
      twitter_url: token.twitter_url,
      telegram_url: token.telegram_url,
      discord_url: token.discord_url,
      website_screenshot_url: token.website_screenshot_url,
      website_screenshot_captured_at: token.website_screenshot_captured_at
    })) || [];

    return NextResponse.json({ 
      tokens: formattedTokens,
      hasMore: (count || 0) > offset + limit,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in discovery-debug API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}