// =============================================================
// QRestro — Demo Data for local testing without Supabase
// =============================================================

if (typeof window !== 'undefined') {
  const isDemo = document.cookie.includes('qrestro_demo=true');
  if (!isDemo) {
    const originalGet = window.localStorage.getItem;
    const originalSet = window.localStorage.setItem;
    const originalRemove = window.localStorage.removeItem;

    window.localStorage.getItem = function (key: string) {
      if (key === 'qrestro_demo_fresh_signup' || key === 'qrestro_real_fresh_signup') {
        return 'true'; // Real users always start as a fresh blank setup
      }
      let targetKey = key;
      if (key.startsWith('qrestro_') && !key.startsWith('qrestro_real_')) {
        targetKey = key.startsWith('qrestro_demo_')
          ? key.replace('qrestro_demo_', 'qrestro_real_')
          : key.replace('qrestro_', 'qrestro_real_');
      } else if (key.startsWith('tabletap_') && !key.startsWith('tabletap_real_')) {
        targetKey = key.startsWith('tabletap_demo_')
          ? key.replace('tabletap_demo_', 'tabletap_real_')
          : key.replace('tabletap_', 'tabletap_real_');
      }
      return originalGet.call(window.localStorage, targetKey);
    };

    window.localStorage.setItem = function (key: string, value: string) {
      let targetKey = key;
      if (key.startsWith('qrestro_') && !key.startsWith('qrestro_real_')) {
        targetKey = key.startsWith('qrestro_demo_')
          ? key.replace('qrestro_demo_', 'qrestro_real_')
          : key.replace('qrestro_', 'qrestro_real_');
      } else if (key.startsWith('tabletap_') && !key.startsWith('tabletap_real_')) {
        targetKey = key.startsWith('tabletap_demo_')
          ? key.replace('tabletap_demo_', 'tabletap_real_')
          : key.replace('tabletap_', 'tabletap_real_');
      }
      return originalSet.call(window.localStorage, targetKey, value);
    };

    window.localStorage.removeItem = function (key: string) {
      let targetKey = key;
      if (key.startsWith('qrestro_') && !key.startsWith('qrestro_real_')) {
        targetKey = key.startsWith('qrestro_demo_')
          ? key.replace('qrestro_demo_', 'qrestro_real_')
          : key.replace('qrestro_', 'qrestro_real_');
      } else if (key.startsWith('tabletap_') && !key.startsWith('tabletap_real_')) {
        targetKey = key.startsWith('tabletap_demo_')
          ? key.replace('tabletap_demo_', 'tabletap_real_')
          : key.replace('tabletap_', 'tabletap_real_');
      }
      return originalRemove.call(window.localStorage, targetKey);
    };
  }
}

import { Restaurant, MenuCategory, MenuItem, Table, Session, Order, OrderItem, Review, MenuCategoryWithItems } from './types';
import { getLocalDateString } from './utils';

const RESTAURANT_ID = 'demo-restaurant-001';

