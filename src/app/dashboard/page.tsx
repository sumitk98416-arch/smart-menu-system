'use client';

import { ClipboardList, DollarSign, Users, TrendingUp, ArrowUpRight, Clock } from 'lucide-react';
import { demoOrders, demoReviews, demoTables, demoSessions, getDemoOrdersWithItems } from '@/lib/demo-data';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { ORDER_STATUSES } from '@/lib/constants';

export default function DashboardOverview() {
  const ordersWithItems = getDemoOrdersWithItems();
  const totalRevenue = demoOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const activeTables = demoSessions.filter(s => s.status === 'active').length;
  const avgRating = demoReviews.reduce((sum, r) => sum + r.rating, 0) / demoReviews.length;
  const pendingOrders = demoOrders.filter(o => ['new', 'accepted', 'preparing'].includes(o.status)).length;

  const stats = [
    { label: "Today's Orders", value: demoOrders.length.toString(), icon: ClipboardList, change: '+12%', color: 'text-gold-500 bg-gold-500/10' },
    { label: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, change: '+8%', color: 'text-sage-600 bg-sage-400/10' },
    { label: 'Active Tables', value: `${activeTables}/${demoTables.length}`, icon: Users, change: '', color: 'text-ink-600 bg-ink-500/10' },
    { label: 'Avg Rating', value: avgRating.toFixed(1), icon: TrendingUp, change: '+0.2', color: 'text-gold-600 bg-gold-400/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
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
                {stat.change && (
                  <span className="text-xs font-semibold text-sage-600 bg-sage-400/15 px-2 py-1 rounded-full flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    {stat.change}
                  </span>
                )}
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
              {ordersWithItems.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-bold text-gold-600">#{order.order_number}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {order.order_items.map(i => i.name).join(', ')}
                      </p>
                      <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {timeAgo(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge status-${order.status}`}>
                      {ORDER_STATUSES[order.status]?.label}
                    </span>
                    <span className="text-sm font-semibold text-ink-900">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending actions */}
        <div>
          <div className="card">
            <h2 className="font-heading text-xl font-semibold text-ink-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-xl">
                <p className="text-sm font-semibold text-amber-800">{pendingOrders} Pending Orders</p>
                <p className="text-xs text-amber-600 mt-0.5">Require attention</p>
              </div>
              <a href="/dashboard/kitchen" className="block p-3 bg-cream-50 border border-cream-200/50 rounded-xl hover:bg-white transition-colors">
                <p className="text-sm font-semibold text-ink-900">🍳 Kitchen Display</p>
                <p className="text-xs text-ink-400 mt-0.5">Full-screen kitchen view</p>
              </a>
              <a href="/dashboard/tables" className="block p-3 bg-cream-50 border border-cream-200/50 rounded-xl hover:bg-white transition-colors">
                <p className="text-sm font-semibold text-ink-900">📱 Generate QR</p>
                <p className="text-xs text-ink-400 mt-0.5">Create table QR codes</p>
              </a>
              <a href="/dashboard/reviews" className="block p-3 bg-cream-50 border border-cream-200/50 rounded-xl hover:bg-white transition-colors">
                <p className="text-sm font-semibold text-ink-900">⭐ {demoReviews.length} New Reviews</p>
                <p className="text-xs text-ink-400 mt-0.5">Read customer feedback</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
