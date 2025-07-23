import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Simple auth check
  const authToken = request.nextUrl.searchParams.get('auth');
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Process 5 calls at a time
    const limit = 5;
    
    // Fetch calls with tweets that need X analysis
    const { data: calls, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('krom_id, ticker, x_raw_tweets')
      .not('x_raw_tweets', 'is', null)
      .is('x_analysis_score', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      return NextResponse.json({ 
        error: 'Database error',
        details: fetchError.message 
      }, { status: 500 });
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No calls need X analysis',
        processed: 0
      });
    }

    // Process each call with real AI
    let processed = 0;
    const batchId = crypto.randomUUID();
    
    // Call the x-batch endpoint with our calls
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/x-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: limit,
        model: 'moonshotai/kimi-k2:free'
      })
    });

    if (response.ok) {
      const result = await response.json();
      processed = result.analyzed || 0;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      processed: processed,
      total: calls.length,
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cron X analyze error:', error);
    return NextResponse.json(
      { error: 'Failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// For cron services that use HEAD requests to check endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}