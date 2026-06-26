import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Restaurant slug is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    // Connect to Supabase using public client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Get restaurant details by slug
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (restError) {
      return NextResponse.json({ error: restError.message }, { status: 500 });
    }

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // 2. Get categories and items
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select(`*, menu_items(*)`)
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order');

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    // Format output as MenuCategoryWithItems
    const formattedCategories = categories.map((cat: any) => ({
      id: cat.id,
      restaurant_id: cat.restaurant_id,
      name: cat.name,
      description: cat.description,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
      created_at: cat.created_at,
      menu_items: (cat.menu_items || [])
        .filter((item: any) => item.is_available)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((item: any) => ({
          id: item.id,
          category_id: item.category_id,
          restaurant_id: item.restaurant_id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price) || 0,
          image_url: item.image_url,
          is_available: item.is_available,
          is_vegetarian: item.is_vegetarian,
          is_popular: item.is_popular,
          sort_order: item.sort_order,
          created_at: item.created_at,
          updated_at: item.updated_at,
        })),
    }));

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        logo_url: restaurant.logo_url,
        phone: restaurant.phone,
        address: restaurant.address,
        currency: restaurant.currency,
        settings: restaurant.settings,
      },
      categories: formattedCategories,
    });
  } catch (error: any) {
    console.error('Error fetching public menu:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
