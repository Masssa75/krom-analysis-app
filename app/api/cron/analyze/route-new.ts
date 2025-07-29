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

    // Process 5 calls at a time (same as original)
    const limit = 5;
    const model = 'moonshotai/kimi-k2';

    // Check if there are calls to analyze
    const { data: calls, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('krom_id')
      .is('analysis_score', null)
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
        message: 'No calls need analysis',
        processed: 0
      });
    }

    // Get total unanalyzed count for reporting
    const { count: unanalyzedCount } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .is('analysis_score', null);

    // Call the proven working analysis endpoint instead of duplicating logic
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: limit,
        model: model
      })
    });

    let processed = 0;
    let errors = 0;
    
    if (response.ok) {
      const result = await response.json();
      processed = result.count || 0;
      errors = result.errors ? result.errors.length : 0;
    } else {
      errors = limit; // All calls failed
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      processed: processed,
      total: calls.length,
      errors: errors,
      remaining: unanalyzedCount ? unanalyzedCount - processed : 'unknown',
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
      model: model,
      batchId: crypto.randomUUID(),
      estimatedCompletion: unanalyzedCount && processed > 0 
        ? `${Math.ceil((unanalyzedCount - processed) / processed)} minutes`
        : 'calculating...'
    });
    
  } catch (error) {
    console.error('Cron analyze error:', error);
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