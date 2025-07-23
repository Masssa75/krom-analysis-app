import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple auth check - you can use a secret in the URL
  const authToken = request.nextUrl.searchParams.get('auth');
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call the existing analyze endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
      
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 20, // Process 20 calls per cron run
        model: 'moonshotai/kimi-k2:free' // Use the efficient model
      })
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      processed: result.count || 0,
      duration: result.duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cron analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to run analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// For cron services that use HEAD requests to check endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}