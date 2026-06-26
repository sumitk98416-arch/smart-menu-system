import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    // Use service role admin client to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await request.json();
    const { slug, restaurant, categories, menuItems, tables } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // 1. Get or Upsert Restaurant
    let { data: existingRestaurant } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    let restaurantId: string;

    if (existingRestaurant) {
      restaurantId = existingRestaurant.id;
      await supabaseAdmin
        .from('restaurants')
        .update({
          name: restaurant.name || 'The Golden Plate',
          description: restaurant.description || '',
          logo_url: restaurant.logo_url || '',
          phone: restaurant.phone || '',
          address: restaurant.address || '',
          currency: restaurant.currency || '₹',
          settings: restaurant.settings || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', restaurantId);
    } else {
      // Find default owner from auth users, or use placeholder uuid
      const { data: inserted } = await supabaseAdmin
        .from('restaurants')
        .insert({
          owner_id: '00000000-0000-0000-0000-000000000000', // fallback uuid
          name: restaurant.name || 'The Golden Plate',
          slug: slug,
          description: restaurant.description || '',
          logo_url: restaurant.logo_url || '',
          phone: restaurant.phone || '',
          address: restaurant.address || '',
          currency: restaurant.currency || '₹',
          settings: restaurant.settings || {},
        })
        .select()
        .single();
      
      if (!inserted) {
        throw new Error('Failed to create restaurant entry in database');
      }
      restaurantId = inserted.id;
    }

    // 2. Clear old categories and tables (which cascade deletes items)
    await supabaseAdmin.from('menu_categories').delete().eq('restaurant_id', restaurantId);
    await supabaseAdmin.from('tables').delete().eq('restaurant_id', restaurantId);

    // 3. Insert new Categories (mapping IDs for items reference)
    const categoryIdMap: Record<string, string> = {};
    if (categories && categories.length > 0) {
      for (const cat of categories) {
        const { data: newCat } = await supabaseAdmin
          .from('menu_categories')
          .insert({
            restaurant_id: restaurantId,
            name: cat.name,
            description: cat.description || '',
            sort_order: cat.sort_order || 0,
            is_active: cat.is_active !== false,
          })
          .select()
          .single();

        if (newCat) {
          categoryIdMap[cat.id] = newCat.id;
        }
      }
    }

    // 4. Insert new Items
    if (menuItems && menuItems.length > 0) {
      const itemsToInsert = menuItems.map((item: any) => ({
        category_id: categoryIdMap[item.category_id] || item.category_id,
        restaurant_id: restaurantId,
        name: item.name,
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        image_url: item.image_url || '',
        is_available: item.is_available !== false,
        is_vegetarian: item.is_vegetarian === true,
        is_popular: item.is_popular === true,
        sort_order: item.sort_order || 0,
      }));

      await supabaseAdmin.from('menu_items').insert(itemsToInsert);
    }

    // 5. Insert new Tables
    if (tables && tables.length > 0) {
      const tablesToInsert = tables.map((t: any) => ({
        restaurant_id: restaurantId,
        table_number: t.table_number,
        capacity: parseInt(t.capacity) || 4,
        is_active: t.is_active !== false,
      }));

      await supabaseAdmin.from('tables').insert(tablesToInsert);
    }

    return NextResponse.json({ success: true, restaurantId });
  } catch (error: any) {
    console.error('Error in cloud sync API:', error);
    return NextResponse.json({ error: error?.message || 'Sync failed' }, { status: 500 });
  }
}
