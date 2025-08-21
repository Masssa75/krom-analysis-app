import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { krom_id, id, is_invalidated, reason } = body;

    if (!krom_id && !id) {
      return NextResponse.json({ error: 'krom_id or id is required' }, { status: 400 });
    }

    // Update the invalidation status
    const query = supabase
      .from('crypto_calls')
      .update({
        is_invalidated: is_invalidated,
        invalidated_at: is_invalidated ? new Date().toISOString() : null,
        invalidation_reason: is_invalidated ? (reason || 'Incorrect data') : null
      });
    
    // Use krom_id if available, otherwise use id
    if (krom_id) {
      query.eq('krom_id', krom_id);
    } else {
      query.eq('id', id);
    }
    
    const { data, error } = await query.select().single();

    if (error) {
      console.error('Failed to update invalidation status:', error);
      return NextResponse.json({ error: 'Failed to update invalidation status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        krom_id: data.krom_id,
        is_invalidated: data.is_invalidated,
        invalidated_at: data.invalidated_at,
        invalidation_reason: data.invalidation_reason
      }
    });

  } catch (error) {
    console.error('Error updating invalidation status:', error);
    return NextResponse.json(
      { error: 'Failed to update invalidation status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}