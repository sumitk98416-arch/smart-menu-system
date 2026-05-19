import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { table_id, restaurant_id, customer_name, customer_phone } = body;

    if (!table_id || !restaurant_id) {
      return NextResponse.json({ error: 'table_id and restaurant_id are required' }, { status: 400 });
    }

    // Check for existing active session on this table
    const { data: existing } = await supabase
      .from('sessions')
      .select('*')
      .eq('table_id', table_id)
      .eq('status', 'active')
      .single();

    if (existing) {
      return NextResponse.json(existing);
    }

    // Create new session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        table_id,
        restaurant_id,
        customer_name: customer_name || '',
        customer_phone: customer_phone || '',
        status: 'active',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*, orders(*, order_items(*))')
      .eq('id', sessionId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
