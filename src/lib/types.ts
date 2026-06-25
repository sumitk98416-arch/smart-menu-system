// =============================================================
// QRestro — TypeScript Type Definitions
// =============================================================

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  phone: string;
  address: string;
  currency: string;
  email?: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'kitchen' | 'waiter';
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  is_vegetarian: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  is_active: boolean;
  is_vip?: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  table_id: string;
  restaurant_id: string;
  status: 'active' | 'completed';
  customer_name: string;
  customer_phone: string;
  created_at: string;
  closed_at: string | null;
}

export interface Order {
  id: string;
  session_id: string;
  restaurant_id: string;
  order_number: number;
  status: OrderStatus;
  total_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  session?: Session;
  payment_status?: 'unpaid' | 'pending' | 'paid';
}

export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions: string;
  created_at: string;
}

export interface Review {
  id: string;
  session_id: string | null;
  restaurant_id: string;
  rating: number;
  comment: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

// Cart types (client-side only)
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions: string;
}

export interface MenuCategoryWithItems extends MenuCategory {
  menu_items: MenuItem[];
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}
