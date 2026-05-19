import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 });
    }

    const { data: categories, error } = await supabase
      .from('menu_categories')
      .select(`*, menu_items(*)`)
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('sort_order');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { restaurant_id, category_id, name, description, price, is_vegetarian, is_popular } = body;

    if (!restaurant_id || !name || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (category_id) {
      // Adding a menu item
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          category_id,
          restaurant_id,
          name,
          description: description || '',
          price,
          is_vegetarian: is_vegetarian || false,
          is_popular: is_popular || false,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data, { status: 201 });
    } else {
      // Adding a category
      const { data, error } = await supabase
        .from('menu_categories')
        .insert({
          restaurant_id,
          name,
          description: description || '',
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
