import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url, tokenId, table = 'crypto_calls', forceRefresh = false } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Call the Supabase edge function
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/website-screenshot-capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          tokenId,
          table,
          forceRefresh
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to capture screenshot');
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Screenshot capture error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to capture screenshot' },
      { status: 500 }
    );
  }
}