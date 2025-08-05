import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  
  return NextResponse.json({
    hasCronSecret: !!cronSecret,
    cronSecretLength: cronSecret?.length || 0,
    cronSecretFirst4: cronSecret?.substring(0, 4) || 'N/A',
    cronSecretLast4: cronSecret?.substring(cronSecret.length - 4) || 'N/A',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('CRON') || key.includes('SECRET')),
    nodeEnv: process.env.NODE_ENV
  });
}