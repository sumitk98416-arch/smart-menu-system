'use client';

import { useState } from 'react';
import { Clock, ChevronRight, Package } from 'lucide-react';
import { getDemoOrdersWithItems, demoTables, demoSessions } from '@/lib/demo-data';
import { Order, OrderItem } from '@/lib/types';
import { formatCurrency, timeAgo, cn } from '@/lib/utils';
import { ORDER_STATUSES, ORDER_STATUS_FLOW } from '@/lib/constants';

export default function OrdersPage() {
  const [orders, setOrders] = useState(getDemoOrdersWithItems());
  const [filter, setFilter] = useState<string>('all');

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

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

  const getCustomerName = (sessionId: string) => {
    const session = demoSessions.find(s => s.id === sessionId);
    return session?.customer_name || 'Guest';
  };

  const statusCounts = {
    all: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    served: orders.filter(o => o.status === 'served').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold text-ink-900">Live Orders</h1>
        <p className="text-ink-500 mt-1">Manage and track all incoming orders in real-time</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'new', 'accepted', 'preparing', 'ready', 'served'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              filter === status
                ? 'bg-gold-500 text-white'
                : 'bg-cream-100 text-ink-600 hover:bg-cream-200 border border-cream-200'
            )}
          >
            {status === 'all' ? 'All' : ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({statusCounts[status as keyof typeof statusCounts] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-4 stagger-children">
        {filteredOrders.map((order) => {
          const nextStatuses = ORDER_STATUS_FLOW[order.status] || [];
          return (
            <div key={order.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-gold-600 font-heading">#{order.order_number}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink-900">Table {getTableNumber(order.session_id)}</h3>
                      <span className="text-sm text-ink-400">•</span>
                      <span className="text-sm text-ink-500">{getCustomerName(order.session_id)}</span>
                    </div>
                    <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {timeAgo(order.created_at)}
                    </p>
                  </div>
                </div>
                <span className={`badge status-${order.status}`}>
                  {ORDER_STATUSES[order.status]?.icon} {ORDER_STATUSES[order.status]?.label}
                </span>
              </div>

              {/* Items */}
              <div className="bg-cream-50 rounded-xl p-3 mb-4">
                <div className="space-y-2">
                  {order.order_items.map((item: OrderItem) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-gold-500/10 rounded-lg flex items-center justify-center text-xs font-semibold text-gold-600">
                          {item.quantity}
                        </span>
                        <span className="text-ink-800">{item.name}</span>
                        {item.special_instructions && (
                          <span className="text-xs text-ink-400 italic">({item.special_instructions})</span>
                        )}
                      </div>
                      <span className="text-ink-600 font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                {order.notes && (
                  <p className="mt-2 text-xs text-ink-400 italic border-t border-cream-200 pt-2">
                    📝 {order.notes}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg font-bold text-ink-900">
                  {formatCurrency(order.total_amount)}
                </span>
                <div className="flex items-center gap-2">
                  {nextStatuses.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => updateOrderStatus(order.id, nextStatus)}
                      className={cn(
                        'text-sm font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-1',
                        nextStatus === 'cancelled'
                          ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                          : 'btn-primary'
                      )}
                    >
                      {ORDER_STATUSES[nextStatus as keyof typeof ORDER_STATUSES]?.icon}{' '}
                      {ORDER_STATUSES[nextStatus as keyof typeof ORDER_STATUSES]?.label}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-16 card">
          <Package className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 font-medium">No orders match this filter</p>
        </div>
      )}
    </div>
  );
}
