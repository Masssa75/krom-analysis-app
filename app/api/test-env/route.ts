import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasOpenRouter: !!process.env.OPEN_ROUTER_API_KEY,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasCronSecret: !!process.env.CRON_SECRET,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    openRouterKeyLength: process.env.OPEN_ROUTER_API_KEY?.length || 0,
    timestamp: new Date().toISOString()
  });
}