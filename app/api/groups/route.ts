import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    // Fetch all analyzed calls to extract unique groups
    const { data, error } = await supabase
      .from('crypto_calls')
      .select('raw_data')
      .not('analysis_score', 'is', null)
      .or('is_invalidated.is.null,is_invalidated.eq.false');
    
    if (error) {
      console.error('Database fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }

    // Extract unique groups from raw_data
    const groupsSet = new Set<string>();
    
    data?.forEach(call => {
      const groupName = call.raw_data?.groupName || call.raw_data?.group?.name;
      if (groupName && groupName !== 'Unknown') {
        groupsSet.add(groupName);
      }
    });

    // Convert to sorted array
    const groups = Array.from(groupsSet).sort();

    return NextResponse.json({
      success: true,
      groups
    });

  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}