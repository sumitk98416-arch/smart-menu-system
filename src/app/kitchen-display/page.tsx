'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  ChefHat,
  Bell,
  FileText,
  Maximize2,
  Minimize2,
  UtensilsCrossed,
  WifiOff,
  LogOut,
} from 'lucide-react';
import { loadDemoOrders, demoTables, demoSessions } from '@/lib/demo-data';
import { Order, OrderItem } from '@/lib/types';
import { timeAgo, cn } from '@/lib/utils';
import { ORDER_STATUS_FLOW } from '@/lib/constants';

/* ─── Status config ─── */
const STATUS_META = {
  new: {
    label: 'New Orders',
    color: 'text-amber-300 bg-amber-950/60 border-amber-700/50',
    headerBg: 'bg-amber-500',
    dotClass: 'bg-amber-400',
    cardBorder: 'border-amber-700/40',
    badgeBg: 'bg-amber-900/60 text-amber-300',
    btnClass: 'bg-blue-600 hover:bg-blue-500',
    icon: ClipboardList,
  },
  accepted: {
    label: 'Accepted',
    color: 'text-blue-300 bg-blue-950/60 border-blue-700/50',
    headerBg: 'bg-blue-600',
    dotClass: 'bg-blue-400',
    cardBorder: 'border-blue-700/40',
    badgeBg: 'bg-blue-900/60 text-blue-300',
    btnClass: 'bg-orange-500 hover:bg-orange-400',
    icon: CheckCircle2,
  },
  preparing: {
    label: 'Preparing',
    color: 'text-orange-300 bg-orange-950/60 border-orange-700/50',
    headerBg: 'bg-orange-500',
    dotClass: 'bg-orange-400 animate-pulse',
    cardBorder: 'border-orange-700/40',
    badgeBg: 'bg-orange-900/60 text-orange-300',
    btnClass: 'bg-emerald-600 hover:bg-emerald-500',
    icon: ChefHat,
  },
  ready: {
    label: 'Ready to Serve',
    color: 'text-emerald-300 bg-emerald-950/60 border-emerald-700/50',
    headerBg: 'bg-emerald-600',
    dotClass: 'bg-emerald-400 animate-ping',
    cardBorder: 'border-emerald-700/40',
    badgeBg: 'bg-emerald-900/60 text-emerald-300',
    btnClass: 'bg-gray-600 hover:bg-gray-500',
    icon: Bell,
  },
} as const;

