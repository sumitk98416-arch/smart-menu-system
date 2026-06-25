'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  ClipboardList, 
  CheckCircle2, 
  ChefHat, 
  Bell, 
  FileText,
  ExternalLink,
  Monitor
} from 'lucide-react';
import { loadDemoOrders, demoTables, demoSessions } from '@/lib/demo-data';
import { Order, OrderItem } from '@/lib/types';
import { timeAgo, cn } from '@/lib/utils';
import { ORDER_STATUS_FLOW } from '@/lib/constants';

const STATUS_META = {
  new: { 
    label: 'New', 
    color: 'text-amber-600 bg-amber-50 border-amber-250/60', 
    icon: ClipboardList, 
    badgeClass: 'bg-amber-100 text-amber-800',
    dotClass: 'bg-amber-500'
  },
  accepted: { 
    label: 'Accepted', 
    color: 'text-blue-600 bg-blue-50 border-blue-250/60', 
    icon: CheckCircle2, 
    badgeClass: 'bg-blue-100 text-blue-800',
    dotClass: 'bg-blue-500'
  },
  preparing: { 
    label: 'Preparing', 
    color: 'text-orange-600 bg-orange-50 border-orange-250/60', 
    icon: ChefHat, 
    badgeClass: 'bg-orange-100 text-orange-800',
    dotClass: 'bg-orange-500'
  },
  ready: { 
    label: 'Ready', 
    color: 'text-emerald-600 bg-emerald-50 border-emerald-250/60', 
    icon: Bell, 
    badgeClass: 'bg-emerald-100 text-emerald-800',
    dotClass: 'bg-emerald-500'
  },
} as const;

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeOrders = orders.filter(o => !['served', 'cancelled'].includes(o.status));

  // Load orders initially and sync from localStorage
  useEffect(() => {
    setOrders(loadDemoOrders());
  }, []);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    const nextOrders = orders.map(o =>
      o.id === orderId ? { ...o, status: newStatus as Order['status'], updated_at: new Date().toISOString() } : o
    );
    setOrders(nextOrders);
    localStorage.setItem('qrestro_demo_orders', JSON.stringify(nextOrders));
  };

  const getTableNumber = (sessionId: string) => {
    const session = demoSessions.find(s => s.id === sessionId);
    if (!session) return '?';
    const table = demoTables.find(t => t.id === session.table_id);
    return table?.table_number || '?';
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('kitchen-display-container');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const statusColumns: Array<{ status: 'new' | 'accepted' | 'preparing' | 'ready' }> = [
    { status: 'new' },
    { status: 'accepted' },
    { status: 'preparing' },
    { status: 'ready' },
  ];

  return (
    <div 
      id="kitchen-display-container"
      className={cn(
        "space-y-6 animate-simple-fade transition-all duration-300",
        isFullscreen ? "p-8 bg-cream-50 overflow-y-auto h-screen w-screen" : ""
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-cream-50/40 p-4 rounded-2xl border border-cream-200/50">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-900 flex items-center gap-2.5">
            <ChefHat className="w-8 h-8 text-gold-500" />
            Kitchen Display
          </h1>
          <p className="text-ink-500 text-sm mt-0.5 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
            {activeOrders.length} active orders in production
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen} 
            className="btn-secondary flex items-center gap-2 border-cream-250 bg-white hover:bg-cream-50 text-ink-700 hover:text-ink-950 font-bold px-4 py-2.5 rounded-xl shadow-sm text-xs transition-all duration-300"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Kitchen Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {statusColumns.map(({ status }) => {
          const meta = STATUS_META[status];
          const ColumnIcon = meta.icon;
          const columnOrders = activeOrders.filter(o => o.status === status);
          
          return (
            <div key={status} className="space-y-4 bg-cream-50/30 border border-cream-200/40 p-3 rounded-2xl min-h-[580px]">
              {/* Header column */}
              <div className={cn(
                'rounded-xl px-3.5 py-3 border flex items-center justify-between shadow-sm transition-all',
                meta.color
              )}>
                <div className="flex items-center gap-2">
                  <ColumnIcon className="w-4 h-4" />
                  <span className="font-bold text-sm uppercase tracking-wider">{meta.label}</span>
                </div>
                <span className="font-bold text-xs bg-white/70 px-2 py-0.5 rounded-full border border-black/5">
                  {columnOrders.length}
                </span>
              </div>

              {/* Column orders stack */}
              <div className="space-y-3">
                {columnOrders.map((order) => {
                  const nextStatuses = ORDER_STATUS_FLOW[order.status]?.filter(s => s !== 'cancelled') || [];
                  const nextStatus = nextStatuses[0];
                  const nextMeta = nextStatus ? STATUS_META[nextStatus as keyof typeof STATUS_META] : null;

                  return (
                    <div 
                      key={order.id} 
                      className="card bg-white border border-cream-200 p-4.5 rounded-xl hover:border-gold-300 hover:shadow-md transition-all duration-300 relative overflow-hidden animate-scale-in group"
                    >
                      {/* Vertical line indicator */}
                      <div className={cn('absolute left-0 top-0 bottom-0 w-1', meta.dotClass)} />

                      <div className="flex items-center justify-between mb-3.5 pl-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-base font-black text-ink-950">#{order.order_number}</span>
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cream-100 text-ink-800 border border-cream-200/50">
                            Table {getTableNumber(order.session_id)}
                          </span>
                        </div>
                        <span className="text-[10px] text-ink-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-ink-300" />
                          {timeAgo(order.created_at)}
                        </span>
                      </div>

                      {/* Items list */}
                      <div className="space-y-2 mb-4 pl-1.5">
                        {order.order_items.map((item: OrderItem) => (
                          <div key={item.id} className="flex items-start gap-2.5 text-xs">
                            <span className="w-5.5 h-5.5 bg-gold-500/10 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-gold-600 flex-shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="font-semibold text-ink-800 mt-0.5">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50/50 border border-amber-100 rounded-lg px-2.5 py-2 mb-4 pl-2">
                          <FileText className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="font-medium leading-relaxed italic">{order.notes}</p>
                        </div>
                      )}

                      {/* Action button */}
                      {nextStatus && nextMeta && (
                        <button
                          onClick={() => updateOrderStatus(order.id, nextStatus)}
                          className={cn(
                            'w-full text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-sm text-white',
                            nextStatus === 'ready' 
                              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                              : nextStatus === 'preparing'
                              ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
                              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                          )}
                        >
                          Mark as {nextMeta.label}
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {columnOrders.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-cream-200/60 rounded-xl bg-white/40">
                    <p className="text-ink-300 text-xs font-bold uppercase tracking-wider">No Orders</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
