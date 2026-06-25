'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  UtensilsCrossed, LayoutDashboard, QrCode, ClipboardList,
  ChefHat, Star, Settings, Menu, X, LogOut, Calendar, ChevronDown, User, Clock, Crown, CupSoda, Soup, Package, Users, BookOpen, Coins, Phone, ClipboardCheck, CreditCard, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/recipes', label: 'Recipes', icon: BookOpen },
  { href: '/dashboard/tables', label: 'Tables & QR', icon: QrCode },
  { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/dashboard/kitchen', label: 'Kitchen', icon: ChefHat },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Phone },
  { href: '/dashboard/finance', label: 'Finance & Analytics', icon: Coins },
  { href: '/dashboard/staff', label: 'Staff', icon: Users },
  { href: '/dashboard/reviews', label: 'Reviews', icon: Star },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = () => {
  return getLocalDateString(new Date(Date.now() - 86400000));
};

const getSevenDaysAgoDateString = () => {
  return getLocalDateString(new Date(Date.now() - 7 * 86400000));
};

function DateSelectorDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [dateOpen, setDateOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Date selector state
  const [formattedDate, setFormattedDate] = useState(() => {
    try {
      const today = new Date();
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      return today.toLocaleDateString('en-US', options);
    } catch {
      return 'May 21, 2026';
    }
  });

  // Update header date text when date query parameter changes
  useEffect(() => {
    try {
      const targetDate = dateParam ? new Date(dateParam) : new Date();
      if (!isNaN(targetDate.getTime())) {
        // Offset timezone difference for clean display
        if (dateParam) {
          const [year, month, day] = dateParam.split('-').map(Number);
          const localDate = new Date(year, month - 1, day);
          const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
          setTimeout(() => {
            setFormattedDate(localDate.toLocaleDateString('en-US', options));
          }, 0);
        } else {
          const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
          setTimeout(() => {
            setFormattedDate(targetDate.toLocaleDateString('en-US', options));
          }, 0);
        }
      }
    } catch {
      // Fallback
    }
  }, [dateParam]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setDateOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dateDropdownRef}>
      <div
        onClick={() => setDateOpen(!dateOpen)}
        className="flex items-center gap-2 bg-white border border-[#E6E1DA] hover:border-[#B88A52]/40 transition-colors rounded-xl px-4 py-2 shadow-sm text-sm text-[#5A5348] font-medium cursor-pointer"
      >
        <Calendar className="w-4.5 h-4.5 text-[#8C8375]" />
        <span>{formattedDate}</span>
        <ChevronDown className={cn("w-4 h-4 text-[#8C8375] transition-transform duration-200", dateOpen && "rotate-180")} />
      </div>

      {dateOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white border border-[#EAE6DF] shadow-xl rounded-2xl z-50 p-4 animate-fade-in text-left">
          <h4 className="font-heading font-bold text-ink-900 text-sm mb-3">Select Date</h4>

          {/* Preset list */}
          <div className="space-y-1">
            {[
              { label: 'Today', value: getLocalDateString() },
              { label: 'Yesterday', value: getYesterdayDateString() },
              { label: '7 Days Ago', value: getSevenDaysAgoDateString() },
            ].map((preset) => {
              const isSelected = dateParam === preset.value || (!dateParam && preset.label === 'Today');
              return (
                <button
                  key={preset.value}
                  onClick={() => {
                    router.push(`/dashboard?date=${preset.value}`);
                    setDateOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between",
                    isSelected
                      ? "bg-[#FAF4EB] text-[#B88A52]"
                      : "text-[#5A5348] hover:bg-[#FAF7F2]"
                  )}
                >
                  <span>{preset.label}</span>
                  <span className="text-[10px] text-[#8C8375] font-normal">
                    {new Date(preset.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#F3EFEA] my-3" />

          {/* Custom HTML5 Date Selector wrapped elegantly */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#8C8375] mb-1.5">Custom Date</label>
            <input
              type="date"
              value={dateParam || getLocalDateString()}
              onChange={(e) => {
                if (e.target.value) {
                  router.push(`/dashboard?date=${e.target.value}`);
                  setDateOpen(false);
                }
              }}
              className="w-full text-xs font-semibold px-3 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )qrestro_demo_name=([^;]*)/);
      if (match) {
        try {
          return decodeURIComponent(match[1]);
        } catch { }
      }
    }
    return 'Owner';
  });
  const [userEmail, setUserEmail] = useState(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )qrestro_demo_email=([^;]*)/);
      if (match) {
        try {
          return decodeURIComponent(match[1]);
        } catch { }
      }
    }
    return '';
  });
  const [restaurantName, setRestaurantName] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('qrestro_demo_restaurant');
        if (saved) {
          const custom = JSON.parse(saved);
          if (custom.name) return custom.name;
        }
      } catch { }
    }
    return 'The Golden Plate';
  });
  const [restaurantLogo, setRestaurantLogo] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('qrestro_demo_restaurant');
        if (saved) {
          const custom = JSON.parse(saved);
          if (custom.logo_url) return custom.logo_url;
        }
      } catch { }
    }
    return 'default';
  });

  const [subscription, setSubscription] = useState<{
    plan: 'trial' | 'premium';
    trialStartDate: string;
    daysRemaining: number;
    subscribedDate: string | null;
  }>({
    plan: 'trial',
    trialStartDate: '',
    daysRemaining: 7,
    subscribedDate: null,
  });

  const renderSidebarLogo = () => {
    const className = "w-4 h-4 text-[#B88A52] flex-shrink-0";
    if (!restaurantLogo || restaurantLogo === 'default' || restaurantLogo === 'crown') {
      return <Crown className={className} />;
    }
    if (restaurantLogo === 'chef') {
      return <ChefHat className={className} />;
    }
    if (restaurantLogo === 'soup') {
      return <Soup className={className} />;
    }
    if (restaurantLogo === 'cup') {
      return <CupSoda className={className} />;
    }
    if (restaurantLogo === 'star') {
      return <Star className={className} />;
    }
    return (
      <img
        src={restaurantLogo}
        className="w-full h-full rounded-lg object-cover"
        alt="Logo"
      />
    );
  };

  // Live clock state
  const [formattedTime, setFormattedTime] = useState('');
  const [mounted, setMounted] = useState(false);

  // Profile dropdown states & ref
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync userName and userEmail cookie on mount to avoid Next.js hydration mismatches
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )qrestro_demo_name=([^;]*)/);
      if (match) {
        try {
          setUserName(decodeURIComponent(match[1]));
        } catch { }
      }
      const emailMatch = document.cookie.match(/(?:^|; )qrestro_demo_email=([^;]*)/);
      if (emailMatch) {
        try {
          setUserEmail(decodeURIComponent(emailMatch[1]));
        } catch { }
      }
    }

    // Sync real Supabase user name and email on mount if in real database mode
    const syncRealUser = async () => {
      const isSupabaseConfigured = 
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co' &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key-here';

      const isDemo = document.cookie.includes('qrestro_demo=true');

      if (isSupabaseConfigured && !isDemo) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Owner');
            setUserEmail(user.email || '');
          }
        } catch (e) {
          console.error('Error fetching Supabase user in layout:', e);
        }
      }
    };
    syncRealUser();

    // Real-time custom event listeners for logo and name syncing
    const handleLogoChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setRestaurantLogo(customEvent.detail);
      }
    };

    const handleNameChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setRestaurantName(customEvent.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('qrestro_logo_changed', handleLogoChange);
      window.addEventListener('qrestro_name_changed', handleNameChange);
    }

    // Dropdown click outside listener
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    // Load subscription status
    const loadSubscription = () => {
      const stored = localStorage.getItem('qrestro_demo_subscription');
      let sub: any = null;
      if (stored) {
        try {
          sub = JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing subscription:', e);
        }
      }

      const getLocalDateString = (d = new Date()) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const todayStr = getLocalDateString();
      if (!sub || !sub.trialStartDate) {
        sub = {
          plan: 'trial',
          trialStartDate: todayStr,
          subscribedDate: null,
        };
        localStorage.setItem('qrestro_demo_subscription', JSON.stringify(sub));
      }

      if (sub.plan === 'trial') {
        const start = new Date(sub.trialStartDate);
        start.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffTime = now.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        sub.daysRemaining = Math.max(0, 7 - diffDays);
      } else {
        sub.daysRemaining = 0;
      }

      setSubscription(sub);
    };

    loadSubscription();

    // Event listener for tab storage or custom events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'qrestro_demo_subscription') {
        loadSubscription();
      }
    };

    const handleSubChanged = () => {
      loadSubscription();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('qrestro_subscription_changed', handleSubChanged);

    setTimeout(() => {
      setMounted(true);
    }, 0);

    // Live clock update logic
    const updateClock = () => {
      try {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        setFormattedTime(now.toLocaleTimeString('en-US', options));
      } catch { }
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 15000);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(clockInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('qrestro_subscription_changed', handleSubChanged);
      if (typeof window !== 'undefined') {
        window.removeEventListener('qrestro_logo_changed', handleLogoChange);
        window.removeEventListener('qrestro_name_changed', handleNameChange);
      }
    };
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
            <div className="w-12 h-12 bg-gold-500 rounded-xl flex items-center justify-center">
              <svg className="w-9 h-9 text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Clover / Crown Knob at top */}
                <path d="M 45 38 C 42 38, 38 35, 41 30 C 44 25, 48 29, 50 32 C 50 29, 54 25, 57 30 C 60 35, 56 38, 53 38 Q 50 42 50 44 Z M 50 44 L 50 48" strokeWidth="2.8" fill="none" />
                <circle cx="50" cy="27" r="3.5" fill="currentColor" stroke="none" />
                
                {/* Cloche Dome */}
                <path d="M 12 76 A 38 38 0 0 1 88 76 Z" strokeWidth="4" />
                
                {/* Inner Left Highlight Glint */}
                <path d="M 20 70 A 30 30 0 0 1 36 49" strokeWidth="2.5" opacity="0.6" />
                
                {/* Platter / Tray Base */}
                <rect x="5" y="76" width="90" height="5" rx="2.5" fill="currentColor" stroke="none" />
                <path d="M 12 83 Q 50 86 88 83" strokeWidth="3" />
                
                {/* Inner Realistic QR Code */}
                <rect x="33" y="47" width="10" height="10" rx="1.5" strokeWidth="2" />
                <rect x="36" y="50" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" />
                
                <rect x="57" y="47" width="10" height="10" rx="1.5" strokeWidth="2" />
                <rect x="60" y="50" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" />
                
                <rect x="33" y="61" width="10" height="10" rx="1.5" strokeWidth="2" />
                <rect x="36" y="64" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" />
                
                <rect x="47" y="47" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="51" y="47" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="47" y="51" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="51" y="55" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="47" y="58" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="57" y="58" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="61" y="58" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="47" y="62" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="51" y="62" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="47" y="66" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="57" y="66" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="61" y="66" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="51" y="70" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="57" y="70" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
                <rect x="61" y="70" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <span className="font-heading text-xl font-bold text-ink-900">QRestro</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-ink-400 hover:text-ink-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restaurant name */}
        <div className="px-6 pb-4">
          <div className="bg-cream-50 rounded-xl p-3 border border-cream-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF4EB] border border-[#B88A52]/10 flex items-center justify-center flex-shrink-0">
              {renderSidebarLogo()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-ink-400 font-bold uppercase tracking-wider leading-none">Restaurant</p>
              <p className="text-xs font-bold text-ink-900 mt-1.5 truncate leading-none">{restaurantName}</p>
            </div>
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
          {/* Subscription widget */}
          {mounted && (
            subscription.plan === 'trial' ? (
              <div className="mb-4 bg-white border border-[#E6E1DA] rounded-xl p-3 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Free Trial
                  </span>
                  <span className="text-xs font-bold text-[#8C8375]">
                    {subscription.daysRemaining} days left
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-[#F3EFEA] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#B88A52] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(subscription.daysRemaining / 7) * 100}%` }}
                  />
                </div>

                <p className="text-[9px] text-[#8C8375] leading-normal">
                  Unlock premium features for just ₹200/month.
                </p>

                <Link
                  href="/dashboard/settings?tab=subscription"
                  className="flex items-center justify-center gap-1 w-full bg-[#B88A52] hover:bg-[#A37844] text-white text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upgrade</span>
                </Link>
              </div>
            ) : (
              <div className="mb-4 bg-gradient-to-br from-[#1C1A17] to-[#2E2923] border border-[#B88A52]/20 rounded-xl p-3 shadow-md space-y-2">
                <div className="flex items-center gap-2 text-[#EAD0A8]">
                  <div className="w-6 h-6 rounded-lg bg-[#B88A52]/20 border border-[#B88A52]/30 flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-[#EAD0A8]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider leading-none text-[#B88A52]">License</p>
                    <p className="text-[11px] font-bold text-white mt-0.5 leading-none">Premium Plan</p>
                  </div>
                </div>

                <p className="text-[9px] text-[#A69B8E] leading-normal pt-0.5">
                  Monthly subscription active (₹200/mo).
                </p>

                <Link
                  href="/dashboard/settings?tab=subscription"
                  className="flex items-center justify-center gap-1 w-full bg-white/5 hover:bg-white/10 text-[#EAD0A8] border border-[#B88A52]/30 text-[10px] font-semibold py-1 px-3 rounded-xl transition-all cursor-pointer"
                >
                  <span>Manage</span>
                </Link>
              </div>
            )
          )}

          <button
            onClick={async () => {
              try {
                const supabase = createClient();
                await supabase.auth.signOut();
              } catch (e) {
                console.error('Error signing out of Supabase:', e);
              }
              document.cookie = 'qrestro_demo=;path=/;max-age=0';
              document.cookie = 'qrestro_demo_name=;path=/;max-age=0';
              document.cookie = 'qrestro_demo_email=;path=/;max-age=0';
              document.cookie = 'qrestro_demo_password=;path=/;max-age=0';
              try {
                localStorage.removeItem('qrestro_demo_restaurant');
                localStorage.removeItem('qrestro_demo_fresh_signup');
              } catch { }
              window.location.href = '/auth/login';
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-500 hover:bg-cream-50 hover:text-ink-900 transition-all w-full cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-cream-50/80 backdrop-blur-md border-b border-cream-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-ink-600 hover:text-ink-900 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Elegant Date Selector Dropdown wrapped in Suspense */}
            <Suspense fallback={
              <div className="flex items-center gap-2 bg-white border border-[#E6E1DA] rounded-xl px-4 py-2 shadow-sm text-sm text-[#5A5348] font-medium w-36 h-9 animate-pulse" />
            }>
              <DateSelectorDropdown />
            </Suspense>

            {/* Elegant Live Clock */}
            {mounted && (
              <div className="hidden sm:flex items-center gap-2 bg-white border border-[#E6E1DA] rounded-xl px-4 py-2 shadow-sm text-sm text-[#5A5348] font-medium animate-fade-in">
                <Clock className="w-4.5 h-4.5 text-[#8C8375] animate-pulse" />
                <span className="tabular-nums font-semibold">{formattedTime}</span>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            {/* Elegant Profile Selector Dropdown Toggle Button */}
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={cn(
                "w-10 h-10 rounded-full bg-white border border-[#E6E1DA] hover:border-[#B88A52]/30 hover:bg-[#FAF7F2] flex items-center justify-center text-[#8C8375] hover:text-[#B88A52] shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B88A52]/20 cursor-pointer",
                profileOpen && "bg-[#FAF4EB] border-[#B88A52]/50 text-[#B88A52]"
              )}
              aria-label="Toggle profile menu"
            >
              <User className="w-5.5 h-5.5" />
            </button>

            {/* Dropdown Menu Overlay */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#EAE6DF] shadow-xl rounded-2xl z-50 p-4 animate-fade-in">
                {/* Top Section */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FAF4EB] border border-[#B88A52]/10 flex items-center justify-center flex-shrink-0 text-xl font-bold text-[#B88A52] font-heading">
                    {userName === 'Owner' ? 'V' : userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <h4 className="font-heading font-bold text-ink-900 text-base leading-tight">
                      {userName === 'Owner' ? 'Virat Kohli' : userName}
                    </h4>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#F3EFEA] my-4" />

                {/* Profile Item Row */}
                <Link
                  href="/dashboard/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-start p-2.5 rounded-xl hover:bg-[#FAF7F2] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-[#8C8375] group-hover:bg-white group-hover:text-[#B88A52] transition-colors flex-shrink-0 mr-3">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-semibold text-ink-900 text-sm leading-snug group-hover:text-[#B88A52] transition-colors">
                      Profile
                    </h5>
                    <p className="text-xs text-[#8C8375] mt-0.5 leading-relaxed">
                      View and manage your profile
                    </p>
                  </div>
                </Link>

              </div>
            )}
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
