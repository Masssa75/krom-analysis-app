import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get total count of calls with contract addresses
    const { count: totalWithContracts, error: totalError } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('raw_data->token->ca', 'is', null);

    if (totalError) {
      console.error('Error getting total count:', totalError);
      throw totalError;
    }

    // Get count of calls with price data
    const { count: withPriceData, error: priceError } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('raw_data->token->ca', 'is', null)
      .not('price_at_call', 'is', null);

    if (priceError) {
      console.error('Error getting price data count:', priceError);
      throw priceError;
    }

    // Get count of analyzed calls without price data
    const { count: analyzedWithoutPrice, error: analyzedError } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('raw_data->token->ca', 'is', null)
      .is('price_at_call', null)
      .or('analysis_score.not.is.null,x_analysis_score.not.is.null');

    if (analyzedError) {
      console.error('Error getting analyzed without price count:', analyzedError);
      throw analyzedError;
    }

    // Get recent price fetch activity
    const { data: recentFetches, error: recentError } = await supabase
      .from('crypto_calls')
      .select('ticker, price_fetched_at')
      .not('price_fetched_at', 'is', null)
      .order('price_fetched_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('Error getting recent fetches:', recentError);
      throw recentError;
    }

    const needsPriceData = (totalWithContracts || 0) - (withPriceData || 0);

    return NextResponse.json({
      stats: {
        totalWithContracts: totalWithContracts || 0,
        withPriceData: withPriceData || 0,
        needsPriceData,
        analyzedWithoutPrice: analyzedWithoutPrice || 0,
        percentComplete: totalWithContracts ? ((withPriceData || 0) / totalWithContracts * 100).toFixed(1) : 0
      },
      recentFetches: recentFetches || [],
      estimatedTime: {
        // At 20 tokens per minute
        totalMinutes: Math.ceil(needsPriceData / 20),
        totalHours: (needsPriceData / 20 / 60).toFixed(1),
        // With cron running every 5 minutes processing 20 tokens
        cronRuns: Math.ceil(needsPriceData / 20),
        daysToComplete: (needsPriceData / 20 / 12).toFixed(1) // 12 runs per hour * 24 hours
      }
    });
  } catch (error: any) {
    console.error('Error fetching price stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price statistics', details: error.message },
      { status: 500 }
    );
  }
}