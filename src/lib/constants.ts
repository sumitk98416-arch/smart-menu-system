// =============================================================
// TableTap — App Constants
// =============================================================

export const APP_NAME = 'TableTap';
export const APP_DESCRIPTION = 'Premium QR-based restaurant ordering platform';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const ORDER_STATUSES = {
  new: { label: 'New Order', color: 'bg-amber-100 text-amber-800', icon: '🆕' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: '✅' },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-800', icon: '👨‍🍳' },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: '🔔' },
  served: { label: 'Served', color: 'bg-emerald-100 text-emerald-800', icon: '🍽️' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' },
} as const;

export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  new: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['served'],
  served: [],
  cancelled: [],
};

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: 'LayoutDashboard' },
  { href: '/dashboard/menu', label: 'Menu', icon: 'UtensilsCrossed' },
  { href: '/dashboard/tables', label: 'Tables & QR', icon: 'QrCode' },
  { href: '/dashboard/orders', label: 'Orders', icon: 'ClipboardList' },
  { href: '/dashboard/kitchen', label: 'Kitchen', icon: 'ChefHat' },
  { href: '/dashboard/reviews', label: 'Reviews', icon: 'Star' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'Settings' },
] as const;

export const DEMO_RESTAURANT = {
  id: 'demo-restaurant-id',
  name: 'The Golden Plate',
  slug: 'the-golden-plate',
  description: 'Fine dining experience with modern cuisine',
  currency: '₹',
};
