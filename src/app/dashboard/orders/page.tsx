'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronRight, Package, Printer, CreditCard, Receipt, Search, FileText, Edit2, Plus, Minus, Trash, X, Crown, ChefHat, UtensilsCrossed, CupSoda, Star, Soup, Percent, QrCode, AlertCircle, Check } from 'lucide-react';
import { loadDemoOrders, demoTables, demoSessions, demoRestaurant, saveDemoRestaurantSettings } from '@/lib/demo-data';
import { Order, OrderItem, OrderStatus } from '@/lib/types';
import { formatCurrency, timeAgo, cn } from '@/lib/utils';
import { ORDER_STATUSES, ORDER_STATUS_FLOW } from '@/lib/constants';
import { QRCodeSVG } from 'qrcode.react';

interface ConsolidatedOrder extends Order {
  all_order_numbers: number[];
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<(Order & { order_items: OrderItem[] })[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentQrUrl, setPaymentQrUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('qrestro_demo_restaurant');
        if (saved) {
          const custom = JSON.parse(saved);
          setTimeout(() => {
            if (custom.upi_id) setUpiId(custom.upi_id);
            if (custom.payment_qr_url) setPaymentQrUrl(custom.payment_qr_url);
          }, 0);
        }
      } catch {}
    }
  }, []);

  // Load orders initially and sync from localStorage
  useEffect(() => {
    setTimeout(() => {
      setOrders(loadDemoOrders());
    }, 0);
  }, []);

  // Save back whenever orders change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('qrestro_demo_orders', JSON.stringify(orders));
    }
  }, [orders]);

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

  // Bill tax rates state
  const [cgstRate, setCgstRate] = useState(() => demoRestaurant.settings?.cgst_rate !== undefined ? Number(demoRestaurant.settings.cgst_rate) : 2.5);
  const [sgstRate, setSgstRate] = useState(() => demoRestaurant.settings?.sgst_rate !== undefined ? Number(demoRestaurant.settings.sgst_rate) : 2.5);
  const [serviceChargeRate, setServiceChargeRate] = useState(() => demoRestaurant.settings?.service_charge_rate !== undefined ? Number(demoRestaurant.settings.service_charge_rate) : 0);
  const [serviceChargeType, setServiceChargeType] = useState<'percent' | 'fixed'>(() => (demoRestaurant.settings?.service_charge_type as 'percent' | 'fixed') || 'percent');

  const updateTaxRates = (cgst: number, sgst: number, serviceCharge: number, chargeType: 'percent' | 'fixed') => {
    setCgstRate(cgst);
    setSgstRate(sgst);
    setServiceChargeRate(serviceCharge);
    setServiceChargeType(chargeType);
    saveDemoRestaurantSettings({
      name: demoRestaurant.name,
      description: demoRestaurant.description,
      phone: demoRestaurant.phone,
      address: demoRestaurant.address,
      currency: demoRestaurant.currency,
      email: demoRestaurant.email,
      logo_url: demoRestaurant.logo_url,
      cgst_rate: cgst,
      sgst_rate: sgst,
      service_charge_rate: serviceCharge,
      service_charge_type: chargeType,
    });
  };

  // Bill Editing state
  const [editingBillOrder, setEditingBillOrder] = useState<Order | null>(null);
  const [editingBillItems, setEditingBillItems] = useState<OrderItem[]>([]);
  const [isRoundOff, setIsRoundOff] = useState(true);

  const renderLogo = () => {
    const logoUrl = demoRestaurant.logo_url;
    const className = "w-8 h-8 mx-auto mb-2 text-stone-850";
    if (!logoUrl || logoUrl === 'default' || logoUrl === 'crown') {
      return <Crown className={className} />;
    }
    if (logoUrl === 'chef') {
      return <ChefHat className={className} />;
    }
    if (logoUrl === 'soup') {
      return <Soup className={className} />;
    }
    if (logoUrl === 'cup') {
      return <CupSoda className={className} />;
    }
    if (logoUrl === 'star') {
      return <Star className={className} />;
    }
    return (
      <img
        src={logoUrl}
        className="w-12 h-12 rounded-full object-cover mx-auto mb-2 border border-stone-200"
        alt="Restaurant Logo"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  };

  const handleIncreaseQty = (itemId: string) => {
    setEditingBillItems(editingBillItems.map(item => {
      if (item.id === itemId) {
        const nextQty = item.quantity + 1;
        return {
          ...item,
          quantity: nextQty,
          subtotal: nextQty * item.unit_price
        };
      }
      return item;
    }));
  };

  const handleDecreaseQty = (itemId: string) => {
    setEditingBillItems(editingBillItems.map(item => {
      if (item.id === itemId && item.quantity > 1) {
        const nextQty = item.quantity - 1;
        return {
          ...item,
          quantity: nextQty,
          subtotal: nextQty * item.unit_price
        };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveItem = (itemId: string) => {
    setEditingBillItems(editingBillItems.filter(item => item.id !== itemId));
  };

  const handleSaveBillEdits = () => {
    if (!editingBillOrder) return;
    const sessionId = editingBillOrder.session_id;
    const nextTotal = editingBillItems.reduce((acc, item) => acc + item.subtotal, 0);
    
    // Find all orders of this session
    const sessionOrders = orders.filter(o => o.session_id === sessionId);
    if (sessionOrders.length === 0) return;
    
    // Primary order (the one that will contain all edited items)
    const primaryOrderId = sessionOrders[0].id;
    
    setOrders(orders.map(o => {
      if (o.id === primaryOrderId) {
        return {
          ...o,
          order_items: editingBillItems,
          total_amount: nextTotal,
          updated_at: new Date().toISOString()
        };
      } else if (o.session_id === sessionId) {
        // Clear items and total for subsequent orders in the same session
        return {
          ...o,
          order_items: [],
          total_amount: 0,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));
    setEditingBillOrder(null);
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    const isCheckout = newStatus === 'served';
    if (orderId.startsWith('session-bill-')) {
      const sessionId = orderId.replace('session-bill-', '');
      setOrders(orders.map(o =>
        o.session_id === sessionId 
          ? { 
              ...o, 
              status: newStatus as Order['status'], 
              updated_at: new Date().toISOString(),
              payment_status: isCheckout ? 'paid' : (o.payment_status || 'unpaid')
            } 
          : o
      ));
    } else {
      setOrders(orders.map(o =>
        o.id === orderId 
          ? { 
              ...o, 
              status: newStatus as Order['status'], 
              updated_at: new Date().toISOString(),
              payment_status: isCheckout ? 'paid' : (o.payment_status || 'unpaid')
            } 
          : o
      ));
    }
  };

  const getTableNumber = (sessionId: string) => {
    const session = demoSessions.find(s => s.id === sessionId);
    if (!session) {
      if (sessionId.startsWith('session-table-')) {
        return sessionId.replace('session-table-', '').replace('table-', '');
      }
      return '?';
    }
    const table = demoTables.find(t => t.id === session.table_id);
    return table?.table_number || '?';
  };

  const getCustomerName = (sessionId: string) => {
    const session = demoSessions.find(s => s.id === sessionId);
    if (!session) {
      return 'Guest';
    }
    return session?.customer_name || 'Guest';
  };

  // Consolidate active orders by dining session to maintain a single unified guest bill
  const consolidatedSessionBills = (() => {
    const sessionsMap: Record<string, typeof orders> = {};
    orders.forEach(o => {
      if (!sessionsMap[o.session_id]) {
        sessionsMap[o.session_id] = [];
      }
      sessionsMap[o.session_id].push(o);
    });

    return Object.entries(sessionsMap).map(([sessionId, sessionOrders]) => {
      sessionOrders.sort((a, b) => a.order_number - b.order_number);
      const primaryOrder = sessionOrders[0];

      // Combine all order items, merging quantities of identical menu items
      const combinedItems: OrderItem[] = [];
      sessionOrders.forEach(so => {
        so.order_items.forEach(item => {
          const existing = combinedItems.find(
            ci => ci.menu_item_id === item.menu_item_id && 
            ci.special_instructions === item.special_instructions
          );
          if (existing) {
            existing.quantity += item.quantity;
            existing.subtotal += item.subtotal;
          } else {
            combinedItems.push({ ...item });
          }
        });
      });

      const combinedSubtotal = combinedItems.reduce((acc, item) => acc + item.subtotal, 0);

      // Roll up overall session status based on order completion state
      let consolidatedStatus: OrderStatus = 'served';
      if (sessionOrders.some(so => so.status === 'new')) {
        consolidatedStatus = 'new';
      } else if (sessionOrders.some(so => so.status === 'preparing')) {
        consolidatedStatus = 'preparing';
      } else if (sessionOrders.some(so => so.status === 'ready')) {
        consolidatedStatus = 'ready';
      } else if (sessionOrders.some(so => so.status === 'accepted')) {
        consolidatedStatus = 'accepted';
      } else if (sessionOrders.some(so => so.status === 'cancelled')) {
        consolidatedStatus = 'cancelled';
      }

      const allOrderNumbers = Array.from(new Set(sessionOrders.map(so => so.order_number)));
      const combinedNotes = sessionOrders.map(so => so.notes).filter(Boolean).join(', ');

      const hasPendingPayment = sessionOrders.some(so => so.payment_status === 'pending');
      const isPaid = sessionOrders.every(so => so.payment_status === 'paid') && sessionOrders.length > 0;
      const paymentStatus: Order['payment_status'] = isPaid ? 'paid' : (hasPendingPayment ? 'pending' : 'unpaid');

      return {
        ...primaryOrder,
        id: `session-bill-${sessionId}`,
        session_id: sessionId,
        order_number: primaryOrder.order_number,
        all_order_numbers: allOrderNumbers,
        status: consolidatedStatus,
        total_amount: combinedSubtotal,
        notes: combinedNotes,
        order_items: combinedItems,
        payment_status: paymentStatus,
      };
    });
  })();

  const statusCounts = {
    all: consolidatedSessionBills.length,
    new: consolidatedSessionBills.filter(o => o.status === 'new').length,
    accepted: consolidatedSessionBills.filter(o => o.status === 'accepted').length,
    preparing: consolidatedSessionBills.filter(o => o.status === 'preparing').length,
    ready: consolidatedSessionBills.filter(o => o.status === 'ready').length,
    served: consolidatedSessionBills.filter(o => o.status === 'served').length,
  };

  // Filter and search logic on consolidated session bills
  const filteredOrders = consolidatedSessionBills.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const tableNum = getTableNumber(o.session_id).toLowerCase();
    const guestName = getCustomerName(o.session_id).toLowerCase();
    const orderNum = o.all_order_numbers.join(', ');
    const matchesSearch = 
      tableNum.includes(searchQuery.toLowerCase()) || 
      guestName.includes(searchQuery.toLowerCase()) || 
      orderNum.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const selectedOrder = consolidatedSessionBills.find(o => o.id === selectedOrderId) || filteredOrders[0] || null;

  return (
    <div className="space-y-6 animate-simple-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-900">POS Billing & Orders</h1>
          <p className="text-ink-500 mt-1">Manage guest billing, transactions, and advance order states</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cream-50 p-4 rounded-2xl border border-cream-200/60">
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {['all', 'new', 'accepted', 'preparing', 'ready', 'served'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                filter === status
                  ? 'bg-gold-500 border-gold-600 text-white shadow-sm'
                  : 'bg-white border-cream-200 text-ink-600 hover:bg-cream-100'
              )}
            >
              {status === 'all' ? 'All Bills' : ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.label}
              <span className="ml-1 opacity-75">
                ({statusCounts[status as keyof typeof statusCounts] || 0})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search Table, Guest or Order #"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 text-xs h-10 w-full"
          />
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane: Order Index Ledger */}
        <div className="lg:col-span-7 space-y-3 max-h-[640px] overflow-y-auto pr-1">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className={cn(
                'card border p-4 cursor-pointer transition-all flex items-center justify-between relative overflow-hidden',
                selectedOrderId === order.id
                  ? 'border-gold-400 bg-amber-50/20 shadow-md ring-1 ring-gold-300'
                  : 'border-cream-200/60 bg-white hover:border-cream-300 hover:shadow-sm'
              )}
            >
              {/* Vertical Selection Shimmer bar */}
              {selectedOrderId === order.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-500" />
              )}

              <div className="flex items-center gap-3.5">
                <div className={cn(
                  'w-11 h-11 rounded-xl flex flex-col items-center justify-center font-heading',
                  selectedOrderId === order.id ? 'bg-gold-500/10 text-gold-600' : 'bg-cream-100 text-ink-600'
                )}>
                  <span className="text-[10px] uppercase font-semibold text-ink-400">Table</span>
                  <span className="text-sm font-bold -mt-0.5">{getTableNumber(order.session_id)}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink-900 text-sm">{getCustomerName(order.session_id)}</h3>
                    <span className="text-ink-300 text-xs">•</span>
                    <span className="text-xs text-ink-500 font-medium">
                      Order: {order.all_order_numbers ? order.all_order_numbers.map(n => `#${n}`).join(', ') : `#${order.order_number}`}
                    </span>
                  </div>
                  
                  {/* Compact items count */}
                  <p className="text-xs text-ink-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeAgo(order.created_at)}</span>
                    <span>•</span>
                    <span>{order.order_items.length} items to serve</span>
                  </p>
                </div>
              </div>

              {/* Status and Bill */}
              <div className="text-right flex flex-col items-end gap-1.5">
                <span className="text-sm font-bold text-gold-700 font-heading">
                  {formatCurrency(order.total_amount)}
                </span>
                <span className={`badge text-[9px] font-bold px-2 py-0.5 status-${order.status}`}>
                  {ORDER_STATUSES[order.status]?.label}
                </span>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-16 card border border-dashed border-cream-200">
              <Package className="w-12 h-12 text-ink-300 mx-auto mb-3" />
              <p className="text-ink-500 font-semibold text-sm">No billing records match your search criteria.</p>
            </div>
          )}
        </div>

        {/* Right Pane: Premium Guest Billing Receipt */}
        <div className="lg:col-span-5 h-full">
          {selectedOrder ? (
            <div className="card bg-white border-2 border-stone-800 shadow-md p-6 flex flex-col justify-between relative overflow-hidden animate-scale-in printable-receipt">
              {/* Receipt Header details */}
              <div className="space-y-6">
                
                {/* Simulated Paper Receipt Design */}
                <div className="text-center border-b border-dashed border-stone-300 pb-4">
                  {renderLogo()}
                  <h3 className="font-serif text-lg font-bold text-stone-950 uppercase tracking-widest">{demoRestaurant.name}</h3>
                  <p className="text-[10px] text-stone-500 mt-0.5">{demoRestaurant.address || 'Smart Dining System'}</p>
                  <p className="text-[10px] text-stone-500">Tel: {demoRestaurant.phone || '+91 98765 43210'}</p>
                </div>

                {/* Ledger metadata */}
                <div className="grid grid-cols-2 gap-2 text-xs text-stone-900 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <div>
                    <p><span className="text-stone-500 font-medium">Order:</span> <strong className="text-stone-950">{(selectedOrder as ConsolidatedOrder).all_order_numbers ? (selectedOrder as ConsolidatedOrder).all_order_numbers.map((n: number) => `#${n}`).join(', ') : `#${selectedOrder.order_number}`}</strong></p>
                    <p><span className="text-stone-500 font-medium">Table:</span> <strong className="text-stone-950">{getTableNumber(selectedOrder.session_id)}</strong></p>
                  </div>
                  <div className="text-right flex flex-col justify-between items-end">
                    <div>
                      <p><span className="text-stone-500 font-medium">Guest:</span> <strong className="text-stone-950">{getCustomerName(selectedOrder.session_id)}</strong></p>
                      <p><span className="text-stone-500 font-medium">Date:</span> <strong className="text-stone-950">{new Date(selectedOrder.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>
                      <p><span className="text-stone-500 font-medium">Time:</span> <strong className="text-stone-950">{new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingBillOrder(selectedOrder);
                        setEditingBillItems([...selectedOrder.order_items]);
                      }}
                      className="text-[10px] font-bold text-gold-600 hover:text-gold-700 underline mt-1.5 no-print flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Edit2 className="w-3 h-3" /> Adjust Bill Items
                    </button>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-y border-dashed border-stone-350 py-3">
                    <thead>
                      <tr className="text-stone-600 uppercase tracking-wider text-[9px] border-b border-stone-200 pb-2">
                        <th className="font-bold py-1">Item Description</th>
                        <th className="font-bold text-center py-1">Qty</th>
                        <th className="font-bold text-right py-1">Rate</th>
                        <th className="font-bold text-right py-1">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {selectedOrder.order_items.map((item: OrderItem) => (
                        <tr key={item.id} className="text-stone-950 font-medium">
                          <td className="py-2.5 pr-2">
                            <p className="font-bold text-stone-950">{item.name}</p>
                          </td>
                          <td className="text-center py-2.5 font-extrabold">{item.quantity}</td>
                          <td className="text-right py-2.5 text-stone-600">{formatCurrency(item.unit_price)}</td>
                          <td className="text-right py-2.5 font-bold text-stone-950">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Billing Summary calculation */}
                {(() => {
                  const serviceChargeAmount = serviceChargeType === 'percent'
                    ? selectedOrder.total_amount * (serviceChargeRate / 100)
                    : serviceChargeRate;
                  const cgstAmount = selectedOrder.total_amount * (cgstRate / 100);
                  const sgstAmount = selectedOrder.total_amount * (sgstRate / 100);
                  const totalWithTax = selectedOrder.total_amount + cgstAmount + sgstAmount + serviceChargeAmount;
                  
                  return (
                    <div className="space-y-2 text-xs text-stone-800 border-t border-dashed border-stone-300 pt-4">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Subtotal Amount</span>
                        <span className="font-semibold text-stone-900">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                      {serviceChargeRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">
                            Service Charge {serviceChargeType === 'percent' ? `(${serviceChargeRate}%)` : '(Fixed)'}
                          </span>
                          <span className="font-semibold text-stone-900">{formatCurrency(serviceChargeAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-stone-500">CGST ({cgstRate}%)</span>
                        <span className="font-semibold text-stone-900">{formatCurrency(cgstAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">SGST ({sgstRate}%)</span>
                        <span className="font-semibold text-stone-900">{formatCurrency(sgstAmount)}</span>
                      </div>
                      {isRoundOff && (Math.round(totalWithTax) - totalWithTax) !== 0 && (
                        <div className="flex justify-between text-stone-600 text-[11px] font-medium border-t border-dashed border-stone-200 pt-1.5">
                          <span>Round Off Adjustment</span>
                          <span>
                            {(Math.round(totalWithTax) - totalWithTax) > 0 ? '+' : ''}
                            {formatCurrency(Math.round(totalWithTax) - totalWithTax)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-b-2 border-double border-stone-900 py-3 mt-1.5 text-sm font-black text-stone-950 font-mono">
                        <span>Grand Total Payable</span>
                        <span>
                          {formatCurrency(
                            isRoundOff
                              ? Math.round(totalWithTax)
                              : totalWithTax
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="border-t border-cream-200/80 pt-4 mt-6 space-y-4 no-print">
                
                {/* Instant Tax Configuration Row */}
                <div className="bg-cream-50/70 border border-cream-200/60 p-3.5 rounded-xl space-y-2.5 animate-scale-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-ink-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-gold-600" />
                      Configure Taxes & Charges
                    </span>
                    <span className="text-[10px] text-ink-400 font-medium">Updates live instantly</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-ink-500 font-bold mb-1 uppercase tracking-tight">CGST (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={cgstRate === 0 ? '' : cgstRate}
                          onChange={(e) => updateTaxRates(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0, sgstRate, serviceChargeRate, serviceChargeType)}
                          className="w-full bg-white border border-cream-250 rounded-lg pl-1.5 pr-4.5 py-1 text-xs font-extrabold text-ink-950 focus:outline-none focus:border-gold-500 shadow-inner"
                        />
                        <span className="absolute right-1 top-1 text-[9px] font-bold text-ink-400 pointer-events-none">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-ink-500 font-bold mb-1 uppercase tracking-tight">SGST (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={sgstRate === 0 ? '' : sgstRate}
                          onChange={(e) => updateTaxRates(cgstRate, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0, serviceChargeRate, serviceChargeType)}
                          className="w-full bg-white border border-cream-250 rounded-lg pl-1.5 pr-4.5 py-1 text-xs font-extrabold text-ink-950 focus:outline-none focus:border-gold-500 shadow-inner"
                        />
                        <span className="absolute right-1 top-1 text-[9px] font-bold text-ink-400 pointer-events-none">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-ink-500 font-bold mb-1 uppercase tracking-tight flex items-center justify-between">
                        <span>Srv Chg</span>
                        <button
                          type="button"
                          onClick={() => updateTaxRates(cgstRate, sgstRate, serviceChargeRate, serviceChargeType === 'percent' ? 'fixed' : 'percent')}
                          className="text-[8px] text-gold-600 hover:text-gold-700 bg-gold-50 px-1 rounded border border-gold-200/50 hover:bg-gold-100/50 cursor-pointer font-black tracking-normal transition-colors no-print"
                        >
                          {serviceChargeType === 'percent' ? '%' : 'Flat'}
                        </button>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={serviceChargeRate === 0 ? '' : serviceChargeRate}
                          onChange={(e) => updateTaxRates(cgstRate, sgstRate, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0, serviceChargeType)}
                          className="w-full bg-white border border-cream-250 rounded-lg pl-1.5 pr-4.5 py-1 text-xs font-extrabold text-ink-950 focus:outline-none focus:border-gold-500 shadow-inner"
                        />
                        <span className="absolute right-1 top-1 text-[9px] font-bold text-ink-400 pointer-events-none">
                          {serviceChargeType === 'percent' ? '%' : (demoRestaurant.currency || '₹')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* UPI & Digital Payments Billing QR Display */}
                {(upiId || paymentQrUrl) && (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-3 animate-scale-in text-left no-print">
                    <div className="flex items-center justify-between text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><QrCode className="w-3.5 h-3.5 text-stone-600" /> Settle Surcharge-Free via UPI</span>
                      <span>Scan to Settle</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {paymentQrUrl ? (
                        <div className="w-[84px] h-[84px] p-1 bg-white rounded-lg border border-stone-200 shadow-sm shrink-0 flex items-center justify-center">
                          <img
                            src={paymentQrUrl}
                            className="max-w-full max-h-full object-contain"
                            alt="Payment QR"
                          />
                        </div>
                      ) : (
                        upiId && (
                          <div className="p-1 bg-white rounded-lg border border-stone-200 shadow-sm shrink-0">
                            <QRCodeSVG
                              value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(demoRestaurant.name)}&am=${
                                (() => {
                                  const serviceChargeAmount = serviceChargeType === 'percent'
                                    ? selectedOrder.total_amount * (serviceChargeRate / 100)
                                    : serviceChargeRate;
                                  const cgstAmount = selectedOrder.total_amount * (cgstRate / 100);
                                  const sgstAmount = selectedOrder.total_amount * (sgstRate / 100);
                                  const totalWithTax = selectedOrder.total_amount + cgstAmount + sgstAmount + serviceChargeAmount;
                                  return Math.round(totalWithTax);
                                })()
                              }&cu=INR&tn=Order%20${selectedOrder.order_number}`}
                              size={76}
                              fgColor="#1a1208"
                              bgColor="#ffffff"
                              level="M"
                            />
                          </div>
                        )
                      )}

                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-extrabold text-stone-900 truncate">
                          {upiId ? `VPA: ${upiId}` : 'Custom Payment QR Active'}
                        </p>
                        <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                          Show this QR code to the customer or print it out to collect surcharge-free instant UPI payments.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Guest Payment Notification Alert */}
                {selectedOrder.payment_status === 'pending' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center gap-2 animate-pulse no-print">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                    <div className="flex-1 text-left">
                      <p>Guest notified UPI payment!</p>
                      <p className="text-[9px] text-amber-600 font-normal mt-0.5">Please check your merchant bank account for UPI confirmation.</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => window.print()}
                    className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5 h-10"
                  >
                    <Printer className="w-4 h-4 text-white" /> Print Bill
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5 h-10"
                  >
                    <FileText className="w-4 h-4 text-gold-600" /> Download PDF
                  </button>
                </div>

                {/* Unified Payment confirmation button */}
                <div className="no-print">
                  {selectedOrder.payment_status === 'pending' ? (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'served');
                        const sessionId = selectedOrder.id.replace('session-bill-', '');
                        setOrders(prevOrders => prevOrders.map(o => 
                          o.session_id === sessionId ? { ...o, payment_status: 'paid', status: 'served' } : o
                        ));
                      }}
                      className="w-full h-10 bg-sage-500 hover:bg-sage-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Confirm UPI Receipt & Settle Bill
                    </button>
                  ) : selectedOrder.payment_status === 'paid' || selectedOrder.status === 'served' ? (
                    <div className="h-10 bg-sage-50 text-sage-700 border border-sage-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm w-full">
                      <Check className="w-4 h-4" /> Settle Complete (Paid Digitally)
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'served');
                        const sessionId = selectedOrder.id.replace('session-bill-', '');
                        setOrders(prevOrders => prevOrders.map(o => 
                          o.session_id === sessionId ? { ...o, payment_status: 'paid', status: 'served' } : o
                        ));
                      }}
                      className="h-10 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm w-full cursor-pointer transition-colors"
                    >
                      <CreditCard className="w-4 h-4" /> Settle Bill / Record Payment
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  {ORDER_STATUS_FLOW[selectedOrder.status]
                    ?.filter((nextStatus) => nextStatus !== 'accepted' && nextStatus !== 'cancelled' && nextStatus !== 'ready')
                    ?.map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => updateOrderStatus(selectedOrder.id, nextStatus)}
                        className="text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 flex-1 shadow-sm h-10 btn-primary"
                      >
                        {ORDER_STATUSES[nextStatus as keyof typeof ORDER_STATUSES]?.icon}{' '}
                        Mark {ORDER_STATUSES[nextStatus as keyof typeof ORDER_STATUSES]?.label}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card border border-dashed border-cream-200 h-64 flex flex-col items-center justify-center text-center p-8 bg-cream-50/50">
              <Receipt className="w-12 h-12 text-cream-300 mb-2" />
              <p className="text-ink-400 text-sm font-semibold">Select an active order from the list to view invoice receipts.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bill Adjustment Modal */}
      {editingBillOrder && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-stone-850 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Adjust Bill Items</h3>
                <p className="text-xs text-stone-500">Order #{(editingBillOrder as ConsolidatedOrder).all_order_numbers ? (editingBillOrder as ConsolidatedOrder).all_order_numbers.map((n: number) => `#${n}`).join(', ') : `#${editingBillOrder.order_number}`} • Table {getTableNumber(editingBillOrder.session_id)}</p>
              </div>
              <button
                onClick={() => setEditingBillOrder(null)}
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 py-1">
              {editingBillItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-stone-500 font-medium">All items have been removed. Add items or cancel order.</p>
                </div>
              ) : (
                editingBillItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-white transition-all shadow-sm"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{item.name}</h4>
                      <p className="text-xs text-stone-500">{formatCurrency(item.unit_price)} per item</p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Qty controls */}
                      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => handleDecreaseQty(item.id)}
                          className="p-1.5 hover:bg-stone-50 text-stone-600 active:scale-95 transition-all cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-stone-900 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncreaseQty(item.id)}
                          className="p-1.5 hover:bg-stone-50 text-stone-600 active:scale-95 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal & trash */}
                      <div className="text-right min-w-[80px]">
                        <p className="text-xs font-bold text-stone-900">{formatCurrency(item.subtotal)}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-stone-400 transition-colors cursor-pointer"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-stone-200 pt-4 mt-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Estimated Total</p>
                {(() => {
                  const subtotal = editingBillItems.reduce((acc, item) => acc + item.subtotal, 0);
                  const taxesAmount = subtotal * ((cgstRate + sgstRate) / 100);
                  const serviceChargeAmount = serviceChargeType === 'percent'
                    ? subtotal * (serviceChargeRate / 100)
                    : serviceChargeRate;
                  const grandTotal = subtotal + taxesAmount + serviceChargeAmount;
                  
                  return (
                    <p className="text-lg font-black text-stone-950 font-mono">
                      {formatCurrency(grandTotal)}
                      <span className="text-[10px] text-stone-400 font-sans font-normal ml-1">
                        (inc. {cgstRate}% CGST + {sgstRate}% SGST {serviceChargeRate > 0 ? `+ ${serviceChargeType === 'percent' ? `${serviceChargeRate}%` : formatCurrency(serviceChargeRate)} Srv Chg` : ''})
                      </span>
                    </p>
                  );
                })()}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBillOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-all h-10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBillEdits}
                  className="px-4 py-2 text-xs font-bold text-white bg-gold-600 hover:bg-gold-700 rounded-xl transition-all shadow-sm hover:shadow h-10 cursor-pointer"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
