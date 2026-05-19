// =============================================================
// TableTap — Demo Data for local testing without Supabase
// =============================================================

import { Restaurant, MenuCategory, MenuItem, Table, Session, Order, OrderItem, Review, MenuCategoryWithItems } from './types';

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
  settings: {},
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoCategories: MenuCategory[] = [
  { id: 'cat-1', restaurant_id: RESTAURANT_ID, name: 'Starters', description: 'Begin your culinary journey', sort_order: 0, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Main Course', description: 'Signature entrees', sort_order: 1, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-3', restaurant_id: RESTAURANT_ID, name: 'Breads', description: 'Fresh from the tandoor', sort_order: 2, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-4', restaurant_id: RESTAURANT_ID, name: 'Beverages', description: 'Refreshing drinks', sort_order: 3, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-5', restaurant_id: RESTAURANT_ID, name: 'Desserts', description: 'Sweet endings', sort_order: 4, is_active: true, created_at: new Date().toISOString() },
];

export const demoMenuItems: MenuItem[] = [
  // Starters
  { id: 'item-1', category_id: 'cat-1', restaurant_id: RESTAURANT_ID, name: 'Truffle Mushroom Soup', description: 'Velvety mushroom soup with truffle oil drizzle and herb croutons', price: 320, image_url: '', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-2', category_id: 'cat-1', restaurant_id: RESTAURANT_ID, name: 'Paneer Tikka', description: 'Chargrilled cottage cheese marinated in aromatic spices and yogurt', price: 380, image_url: '', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-3', category_id: 'cat-1', restaurant_id: RESTAURANT_ID, name: 'Chicken Seekh Kebab', description: 'Minced chicken skewers with fresh herbs and spices, served with mint chutney', price: 420, image_url: '', is_available: true, is_vegetarian: false, is_popular: false, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-4', category_id: 'cat-1', restaurant_id: RESTAURANT_ID, name: 'Crispy Corn', description: 'Golden fried corn kernels tossed with spicy seasoning', price: 280, image_url: '', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Main Course
  { id: 'item-5', category_id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Dal Makhani', description: 'Slow-cooked black lentils in rich tomato and butter gravy', price: 350, image_url: '', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-6', category_id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Butter Chicken', description: 'Tender chicken in creamy tomato-butter sauce with aromatic spices', price: 480, image_url: '', is_available: true, is_vegetarian: false, is_popular: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-7', category_id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in luscious buttery tomato gravy', price: 380, image_url: '', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-8', category_id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Lamb Rogan Josh', description: 'Aromatic Kashmiri lamb curry with whole spices', price: 550, image_url: '', is_available: true, is_vegetarian: false, is_popular: false, sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-9', category_id: 'cat-2', restaurant_id: RESTAURANT_ID, name: 'Vegetable Biryani', description: 'Fragrant basmati rice layered with seasonal vegetables and saffron', price: 360, image_url: '', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Breads
  { id: 'item-10', category_id: 'cat-3', restaurant_id: RESTAURANT_ID, name: 'Butter Naan', description: 'Soft leavened bread brushed with golden butter', price: 80, image_url: '', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-11', category_id: 'cat-3', restaurant_id: RESTAURANT_ID, name: 'Garlic Naan', description: 'Tandoor-baked bread topped with roasted garlic and fresh coriander', price: 100, image_url: '', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-12', category_id: 'cat-3', restaurant_id: RESTAURANT_ID, name: 'Laccha Paratha', description: 'Flaky layered whole wheat bread', price: 90, image_url: '', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Beverages
  { id: 'item-13', category_id: 'cat-4', restaurant_id: RESTAURANT_ID, name: 'Mango Lassi', description: 'Creamy yogurt blended with fresh Alphonso mangoes', price: 180, image_url: '', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-14', category_id: 'cat-4', restaurant_id: RESTAURANT_ID, name: 'Masala Chai', description: 'Traditional spiced tea brewed with cardamom and ginger', price: 120, image_url: '', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-15', category_id: 'cat-4', restaurant_id: RESTAURANT_ID, name: 'Fresh Lime Soda', description: 'Refreshing lime with soda water — sweet or salted', price: 140, image_url: '', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Desserts
  { id: 'item-16', category_id: 'cat-5', restaurant_id: RESTAURANT_ID, name: 'Gulab Jamun', description: 'Soft milk dumplings soaked in rose-scented sugar syrup', price: 200, image_url: '', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-17', category_id: 'cat-5', restaurant_id: RESTAURANT_ID, name: 'Rasmalai', description: 'Delicate cheese patties in saffron-infused sweetened milk', price: 240, image_url: '', is_available: true, is_vegetarian: true, is_popular: true, sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item-18', category_id: 'cat-5', restaurant_id: RESTAURANT_ID, name: 'Chocolate Fondant', description: 'Warm chocolate cake with a molten center, served with vanilla ice cream', price: 350, image_url: '', is_available: true, is_vegetarian: true, is_popular: false, sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const demoTables: Table[] = [
  { id: 'table-1', restaurant_id: RESTAURANT_ID, table_number: '1', capacity: 2, is_active: true, created_at: new Date().toISOString() },
  { id: 'table-2', restaurant_id: RESTAURANT_ID, table_number: '2', capacity: 4, is_active: true, created_at: new Date().toISOString() },
  { id: 'table-3', restaurant_id: RESTAURANT_ID, table_number: '3', capacity: 4, is_active: true, created_at: new Date().toISOString() },
  { id: 'table-4', restaurant_id: RESTAURANT_ID, table_number: '4', capacity: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'table-5', restaurant_id: RESTAURANT_ID, table_number: '5', capacity: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'table-6', restaurant_id: RESTAURANT_ID, table_number: 'VIP', capacity: 10, is_active: true, created_at: new Date().toISOString() },
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
  { id: 'order-1', session_id: 'session-1', restaurant_id: RESTAURANT_ID, order_number: 101, status: 'preparing', total_amount: 1180, notes: '', created_at: twentyMinsAgo, updated_at: tenMinsAgo },
  { id: 'order-2', session_id: 'session-1', restaurant_id: RESTAURANT_ID, order_number: 102, status: 'new', total_amount: 460, notes: 'Less spicy please', created_at: fiveMinsAgo, updated_at: fiveMinsAgo },
  { id: 'order-3', session_id: 'session-2', restaurant_id: RESTAURANT_ID, order_number: 103, status: 'ready', total_amount: 930, notes: '', created_at: twentyMinsAgo, updated_at: fiveMinsAgo },
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
  return demoCategories.map(cat => ({
    ...cat,
    menu_items: demoMenuItems.filter(item => item.category_id === cat.id),
  }));
}

export function getDemoOrdersWithItems(): (Order & { order_items: OrderItem[] })[] {
  return demoOrders.map(order => ({
    ...order,
    order_items: demoOrderItems.filter(oi => oi.order_id === order.id),
  }));
}

// Load custom restaurant settings from localStorage if available in browser
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('tabletap_demo_restaurant');
    if (saved) {
      const custom = JSON.parse(saved);
      if (custom.name) demoRestaurant.name = custom.name;
      if (custom.description) demoRestaurant.description = custom.description;
      if (custom.phone) demoRestaurant.phone = custom.phone;
      if (custom.address) demoRestaurant.address = custom.address;
      if (custom.currency) demoRestaurant.currency = custom.currency;
      if (custom.slug) demoRestaurant.slug = custom.slug;
    }
  } catch (e) {
    console.error('Error loading custom demo restaurant settings:', e);
  }
}

export function saveDemoRestaurantSettings(settings: {
  name: string;
  description: string;
  phone: string;
  address: string;
  currency: string;
}) {
  if (typeof window !== 'undefined') {
    const slug = settings.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const data = { ...settings, slug: slug || 'the-golden-plate' };
    localStorage.setItem('tabletap_demo_restaurant', JSON.stringify(data));
    
    // Mutate the live object so imported references update immediately
    demoRestaurant.name = data.name;
    demoRestaurant.description = data.description;
    demoRestaurant.phone = data.phone;
    demoRestaurant.address = data.address;
    demoRestaurant.currency = data.currency;
    demoRestaurant.slug = data.slug;
  }
}
