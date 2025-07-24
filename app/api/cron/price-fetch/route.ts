import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Check for auth token
    const { searchParams } = new URL(request.url);
    const authToken = searchParams.get('auth');
    
    if (authToken !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Configuration
    const BATCH_SIZE = 10; // Process 10 tokens per minute (15s total time fits in 60s cron timeout)
    
    console.log(`[CRON] Starting price fetch for up to ${BATCH_SIZE} tokens`);
    
    // Call the existing batch endpoint
    const baseUrl = request.url.split('/api/')[0];
    const batchResponse = await fetch(`${baseUrl}/api/batch-price-fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        count: BATCH_SIZE
      })
    });
    
    const result = await batchResponse.json();
    
    if (!batchResponse.ok) {
      console.error('[CRON] Batch price fetch failed:', result);
      return NextResponse.json(
        { 
          error: 'Batch price fetch failed',
          details: result.error || 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    console.log(`[CRON] Price fetch completed: ${result.successful} successful, ${result.failed} failed`);
    
    // Add cron metadata to the response
    return NextResponse.json({
      ...result,
      cron: true,
      timestamp: new Date().toISOString(),
      nextRun: 'In 5 minutes'
    });
    
  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process price fetch cron',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}