import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authToken = request.nextUrl.searchParams.get('auth');
  const envSecret = process.env.CRON_SECRET;
  
  return NextResponse.json({
    receivedAuth: authToken,
    envSecret: envSecret,
    match: authToken === envSecret,
    receivedLength: authToken?.length || 0,
    envLength: envSecret?.length || 0,
    receivedFirst4: authToken?.substring(0, 4) || 'N/A',
    envFirst4: envSecret?.substring(0, 4) || 'N/A',
    receivedLast4: authToken?.substring(authToken?.length - 4) || 'N/A',
    envLast4: envSecret?.substring(envSecret?.length - 4) || 'N/A'
  });
}