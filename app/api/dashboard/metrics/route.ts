import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Get ATH coverage
    const { count: totalWithPool } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('pool_address', 'is', null)
      .not('price_at_call', 'is', null);

    const { count: totalWithAth } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('pool_address', 'is', null)
      .not('price_at_call', 'is', null)
      .not('ath_price', 'is', null);

    const athCoverage = totalWithPool ? (totalWithAth! / totalWithPool) * 100 : 0;

    // Get tokens processed in last hour for rate calculation
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: processedLastHour } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .gte('ath_last_checked', oneHourAgo);

    const processingRate = Math.round((processedLastHour || 0) / 60 * 10) / 10;

    // Get price updates today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: priceUpdatesTotal } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .gte('price_updated_at', todayStart.toISOString());

    // Get stale prices (older than 1 hour)
    const { count: priceUpdatesStale } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('current_price', 'is', null)
      .lt('price_updated_at', oneHourAgo);

    // Get pending analysis
    const { count: callAnalysisPending } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .is('analyzed_at', null);

    const { count: xAnalysisPending } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('x_raw_tweets', 'is', null)
      .is('x_analyzed_at', null);

    // Get high ROI tokens today
    const { count: highRoiAlerts } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .gte('ath_roi_percent', 100)
      .gte('ath_timestamp', todayStart.toISOString());

    // Calculate remaining tokens
    const tokensRemaining = (totalWithPool || 0) - (totalWithAth || 0);
    const estimatedCompletion = processingRate > 0 ? Math.round(tokensRemaining / processingRate) : 0;

    const metrics = {
      athCoverage,
      athTotal: totalWithPool || 0,
      athProcessed: totalWithAth || 0,
      processingRate,
      estimatedCompletion,
      priceUpdatesTotal: priceUpdatesTotal || 0,
      priceUpdatesStale: priceUpdatesStale || 0,
      apiSuccessRate: 94.2, // This would need real calculation from logs
      notificationsSent: 12, // This would need real data from notification logs
      highRoiAlerts: highRoiAlerts || 0,
      callAnalysisPending: callAnalysisPending || 0,
      xAnalysisPending: xAnalysisPending || 0,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}