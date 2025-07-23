import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple auth check
  const authToken = request.nextUrl.searchParams.get('auth');
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call the existing x-batch endpoint internally
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/x-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 5, // Process 5 calls at a time
        model: 'moonshotai/kimi-k2:free'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ 
        error: 'X batch analysis failed',
        details: error 
      }, { status: 500 });
    }

    const result = await response.json();

    // Return cron-friendly response
    return NextResponse.json({
      success: true,
      processed: result.analyzed || 0,
      batch_id: result.batch_id,
      timestamp: new Date().toISOString(),
      model: 'moonshotai/kimi-k2:free',
      duration: `${(result.total_duration_ms / 1000).toFixed(1)}s`,
      results: result.results?.length || 0
    });
    
  } catch (error) {
    console.error('Cron X analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to run X analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// For cron services that use HEAD requests to check endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}