export const demoRestaurant: Restaurant = {
  id: RESTAURANT_ID,
  owner_id: 'demo-owner-001',
  name: 'The Golden Plate',
  slug: 'the-golden-plate',
  description: 'An elegant dining experience blending classic flavors with modern presentation. Fresh ingredients, warm ambiance, and impeccable service.',
  logo_url: '',
  phone: '+91 98765 43210',
  address: '42 Park Avenue, Koregaon Park, Pune 411001',
  currency: '₹',
  email: 'contact@thegoldenplate.com',
  settings: {
    chef_email: 'supportqrestro@gmail.com',
    chef_password: 'fsilnpkgqklmmdid',
    chef_use_admin_creds: true,
  },
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Static fallback arrays — used by customer-facing menu even when fresh signup clears live arrays
const _staticCategories: MenuCategory[] = [
  { id: 'cat-1', restaurant_id: RESTAURANT_ID, name: 'Starters', description: 'Begin your culinary journey', sort_order: 0, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Main Course', description: 'Signature entrees', sort_order: 1, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-3', restaurant_id: RESTAURANT_ID, name: 'Breads', description: 'Fresh from the tandoor', sort_order: 2, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-4', restaurant_id: RESTAURANT_ID, name: 'Beverages', description: 'Refreshing drinks', sort_order: 3, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-5', restaurant_id: RESTAURANT_ID, name: 'Desserts', description: 'Sweet endings', sort_order: 4, is_active: true, created_at: new Date().toISOString() },
];

export const demoCategories: MenuCategory[] = [..._staticCategories];

export const demoMenuItems: MenuItem[] = [
  // Starters
  { id: 'item-1', category_id: 'cat-1', restaurant_id: RESTAURANT_ID, name: 'Truffle Mushroom Soup', description: 'Velvety mushroom soup with truffle oil drizzle and herb croutons', price: 320, image_url: '/mushroom-soup.jpg', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-2', category_id: 'cat-1', restaurant_id: RESTAURANT_ID, name: 'Paneer Tikka', description: 'Chargrilled cottage cheese marinated in aromatic spices and yogurt', price: 380, image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-3', category_id: 'cat-1', restaurant_id: RESTAURANT_ID, name: 'Chicken Seekh Kebab', description: 'Minced chicken skewers with fresh herbs and spices, served with mint chutney', price: 420, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', is_available: true, is_vegetarian: false, is_popular: false, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-4', category_id: 'cat-1', restaurant_id: RESTAURANT_ID, name: 'Crispy Corn', description: 'Golden fried corn kernels tossed with spicy seasoning', price: 280, image_url: '/crispy-corn.jpg', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Main Course
  { id: 'item-5', category_id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Dal Makhani', description: 'Slow-cooked black lentils in rich tomato and butter gravy', price: 350, image_url: '/dal-makhani.jpg', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-6', category_id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Butter Chicken', description: 'Tender chicken in creamy tomato-butter sauce with aromatic spices', price: 480, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80', is_available: true, is_vegetarian: false, is_popular: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-7', category_id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in luscious buttery tomato gravy', price: 380, image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-9', category_id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Vegetable Biryani', description: 'Fragrant basmati rice layered with seasonal vegetables and saffron', price: 360, image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Breads
  { id: 'item-10', category_id: 'cat-3', restaurant_id: RESTAURANT_ID, name: 'Butter Naan', description: 'Soft leavened bread brushed with golden butter', price: 80, image_url: '/butter-naan.jpg', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-11', category_id: 'cat-3', restaurant_id: RESTAURANT_ID, name: 'Garlic Naan', description: 'Tandoor-baked bread topped with roasted garlic and fresh coriander', price: 100, image_url: '/garlic-naan.jpg', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-12', category_id: 'cat-3', restaurant_id: RESTAURANT_ID, name: 'Laccha Paratha', description: 'Flaky layered whole wheat bread', price: 90, image_url: '/laccha-paratha.png', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Beverages
  { id: 'item-13', category_id: 'cat-4', restaurant_id: RESTAURANT_ID, name: 'Mango Lassi', description: 'Creamy yogurt blended with fresh Alphonso mangoes', price: 180, image_url: '/mango-lassi.jpg', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-14', category_id: 'cat-4', restaurant_id: RESTAURANT_ID, name: 'Masala Chai', description: 'Traditional spiced tea brewed with cardamom and ginger', price: 120, image_url: '/masala-chai.png', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-15', category_id: 'cat-4', restaurant_id: RESTAURANT_ID, name: 'Fresh Lime Soda', description: 'Refreshing lime with soda water — sweet or salted', price: 140, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Desserts
  { id: 'item-16', category_id: 'cat-5', restaurant_id: RESTAURANT_ID, name: 'Gulab Jamun', description: 'Soft milk dumplings soaked in rose-scented sugar syrup', price: 200, image_url: '/gulab-jamun.png', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-17', category_id: 'cat-5', restaurant_id: RESTAURANT_ID, name: 'Rasmalai', description: 'Delicate cheese patties in saffron-infused sweetened milk', price: 240, image_url: '/rasmalai.png', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-18', category_id: 'cat-5', restaurant_id: RESTAURANT_ID, name: 'Chocolate Fondant', description: 'Warm chocolate cake with a molten center, served with vanilla ice cream', price: 350, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Static fallback snapshot of menu items — never mutated
const _staticMenuItems: MenuItem[] = [...demoMenuItems];

export const demoTables: Table[] = [
  { id: 'table-1', restaurant_id: RESTAURANT_ID, table_number: '1', capacity: 2, is_active: true, is_vip: false, created_at: new Date().toISOString() },
  { id: 'table-2', restaurant_id: RESTAURANT_ID, table_number: '2', capacity: 4, is_active: true, is_vip: false, created_at: new Date().toISOString() },
  { id: 'table-3', restaurant_id: RESTAURANT_ID, table_number: '3', capacity: 4, is_active: true, is_vip: false, created_at: new Date().toISOString() },
  { id: 'table-4', restaurant_id: RESTAURANT_ID, table_number: '4', capacity: 6, is_active: true, is_vip: false, created_at: new Date().toISOString() },
  { id: 'table-5', restaurant_id: RESTAURANT_ID, table_number: '5', capacity: 8, is_active: true, is_vip: false, created_at: new Date().toISOString() },
  { id: 'table-6', restaurant_id: RESTAURANT_ID, table_number: '6', capacity: 10, is_active: true, is_vip: true, created_at: new Date().toISOString() },
];

const now = new Date();
const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000).toISOString();
const twentyMinsAgo = new Date(now.getTime() - 20 * 60000).toISOString();
const tenMinsAgo = new Date(now.getTime() - 10 * 60000).toISOString();
const fiveMinsAgo = new Date(now.getTime() - 5 * 60000).toISOString();

export const demoSessions: Session[] = [
  { id: 'session-1', table_id: 'table-2', restaurant_id: RESTAURANT_ID, status: 'active', customer_name: 'Rahul', customer_phone: '+91 99887 76655', created_at: thirtyMinsAgo, closed_at: null },
  { id: 'session-2', table_id: 'table-4', restaurant_id: RESTAURANT_ID, status: 'active', customer_name: 'Priya', customer_phone: '+91 88776 65544', created_at: twentyMinsAgo, closed_at: null },
];

export const demoOrders: Order[] = [
  { id: 'order-1', session_id: 'session-1', restaurant_id: RESTAURANT_ID, order_number: 101, status: 'preparing', total_amount: 1200, notes: '', created_at: twentyMinsAgo, updated_at: tenMinsAgo },
  { id: 'order-2', session_id: 'session-1', restaurant_id: RESTAURANT_ID, order_number: 101, status: 'new', total_amount: 440, notes: 'Less spicy please', created_at: fiveMinsAgo, updated_at: fiveMinsAgo },
  { id: 'order-3', session_id: 'session-2', restaurant_id: RESTAURANT_ID, order_number: 103, status: 'ready', total_amount: 910, notes: '', created_at: twentyMinsAgo, updated_at: fiveMinsAgo },
];

export const demoOrderItems: OrderItem[] = [
  // Order 1 items
  { id: 'oi-1', order_id: 'order-1', menu_item_id: 'item-2', name: 'Paneer Tikka', quantity: 1, unit_price: 380, subtotal: 380, special_instructions: '', created_at: twentyMinsAgo },
  { id: 'oi-2', order_id: 'order-1', menu_item_id: 'item-6', name: 'Butter Chicken', quantity: 1, unit_price: 480, subtotal: 480, special_instructions: '', created_at: twentyMinsAgo },
  { id: 'oi-3', order_id: 'order-1', menu_item_id: 'item-10', name: 'Butter Naan', quantity: 2, unit_price: 80, subtotal: 160, special_instructions: '', created_at: twentyMinsAgo },
  { id: 'oi-4', order_id: 'order-1', menu_item_id: 'item-13', name: 'Mango Lassi', quantity: 1, unit_price: 180, subtotal: 180, special_instructions: '', created_at: twentyMinsAgo },
  // Order 2 items
  { id: 'oi-5', order_id: 'order-2', menu_item_id: 'item-16', name: 'Gulab Jamun', quantity: 1, unit_price: 200, subtotal: 200, special_instructions: '', created_at: fiveMinsAgo },
  { id: 'oi-6', order_id: 'order-2', menu_item_id: 'item-17', name: 'Rasmalai', quantity: 1, unit_price: 240, subtotal: 240, special_instructions: 'Extra saffron', created_at: fiveMinsAgo },
  // Order 3 items
  { id: 'oi-7', order_id: 'order-3', menu_item_id: 'item-5', name: 'Dal Makhani', quantity: 1, unit_price: 350, subtotal: 350, special_instructions: '', created_at: twentyMinsAgo },
  { id: 'oi-8', order_id: 'order-3', menu_item_id: 'item-7', name: 'Paneer Butter Masala', quantity: 1, unit_price: 380, subtotal: 380, special_instructions: '', created_at: twentyMinsAgo },
  { id: 'oi-9', order_id: 'order-3', menu_item_id: 'item-12', name: 'Laccha Paratha', quantity: 2, unit_price: 90, subtotal: 180, special_instructions: '', created_at: twentyMinsAgo },
];

export const demoReviews: Review[] = [
  { id: 'rev-1', session_id: null, restaurant_id: RESTAURANT_ID, rating: 5, comment: 'Absolutely wonderful experience! The Butter Chicken was to die for.', customer_name: 'Amit S.', customer_phone: '+91 99001 22334', created_at: new Date(now.getTime() - 2 * 86400000).toISOString() },
  { id: 'rev-2', session_id: null, restaurant_id: RESTAURANT_ID, rating: 4, comment: 'Great ambiance and food. Service was a bit slow but the food made up for it.', customer_name: 'Sneha R.', customer_phone: '+91 88990 11223', created_at: new Date(now.getTime() - 1 * 86400000).toISOString() },
  { id: 'rev-3', session_id: null, restaurant_id: RESTAURANT_ID, rating: 5, comment: 'Best paneer tikka in the city! Will definitely come back.', customer_name: 'Raj M.', customer_phone: '+91 77880 99112', created_at: new Date(now.getTime() - 3600000).toISOString() },
];

export function getDemoMenuWithCategories(): MenuCategoryWithItems[] {
  // For the customer-facing menu page we always need items.
  // If the live arrays were cleared (fresh-signup branch), try localStorage first
  // then fall back to the original static defaults so the menu is never blank.
  if (typeof window !== 'undefined') {
    try {
      const savedCats = localStorage.getItem('qrestro_demo_categories');
      const savedItems = localStorage.getItem('qrestro_demo_items');
      const cats: MenuCategory[] = savedCats ? JSON.parse(savedCats) : (demoCategories.length > 0 ? demoCategories : _staticCategories);
      const items: MenuItem[] = savedItems ? JSON.parse(savedItems) : (demoMenuItems.length > 0 ? demoMenuItems : _staticMenuItems);
      return cats
        .filter(cat => cat.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(cat => ({
          ...cat,
          menu_items: items.filter(item => item.category_id === cat.id),
        }));
    } catch {
      // fall through to static default
    }
  }
  // SSR / fallback: use static defaults
  const cats = demoCategories.length > 0 ? demoCategories : _staticCategories;
  const items = demoMenuItems.length > 0 ? demoMenuItems : _staticMenuItems;
  return cats
    .filter(cat => cat.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(cat => ({
      ...cat,
      menu_items: items.filter(item => item.category_id === cat.id),
    }));
}

export function getDemoOrdersWithItems(): (Order & { order_items: OrderItem[] })[] {
  if (typeof window !== 'undefined') {
    const isDemo = document.cookie.includes('qrestro_demo=true');
    const isFresh = localStorage.getItem('qrestro_demo_fresh_signup') === 'true' || !isDemo;
    if (isFresh) {
      return [];
    }
  }
  return demoOrders.map(order => ({
    ...order,
    order_items: demoOrderItems.filter(oi => oi.order_id === order.id),
  }));
}

export function loadDemoOrders(): (Order & { order_items: OrderItem[] })[] {
  if (typeof window === 'undefined') return [];
  const isDemo = document.cookie.includes('qrestro_demo=true');
  const isFresh = localStorage.getItem('qrestro_demo_fresh_signup') === 'true' || !isDemo;
  const saved = localStorage.getItem('qrestro_demo_orders');
  if (isFresh) return saved ? JSON.parse(saved) : [];
  
  let orders = saved ? JSON.parse(saved) : getDemoOrdersWithItems();
  
  const currentDate = new Date();
  const todayStr = getLocalDateString(currentDate);
  
  let needsUpdate = false;
  
  const updatedOrders = orders.map((o: any) => {
    const orderLocalDate = getLocalDateString(new Date(o.created_at));
    if (['order-1', 'order-2', 'order-3'].includes(o.id) && orderLocalDate !== todayStr) {
      needsUpdate = true;
      const originalTime = new Date(o.created_at);
      const orderDate = new Date(currentDate);
      orderDate.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds(), originalTime.getMilliseconds());
      const newIso = orderDate.toISOString();
      return {
        ...o,
        created_at: newIso,
        updated_at: newIso,
        order_items: o.order_items?.map((oi: any) => ({ ...oi, created_at: newIso })) || []
      };
    }
    return o;
  });
  
  if (needsUpdate || !saved) {
    localStorage.setItem('qrestro_demo_orders', JSON.stringify(updatedOrders));
  }
  return updatedOrders;
}

// Load custom restaurant settings from localStorage if available in browser
if (typeof window !== 'undefined') {
  try {
    const isDemo = document.cookie.includes('qrestro_demo=true');
    const isFreshSignup = localStorage.getItem('qrestro_demo_fresh_signup') === 'true' || !isDemo;
    const savedCategories = localStorage.getItem('qrestro_demo_categories');
    const savedItems = localStorage.getItem('qrestro_demo_items');
    const savedTables = localStorage.getItem('qrestro_demo_tables');
    const savedReviews = localStorage.getItem('qrestro_reviews');

    if (isFreshSignup) {
      // Clear arrays or load customized data for a fresh signup
      if (savedCategories) {
        demoCategories.splice(0, demoCategories.length, ...JSON.parse(savedCategories));
      } else {
        demoCategories.splice(0, demoCategories.length);
      }

      if (savedItems) {
        demoMenuItems.splice(0, demoMenuItems.length, ...JSON.parse(savedItems));
      } else {
        demoMenuItems.splice(0, demoMenuItems.length);
      }

      if (savedTables) {
        demoTables.splice(0, demoTables.length, ...JSON.parse(savedTables));
      } else if (!isDemo) {
        // Real user starts with no tables
        demoTables.splice(0, demoTables.length);
      }

      if (savedReviews) {
        demoReviews.splice(0, demoReviews.length, ...JSON.parse(savedReviews));
      } else {
        demoReviews.splice(0, demoReviews.length);
      }

      // Fresh accounts start with zero active sessions and mock orders
      demoSessions.splice(0, demoSessions.length);
      demoOrders.splice(0, demoOrders.length);
      demoOrderItems.splice(0, demoOrderItems.length);
    } else {
      // Load customized data if it exists, otherwise keep static presets
      if (savedCategories) {
        demoCategories.splice(0, demoCategories.length, ...JSON.parse(savedCategories));
      }
      if (savedItems) {
        demoMenuItems.splice(0, demoMenuItems.length, ...JSON.parse(savedItems));
      }
      if (savedTables) {
        demoTables.splice(0, demoTables.length, ...JSON.parse(savedTables));
      }
      if (savedReviews) {
        demoReviews.splice(0, demoReviews.length, ...JSON.parse(savedReviews));
      }
    }

    const saved = localStorage.getItem('qrestro_demo_restaurant');
    if (saved) {
      const custom = JSON.parse(saved);
      if (custom.name) demoRestaurant.name = custom.name;
      if (custom.description) demoRestaurant.description = custom.description;
      if (custom.phone) demoRestaurant.phone = custom.phone;
      if (custom.address) demoRestaurant.address = custom.address;
      if (custom.currency) demoRestaurant.currency = custom.currency;
      if (custom.email) demoRestaurant.email = custom.email;
      if (custom.slug) demoRestaurant.slug = custom.slug;
      if (custom.logo_url !== undefined) demoRestaurant.logo_url = custom.logo_url;
      demoRestaurant.settings = {
        ...demoRestaurant.settings,
        cgst_rate: custom.cgst_rate !== undefined ? Number(custom.cgst_rate) : 2.5,
        sgst_rate: custom.sgst_rate !== undefined ? Number(custom.sgst_rate) : 2.5,
        service_charge_rate: custom.service_charge_rate !== undefined ? Number(custom.service_charge_rate) : 0,
        service_charge_type: custom.service_charge_type || 'percent',
        chef_email: custom.chef_email || 'supportqrestro@gmail.com',
        chef_password: custom.chef_password || 'fsilnpkgqklmmdid',
        chef_use_admin_creds: custom.chef_use_admin_creds !== undefined ? custom.chef_use_admin_creds === true : true,
        upi_id: custom.upi_id || '',
        payment_qr_url: custom.payment_qr_url || '',
      };
    } else if (!isDemo) {
      // Default blank/fresh restaurant settings for real accounts
      demoRestaurant.name = 'My Restaurant';
      demoRestaurant.slug = 'my-restaurant';
      demoRestaurant.description = 'Welcome to our restaurant!';
      demoRestaurant.phone = '';
      demoRestaurant.address = '';
      demoRestaurant.email = '';
      demoRestaurant.logo_url = '';
    }
  } catch (e) {
    console.error('Error loading custom demo restaurant settings:', e);
  }
}

export async function syncWithCloud() {
  if (typeof window === 'undefined') return;
  try {
    const savedRestaurant = localStorage.getItem('qrestro_demo_restaurant');
    const savedCategories = localStorage.getItem('qrestro_demo_categories');
    const savedItems = localStorage.getItem('qrestro_demo_items');
    const savedTables = localStorage.getItem('qrestro_demo_tables');

    const restaurant = savedRestaurant ? JSON.parse(savedRestaurant) : demoRestaurant;
    const categories = savedCategories ? JSON.parse(savedCategories) : demoCategories;
    const menuItems = savedItems ? JSON.parse(savedItems) : demoMenuItems;
    const tables = savedTables ? JSON.parse(savedTables) : demoTables;

    const syncedSettings = {
      ...demoRestaurant.settings,
      ...(restaurant.settings || {}),
      cgst_rate: restaurant.cgst_rate !== undefined ? Number(restaurant.cgst_rate) : (restaurant.settings?.cgst_rate !== undefined ? Number(restaurant.settings.cgst_rate) : 2.5),
      sgst_rate: restaurant.sgst_rate !== undefined ? Number(restaurant.sgst_rate) : (restaurant.settings?.sgst_rate !== undefined ? Number(restaurant.settings.sgst_rate) : 2.5),
      service_charge_rate: restaurant.service_charge_rate !== undefined ? Number(restaurant.service_charge_rate) : (restaurant.settings?.service_charge_rate !== undefined ? Number(restaurant.settings.service_charge_rate) : 0),
      service_charge_type: restaurant.service_charge_type || restaurant.settings?.service_charge_type || 'percent',
      chef_email: restaurant.chef_email || restaurant.settings?.chef_email || 'supportqrestro@gmail.com',
      chef_password: restaurant.chef_password || restaurant.settings?.chef_password || 'fsilnpkgqklmmdid',
      chef_use_admin_creds: restaurant.chef_use_admin_creds === true || restaurant.settings?.chef_use_admin_creds === true,
      upi_id: restaurant.upi_id || restaurant.settings?.upi_id || '',
      payment_qr_url: restaurant.payment_qr_url || restaurant.settings?.payment_qr_url || '',
    };

    const restaurantPayload = {
      name: restaurant.name || demoRestaurant.name || 'The Golden Plate',
      description: restaurant.description || demoRestaurant.description || '',
      logo_url: restaurant.logo_url || demoRestaurant.logo_url || '',
      phone: restaurant.phone || demoRestaurant.phone || '',
      address: restaurant.address || demoRestaurant.address || '',
      currency: restaurant.currency || demoRestaurant.currency || '₹',
      settings: syncedSettings,
    };

    const slug = restaurant.slug || demoRestaurant.slug || 'the-golden-plate';

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug,
        restaurant: restaurantPayload,
        categories,
        menuItems,
        tables,
      }),
    });

    if (!response.ok) {
      console.error('Cloud sync failed:', await response.text());
    } else {
      console.log('Cloud sync successful for slug:', slug);
    }
  } catch (error) {
    console.error('Error during cloud sync:', error);
  }
}

export function saveDemoCategories(categories: MenuCategory[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('qrestro_demo_categories', JSON.stringify(categories));
    demoCategories.splice(0, demoCategories.length, ...categories);
    syncWithCloud();
  }
}

export function saveDemoMenuItems(items: MenuItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('qrestro_demo_items', JSON.stringify(items));
    demoMenuItems.splice(0, demoMenuItems.length, ...items);
    syncWithCloud();
  }
}

export function saveDemoTables(tables: Table[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('qrestro_demo_tables', JSON.stringify(tables));
    demoTables.splice(0, demoTables.length, ...tables);
    syncWithCloud();
  }
}

export function saveDemoRestaurantSettings(settings: {
  name: string;
  description: string;
  phone: string;
  address: string;
  currency: string;
  email?: string;
  logo_url?: string;
  cgst_rate?: number;
  sgst_rate?: number;
  service_charge_rate?: number;
  service_charge_type?: 'percent' | 'fixed';
  chef_email?: string;
  chef_password?: string;
  chef_use_admin_creds?: boolean;
  upi_id?: string;
  payment_qr_url?: string;
}) {
  if (typeof window !== 'undefined') {
    const slug = settings.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const data = { ...settings, slug: slug || 'the-golden-plate' };
    localStorage.setItem('qrestro_demo_restaurant', JSON.stringify(data));
    
    // Mutate the live object so imported references update immediately
    demoRestaurant.name = data.name;
    demoRestaurant.description = data.description;
    demoRestaurant.phone = data.phone;
    demoRestaurant.address = data.address;
    demoRestaurant.currency = data.currency;
    if (data.email) demoRestaurant.email = data.email;
    if (data.logo_url !== undefined) demoRestaurant.logo_url = data.logo_url;
    demoRestaurant.slug = data.slug;
    demoRestaurant.settings = {
      ...demoRestaurant.settings,
      cgst_rate: data.cgst_rate !== undefined ? Number(data.cgst_rate) : 2.5,
      sgst_rate: data.sgst_rate !== undefined ? Number(data.sgst_rate) : 2.5,
      service_charge_rate: data.service_charge_rate !== undefined ? Number(data.service_charge_rate) : 0,
      service_charge_type: data.service_charge_type || 'percent',
      chef_email: data.chef_email || 'supportqrestro@gmail.com',
      chef_password: data.chef_password || 'fsilnpkgqklmmdid',
      chef_use_admin_creds: data.chef_use_admin_creds === true,
      upi_id: data.upi_id || '',
      payment_qr_url: data.payment_qr_url || '',
    };
    syncWithCloud();
  }
}