const STATUS_COLUMNS: Array<{ status: keyof typeof STATUS_META }> = [
  { status: 'new' },
  { status: 'accepted' },
  { status: 'preparing' },
  { status: 'ready' },
];

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [tick, setTick] = useState(0);

  const activeOrders = orders.filter(o => !['served', 'cancelled'].includes(o.status));

  // Load orders initially and sync from localStorage
  useEffect(() => {
    setOrders(loadDemoOrders());
  }, [tick]);

  // Listen for storage events (updates from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'qrestro_demo_orders' && e.newValue) {
        setOrders(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /* ─── Clock ─── */
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDate(now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  /* ─── Auto-refresh orders every 15s (simulated) ─── */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  /* ─── Fullscreen listener ─── */
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    const nextOrders = orders.map(o =>
      o.id === orderId
        ? { ...o, status: newStatus as Order['status'], updated_at: new Date().toISOString() }
        : o
    );
    setOrders(nextOrders);
    localStorage.setItem('qrestro_demo_orders', JSON.stringify(nextOrders));
  };

  const getTableNumber = (sessionId: string) => {
    const session = demoSessions.find(s => s.id === sessionId);
    if (!session) return '?';
    const table = demoTables.find(t => t.id === session.table_id);
    return table?.table_number ?? '?';
  };

  const handleSignOut = () => {
    document.cookie = 'qrestro_demo=;path=/;max-age=0';
    document.cookie = 'qrestro_demo_name=;path=/;max-age=0';
    document.cookie = 'qrestro_demo_email=;path=/;max-age=0';
    document.cookie = 'qrestro_demo_password=;path=/;max-age=0';
    try {
      localStorage.removeItem('qrestro_demo_restaurant');
      localStorage.removeItem('qrestro_demo_fresh_signup');
    } catch { }
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col select-none">

      {/* ── Top Bar ── */}
      <header className="flex-none bg-[#111114] border-b border-white/[0.06] px-6 py-3 flex items-center justify-between gap-4">

        {/* Left: Brand + Active count */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">Kitchen Display</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-none">QRestro KDS</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-300">{activeOrders.length} Active</span>
          </div>
        </div>

        {/* Center: Clock */}
        <div className="text-center hidden md:block">
          <p className="text-2xl font-black text-white tabular-nums tracking-tight leading-none">{currentTime}</p>
          <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{currentDate}</p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Status legend */}
          <div className="hidden lg:flex items-center gap-3 mr-2">
            {STATUS_COLUMNS.map(({ status }) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', STATUS_META[status].dotClass.replace('animate-ping', 'animate-pulse'))} />
                <span className="text-[10px] text-gray-400 font-medium">{STATUS_META[status].label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-xl px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Kanban Board ── */}
      <main className="flex-1 p-4 md:p-5 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 h-full min-h-[calc(100vh-76px)]">
          {STATUS_COLUMNS.map(({ status }) => {
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            const columnOrders = activeOrders.filter(o => o.status === status);

            return (
              <div
                key={status}
                className={cn(
                  'flex flex-col rounded-2xl border bg-white/[0.02]',
                  meta.color
                )}
              >
                {/* Column header */}
                <div className={cn('flex items-center justify-between px-4 py-3 rounded-t-2xl', meta.headerBg)}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-white" />
                    <span className="font-black text-sm uppercase tracking-wider text-white">{meta.label}</span>
                  </div>
                  <span className="bg-white/20 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Orders */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {columnOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 border border-dashed border-white/[0.08] rounded-xl">
                      <UtensilsCrossed className="w-6 h-6 text-white/10 mb-2" />
                      <p className="text-white/20 text-xs font-bold uppercase tracking-wider">No Orders</p>
                    </div>
                  )}

                  {columnOrders.map((order) => {
                    const nextStatuses = ORDER_STATUS_FLOW[order.status]?.filter(s => s !== 'cancelled') || [];
                    const nextStatus = nextStatuses[0];
                    const nextMeta = nextStatus ? STATUS_META[nextStatus as keyof typeof STATUS_META] : null;
                    const tableNum = getTableNumber(order.session_id);
                    const totalItems = order.order_items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0);

                    return (
                      <div
                        key={order.id}
                        className={cn(
                          'bg-[#16161A] border rounded-xl overflow-hidden transition-all duration-300 hover:border-white/20 group',
                          meta.cardBorder,
                          status === 'ready' && 'ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-900/20'
                        )}
                      >
                        {/* Status stripe */}
                        <div className={cn('h-1', meta.headerBg)} />

                        <div className="p-4">
                          {/* Order header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="font-black text-xl text-white leading-none">#{order.order_number}</span>
                              <div className="flex flex-col gap-0.5">
                                <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', meta.badgeBg)}>
                                  TABLE {tableNum}
                                </span>
                                <span className="text-[9px] text-gray-500 font-medium px-1">{totalItems} items</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold tabular-nums">{timeAgo(order.created_at)}</span>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="space-y-1.5 mb-3 bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
                            {order.order_items.map((item: OrderItem) => (
                              <div key={item.id} className="flex items-center gap-2.5">
                                <span className="w-6 h-6 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center justify-center text-[10px] font-black text-amber-400 flex-shrink-0">
                                  {item.quantity}
                                </span>
                                <span className="text-sm font-semibold text-gray-200 leading-snug">{item.name}</span>
                              </div>
                            ))}
                          </div>

                          {/* Notes */}
                          {order.notes && (
                            <div className="flex items-start gap-1.5 text-xs text-amber-300 bg-amber-950/50 border border-amber-800/40 rounded-lg px-2.5 py-2 mb-3">
                              <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                              <p className="italic leading-relaxed">{order.notes}</p>
                            </div>
                          )}

                          {/* Action button */}
                          {nextStatus && nextMeta && (
                            <button
                              onClick={() => updateOrderStatus(order.id, nextStatus)}
                              className={cn(
                                'w-full text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-white',
                                meta.btnClass
                              )}
                            >
                              Mark as {nextMeta.label}
                              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          )}

                          {status === 'ready' && (
                            <div className="text-center text-[10px] text-emerald-400 font-bold mt-2 animate-pulse">
                              ✓ Ready to serve — notify waiter
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Footer status bar ── */}
      <footer className="flex-none bg-[#111114] border-t border-white/[0.06] px-6 py-2 flex items-center justify-between text-[10px] text-gray-600 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>System Online · Auto-refreshes every 15s</span>
        </div>
        <div className="flex items-center gap-1.5">
          <WifiOff className="w-3 h-3 text-gray-700" />
          <span>Connect to Supabase for live real-time updates</span>
        </div>
        <span>QRestro KDS v1.0</span>
      </footer>
    </div>
  );
}
