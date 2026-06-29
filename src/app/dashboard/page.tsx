'use client';

import { Suspense, useState, useEffect } from 'react';
import { ClipboardList, DollarSign, Users, TrendingUp, Clock, Bell, Monitor, QrCode, FileText, Star, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { demoReviews, demoTables, demoSessions, loadDemoOrders } from '@/lib/demo-data';
import { formatCurrency, timeAgo, getLocalDateString } from '@/lib/utils';
import { ORDER_STATUSES } from '@/lib/constants';

const getYesterdayDateString = () => {
  return getLocalDateString(new Date(Date.now() - 86400000));
};

function DashboardOverviewContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isFresh, setIsFresh] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fresh = localStorage.getItem('qrestro_demo_fresh_signup') === 'true';
    setIsFresh(fresh);
    
    // Load orders
    setOrders(loadDemoOrders());

    // Load reviews
    const savedReviews = localStorage.getItem('qrestro_reviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    } else {
      setReviews(fresh ? [] : demoReviews);
    }

    // Load tables
    const savedTables = localStorage.getItem('qrestro_demo_tables');
    if (savedTables) {
      setTables(JSON.parse(savedTables));
    } else {
      setTables(demoTables);
    }

    // Load sessions
    setSessions(demoSessions);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-cream-100 rounded-xl" />
        <div className="h-6 w-96 bg-cream-100 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-cream-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Determine selected date state
  const isToday = !dateParam || dateParam === getLocalDateString();
  const isYesterday = dateParam === getYesterdayDateString();
  const selectedDateStr = dateParam || getLocalDateString();

  // Initialize variables
  let ordersCount = "0";
  let revenueValue = 0;
  let activeTablesCount = `0/${tables.length}`;
  let ratingValue: string | number = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : "N/A";
  let pendingOrders = 0;
  let displayedOrders: any[] = [];

  const formatOrderItems = (orderItems: any[]) => {
    if (!orderItems || orderItems.length === 0) return 'No items';
    return orderItems.map(item => item.quantity > 1 ? `${item.name} (${item.quantity})` : item.name).join(', ');
  };

  if (isFresh) {
    // Fresh signup: calculate everything dynamically from actual localStorage data
    const dateOrders = orders.filter(o => {
      try {
        return getLocalDateString(new Date(o.created_at)) === selectedDateStr;
      } catch {
        return false;
      }
    });

    ordersCount = dateOrders.length.toString();
    revenueValue = dateOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_amount, 0);

    activeTablesCount = isToday 
      ? `${sessions.filter(s => s.status === 'active').length}/${tables.length}`
      : `0/${tables.length}`;

    pendingOrders = dateOrders.filter(o => ['new', 'accepted', 'preparing', 'ready'].includes(o.status)).length;

    displayedOrders = [...dateOrders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        order_number: order.order_number,
        items: formatOrderItems(order.order_items),
        status: order.status,
        time: timeAgo(order.created_at)
      }));
  } else {
    // Normal Demo Mode: if selected date is today, show dynamic; otherwise show mock historical data
    if (isToday) {
      const dateOrders = orders.filter(o => {
        try {
          return getLocalDateString(new Date(o.created_at)) === selectedDateStr;
        } catch {
          return false;
        }
      });

      ordersCount = dateOrders.length.toString();
      revenueValue = dateOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0);

      activeTablesCount = `${sessions.filter(s => s.status === 'active').length}/${tables.length}`;

      pendingOrders = dateOrders.filter(o => ['new', 'accepted', 'preparing', 'ready'].includes(o.status)).length;

      displayedOrders = [...dateOrders]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          order_number: order.order_number,
          items: formatOrderItems(order.order_items),
          status: order.status,
          time: timeAgo(order.created_at)
        }));
    } else if (isYesterday) {
      ordersCount = "12";
      revenueValue = 8460;
      activeTablesCount = `0/${tables.length}`;
      ratingValue = 4.8;
      pendingOrders = 0;
      displayedOrders = [
        {
          id: 'order-yesterday-1',
          order_number: 99,
          items: "Paneer Butter Masala, Garlic Naan, Mango Lassi",
          status: "served",
          time: "Yesterday, 8:30 PM"
        },
        {
          id: 'order-yesterday-2',
          order_number: 98,
          items: "Chicken Seekh Kebab, Butter Naan, Gulab Jamun",
          status: "served",
          time: "Yesterday, 7:15 PM"
        },
        {
          id: 'order-yesterday-3',
          order_number: 97,
          items: "Truffle Mushroom Soup, Fresh Lime Soda",
          status: "served",
          time: "Yesterday, 6:40 PM"
        }
      ];
    } else {
      // General historical date
      ordersCount = "8";
      revenueValue = 4890;
      activeTablesCount = `0/${tables.length}`;
      ratingValue = 4.6;
      pendingOrders = 0;
      displayedOrders = [
        {
          id: 'order-past-1',
          order_number: 90,
          items: "Dal Makhani, Laccha Paratha",
          status: "served",
          time: "Served"
        },
        {
          id: 'order-past-2',
          order_number: 89,
          items: "Crispy Corn, Mango Lassi",
          status: "served",
          time: "Served"
        },
        {
          id: 'order-past-3',
          order_number: 88,
          items: "Paneer Tikka, Butter Naan",
          status: "served",
          time: "Served"
        }
      ];
    }
  }

  const stats = [
    { label: "Today's Orders", value: ordersCount, icon: ClipboardList, color: 'text-gold-500 bg-gold-500/10' },
    { label: 'Revenue', value: formatCurrency(revenueValue), icon: DollarSign, color: 'text-sage-600 bg-sage-400/10' },
    { label: 'Active Tables', value: activeTablesCount, icon: Users, color: 'text-ink-600 bg-ink-500/10' },
    { label: 'Avg Rating', value: typeof ratingValue === 'number' ? ratingValue.toFixed(1) : ratingValue, icon: TrendingUp, color: 'text-gold-600 bg-gold-400/10' },
  ];

  return (
    <div className="space-y-8 animate-simple-fade">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-ink-900">Dashboard</h1>
        <p className="text-ink-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card bg-cream-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="font-heading text-2xl font-bold text-ink-900">{stat.value}</p>
              <p className="text-sm text-ink-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent orders + Pending section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-semibold text-ink-900">Recent Orders</h2>
              <a href="/dashboard/orders" className="text-sm text-gold-500 font-medium hover:text-gold-600 transition-colors">
                View all →
              </a>
            </div>
            <div className="space-y-3">
              {displayedOrders.length > 0 ? (
                displayedOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-bold text-gold-600">#{order.order_number}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-900">
                          {order.items}
                        </p>
                        <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {order.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge status-${order.status}`}>
                        {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-cream-50/50 rounded-xl border border-dashed border-cream-200">
                  <ClipboardList className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                  <p className="text-ink-500 text-xs font-semibold">No orders received on this date yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending actions */}
        <div>
          <div className="card">
            <h2 className="font-heading text-xl font-semibold text-ink-900 mb-4">Quick Actions</h2>
            <div className="space-y-3.5">
              {/* Pending Orders */}
              <a href="/dashboard/orders" className="flex items-center justify-between p-3.5 bg-cream-50 border border-cream-200 rounded-2xl hover:bg-white hover:translate-x-1 hover:shadow-sm transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold-50 rounded-xl text-gold-600 group-hover:scale-105 transition-transform duration-300">
                    <Bell className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900 font-heading">{pendingOrders} Pending Orders</p>
                    <p className="text-xs text-ink-500 font-medium mt-0.5">Need attention</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-400 opacity-70 group-hover:opacity-100 group-hover:text-ink-700 group-hover:translate-x-0.5 transition-all duration-300" />
              </a>

              {/* Kitchen Display */}
              <a href="/dashboard/kitchen" className="flex items-center justify-between p-3.5 bg-cream-50 border border-cream-200 rounded-2xl hover:bg-white hover:translate-x-1 hover:shadow-sm transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold-50 rounded-xl text-gold-600 group-hover:scale-105 transition-transform duration-300">
                    <Monitor className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900 font-heading">Kitchen Display</p>
                    <p className="text-xs text-ink-500 font-medium mt-0.5">View live kitchen screen</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-400 opacity-70 group-hover:opacity-100 group-hover:text-ink-700 group-hover:translate-x-0.5 transition-all duration-300" />
              </a>

              {/* Generate QR */}
              <a href="/dashboard/tables" className="flex items-center justify-between p-3.5 bg-cream-50 border border-cream-200 rounded-2xl hover:bg-white hover:translate-x-1 hover:shadow-sm transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold-50 rounded-xl text-gold-600 group-hover:scale-105 transition-transform duration-300">
                    <QrCode className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900 font-heading">Generate QR</p>
                    <p className="text-xs text-ink-500 font-medium mt-0.5">Create table QR codes</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-400 opacity-70 group-hover:opacity-100 group-hover:text-ink-700 group-hover:translate-x-0.5 transition-all duration-300" />
              </a>

              {/* Reports */}
              <a href="/dashboard" className="flex items-center justify-between p-3.5 bg-cream-50 border border-cream-200 rounded-2xl hover:bg-white hover:translate-x-1 hover:shadow-sm transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold-50 rounded-xl text-gold-600 group-hover:scale-105 transition-transform duration-300">
                    <FileText className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900 font-heading">Reports</p>
                    <p className="text-xs text-ink-500 font-medium mt-0.5">View sales and analytics</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-400 opacity-70 group-hover:opacity-100 group-hover:text-ink-700 group-hover:translate-x-0.5 transition-all duration-300" />
              </a>

              {/* New Reviews */}
              <a href="/dashboard/reviews" className="flex items-center justify-between p-3.5 bg-cream-50 border border-cream-200 rounded-2xl hover:bg-white hover:translate-x-1 hover:shadow-sm transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold-50 rounded-xl text-gold-600 group-hover:scale-105 transition-transform duration-300">
                    <Star className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900 font-heading">{reviews.length} New Reviews</p>
                    <p className="text-xs text-ink-500 font-medium mt-0.5">Read customer feedback</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-400 opacity-70 group-hover:opacity-100 group-hover:text-ink-700 group-hover:translate-x-0.5 transition-all duration-300" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  return (
    <Suspense fallback={
      <div className="space-y-8 animate-pulse p-6">
        <div className="h-10 w-48 bg-cream-100 rounded-xl" />
        <div className="h-6 w-96 bg-cream-100 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-cream-100 rounded-2xl" />
          ))}
        </div>
      </div>
    }>
      <DashboardOverviewContent />
    </Suspense>
  );
}
