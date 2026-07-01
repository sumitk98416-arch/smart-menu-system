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

    // 1. Resolve Owner ID dynamically to avoid foreign key violation
    let ownerId = '00000000-0000-0000-0000-000000000000';
    try {
      const { createClient: createServerClient } = await import('@/lib/supabase/server');
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        ownerId = user.id;
      } else {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
        if (users && users.length > 0) {
          ownerId = users[0].id;
        }
      }
    } catch (e) {
      console.error('Error determining owner ID:', e);
      try {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
        if (users && users.length > 0) {
          ownerId = users[0].id;
        }
      } catch (err) {
        console.error('Fallback listUsers failed:', err);
      }
    }

    // 2. Get or Upsert Restaurant
    const { data: existingRestaurant } = await supabaseAdmin
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
      const { data: inserted } = await supabaseAdmin
        .from('restaurants')
        .insert({
          owner_id: ownerId,
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

export async function GET(request: NextRequest) {
  try {
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Fetch the restaurant owned by the user
    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (restError) {
      return NextResponse.json({ error: restError.message }, { status: 500 });
    }

    if (!restaurant) {
      // Return empty configuration so client can initialize fresh
      return NextResponse.json({
        exists: false,
        restaurant: null,
        categories: [],
        menuItems: [],
        tables: []
      });
    }

    // 2. Fetch categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order');

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    // 3. Fetch menu items
    const { data: menuItems, error: itemsError } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order');

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 4. Fetch tables
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('table_number');

    if (tablesError) {
      return NextResponse.json({ error: tablesError.message }, { status: 500 });
    }

    // Map IDs to match client-side local storage structure (which uses string UUIDs)
    const formattedCategories = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active !== false
    }));

    const formattedMenuItems = menuItems.map((item: any) => ({
      id: item.id,
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: parseFloat(item.price) || 0,
      image_url: item.image_url || '',
      is_available: item.is_available !== false,
      is_vegetarian: item.is_vegetarian === true,
      is_popular: item.is_popular === true,
      sort_order: item.sort_order || 0
    }));

    const formattedTables = tables.map((t: any) => ({
      id: `table-bulk-${t.table_number}`,
      table_number: t.table_number,
      capacity: parseInt(t.capacity) || 4,
      is_active: t.is_active !== false
    }));

    return NextResponse.json({
      exists: true,
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description || '',
        logo_url: restaurant.logo_url || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        currency: restaurant.currency || '₹',
        settings: restaurant.settings || {}
      },
      categories: formattedCategories,
      menuItems: formattedMenuItems,
      tables: formattedTables
    });
  } catch (error: any) {
    console.error('Error fetching cloud sync data:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
