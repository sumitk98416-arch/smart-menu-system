'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UtensilsCrossed, LayoutDashboard, QrCode, ClipboardList,
  ChefHat, Star, Settings, Menu, X, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/tables', label: 'Tables & QR', icon: QrCode },
  { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/dashboard/kitchen', label: 'Kitchen', icon: ChefHat },
  { href: '/dashboard/reviews', label: 'Reviews', icon: Star },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Owner');
  const [restaurantName, setRestaurantName] = useState('The Golden Plate');

  useEffect(() => {
    // Read the custom demo name if present
    const match = document.cookie.match(/(?:^|; )tabletap_demo_name=([^;]*)/);
    if (match) {
      try {
        setUserName(decodeURIComponent(match[1]));
      } catch {
        // Fallback
      }
    }

    // Read the custom restaurant settings if present
    try {
      const saved = localStorage.getItem('tabletap_demo_restaurant');
      if (saved) {
        const custom = JSON.parse(saved);
        if (custom.name) {
          setRestaurantName(custom.name);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-ink-900/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-cream-100 border-r border-cream-200 flex flex-col transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-ink-900">TableTap</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-ink-400 hover:text-ink-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restaurant name */}
        <div className="px-6 pb-4">
          <div className="bg-cream-50 rounded-xl p-3 border border-cream-200">
            <p className="text-xs text-ink-400 font-medium uppercase tracking-wider">Restaurant</p>
            <p className="text-sm font-semibold text-ink-900 mt-0.5">{restaurantName}</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gold-500 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-cream-50 hover:text-ink-900'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-cream-200">
          <button
            onClick={() => {
              document.cookie = 'tabletap_demo=;path=/;max-age=0';
              document.cookie = 'tabletap_demo_name=;path=/;max-age=0';
              try {
                localStorage.removeItem('tabletap_demo_restaurant');
              } catch {}
              window.location.href = '/';
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-500 hover:bg-cream-50 hover:text-ink-900 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-cream-50/80 backdrop-blur-md border-b border-cream-200 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-ink-600 hover:text-ink-900 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold-500/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-gold-600">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-ink-700 hidden sm:inline">{userName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
