'use client';

import { useState } from 'react';
import { Clock, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { getDemoOrdersWithItems, demoTables, demoSessions } from '@/lib/demo-data';
import { Order, OrderItem } from '@/lib/types';
import { timeAgo, cn } from '@/lib/utils';
import { ORDER_STATUSES, ORDER_STATUS_FLOW } from '@/lib/constants';

export default function KitchenPage() {
  const [orders, setOrders] = useState(getDemoOrdersWithItems());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeOrders = orders.filter(o => !['served', 'cancelled'].includes(o.status));

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map(o =>
      o.id === orderId ? { ...o, status: newStatus as Order['status'], updated_at: new Date().toISOString() } : o
    ));
  };

  const getTableNumber = (sessionId: string) => {
    const session = demoSessions.find(s => s.id === sessionId);
    if (!session) return '?';
    const table = demoTables.find(t => t.id === session.table_id);
    return table?.table_number || '?';
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const statusColumns = [
    { status: 'new', label: '🆕 New', bgClass: 'border-amber-300' },
    { status: 'accepted', label: '✅ Accepted', bgClass: 'border-blue-300' },
    { status: 'preparing', label: '👨‍🍳 Preparing', bgClass: 'border-orange-300' },
    { status: 'ready', label: '🔔 Ready', bgClass: 'border-green-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-900">Kitchen Display</h1>
          <p className="text-ink-500 mt-1">{activeOrders.length} active orders</p>
        </div>
        <button onClick={toggleFullscreen} className="btn-secondary">
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {/* Kitchen Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statusColumns.map(({ status, label, bgClass }) => {
          const columnOrders = activeOrders.filter(o => o.status === status);
          return (
            <div key={status} className="space-y-3">
              <div className={cn('rounded-xl px-4 py-2.5 border-2 bg-cream-100', bgClass)}>
                <h3 className="font-semibold text-ink-900 text-sm">
                  {label}
                  <span className="ml-2 text-ink-400">({columnOrders.length})</span>
                </h3>
              </div>
              <div className="space-y-3">
                {columnOrders.map((order) => {
                  const nextStatuses = ORDER_STATUS_FLOW[order.status]?.filter(s => s !== 'cancelled') || [];
                  return (
                    <div key={order.id} className="card bg-white border-cream-200 animate-fade-in">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-lg font-bold text-gold-600">#{order.order_number}</span>
                          <span className="badge badge-gold text-xs">Table {getTableNumber(order.session_id)}</span>
                        </div>
                        <span className="text-xs text-ink-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(order.created_at)}
                        </span>
                      </div>

                      {/* Items list */}
                      <div className="space-y-1.5 mb-3">
                        {order.order_items.map((item: OrderItem) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <span className="w-6 h-6 bg-gold-500/10 rounded-lg flex items-center justify-center text-xs font-bold text-gold-600">
                              {item.quantity}
                            </span>
                            <span className="font-medium text-ink-800">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <p className="text-xs text-ink-400 italic bg-cream-50 rounded-lg px-2 py-1 mb-3">
                          📝 {order.notes}
                        </p>
                      )}

                      {/* Action buttons */}
                      {nextStatuses.length > 0 && (
                        <button
                          onClick={() => updateOrderStatus(order.id, nextStatuses[0])}
                          className="btn-primary w-full text-sm py-2"
                        >
                          {ORDER_STATUSES[nextStatuses[0] as keyof typeof ORDER_STATUSES]?.icon}{' '}
                          Mark as {ORDER_STATUSES[nextStatuses[0] as keyof typeof ORDER_STATUSES]?.label}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {columnOrders.length === 0 && (
                  <div className="text-center py-8 text-ink-300 text-sm">
                    No orders
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
