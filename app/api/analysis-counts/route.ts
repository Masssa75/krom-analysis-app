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

    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error getting total count:', totalError);
      throw totalError;
    }

    // Get count of calls with call analysis
    const { count: callAnalysisCount, error: callError } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('analysis_score', 'is', null);

    if (callError) {
      console.error('Error getting call analysis count:', callError);
      throw callError;
    }

    // Get count of calls with X analysis
    const { count: xAnalysisCount, error: xError } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('x_analysis_score', 'is', null);

    if (xError) {
      console.error('Error getting X analysis count:', xError);
      throw xError;
    }

    // Get count of calls with contract addresses
    const { count: withContracts, error: contractError } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('raw_data->token->ca', 'is', null);

    if (contractError) {
      console.error('Error getting contract count:', contractError);
      throw contractError;
    }

    // Get count of calls with price data
    const { count: pricesFetched, error: priceError } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('raw_data->token->ca', 'is', null)
      .not('current_price', 'is', null);

    if (priceError) {
      console.error('Error getting price count:', priceError);
      throw priceError;
    }

    return NextResponse.json({
      total: totalCount || 0,
      callAnalysis: callAnalysisCount || 0,
      xAnalysis: xAnalysisCount || 0,
      withContracts: withContracts || 0,
      pricesFetched: pricesFetched || 0
    });
  } catch (error: any) {
    console.error('Error fetching analysis counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis counts', details: error.message },
      { status: 500 }
    );
  }
}