'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag, Plus, Minus, Leaf, Flame, Search, UtensilsCrossed, X, MessageSquare } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { getDemoMenuWithCategories, demoRestaurant } from '@/lib/demo-data';
import { MenuItem } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

export default function CustomerMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { items: cartItems, addItem, removeItem, updateQuantity, updateInstructions, totalItems, totalAmount } = useCart();

  const restaurant = demoRestaurant;
  const categories = getDemoMenuWithCategories();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const filteredCategories = searchQuery
    ? categories.map(cat => ({
        ...cat,
        menu_items: cat.menu_items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.menu_items.length > 0)
    : categories;

  const getItemQuantity = (itemId: string) => {
    return cartItems.find(i => i.menuItem.id === itemId)?.quantity || 0;
  };

  const handleAddToCart = (item: MenuItem) => {
    addItem(item, 1);
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;
    // Store cart in sessionStorage for status page
    sessionStorage.setItem('tabletap_last_order', JSON.stringify({
      items: cartItems.map(ci => ({
        name: ci.menuItem.name,
        quantity: ci.quantity,
        unit_price: ci.menuItem.price,
        subtotal: ci.menuItem.price * ci.quantity,
        special_instructions: ci.specialInstructions,
      })),
      total: totalAmount,
      time: new Date().toISOString(),
      orderNumber: Math.floor(100 + Math.random() * 900),
    }));
    setShowCartDrawer(false);
    router.push(`/order/${params.restaurantSlug}/${params.tableId}/status`);
  };

  return (
    <div className="min-h-screen bg-cream-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream-50/90 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold text-ink-900">{restaurant.name}</h1>
                <p className="text-xs text-ink-400">Table {(params.tableId as string)?.replace('table-', '')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCartDrawer(true)}
              className="relative p-2 rounded-xl bg-gold-500/10 text-gold-600 hover:bg-gold-500/20 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu..."
              className="input-field pl-10 py-2.5 text-sm"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Category tabs */}
          {!searchQuery && (
            <div className="flex items-center gap-2 overflow-x-auto mt-3 pb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                    activeCategory === cat.id
                      ? 'bg-gold-500 text-white'
                      : 'bg-cream-100 text-ink-500 border border-cream-200'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Menu content */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        {filteredCategories.map((category) => (
          <div key={category.id} id={`cat-${category.id}`} className="mb-8">
            <h2 className="font-heading text-xl font-bold text-ink-900 mb-1">{category.name}</h2>
            <p className="text-sm text-ink-400 mb-4">{category.description}</p>

            <div className="space-y-3">
              {category.menu_items.filter(i => i.is_available).map((item) => {
                const qty = getItemQuantity(item.id);
                return (
                  <div key={item.id} className="card bg-cream-100 p-4 flex gap-3 animate-fade-in">
                    {/* Item emoji placeholder */}
                    <div className="w-20 h-20 bg-cream-200/50 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl">
                      {item.is_vegetarian ? '🥬' : '🍖'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {item.is_vegetarian && <Leaf className="w-3.5 h-3.5 text-sage-500" />}
                            {item.is_popular && <Flame className="w-3.5 h-3.5 text-gold-500" />}
                          </div>
                          <h3 className="font-semibold text-ink-900 text-sm leading-tight">{item.name}</h3>
                        </div>
                      </div>
                      <p className="text-xs text-ink-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-heading text-base font-bold text-gold-500">
                          {formatCurrency(item.price)}
                        </span>

                        {qty === 0 ? (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="bg-gold-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-gold-600 transition-all active:scale-95 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> ADD
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 bg-gold-500 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.id, qty - 1)}
                              className="p-1.5 text-white hover:bg-gold-600 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-white font-bold text-sm px-2">{qty}</span>
                            <button
                              onClick={() => addItem(item, 1)}
                              className="p-1.5 text-white hover:bg-gold-600 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-ink-500 font-medium">No items found for &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {totalItems > 0 && !showCartDrawer && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-cream-50 via-cream-50/95 to-transparent pt-8">
          <button
            onClick={() => setShowCartDrawer(true)}
            className="w-full max-w-lg mx-auto btn-primary py-4 rounded-2xl text-base flex items-center justify-between shadow-lg animate-fade-in-up"
          >
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">
                {totalItems}
              </span>
              <span>View Cart</span>
            </div>
            <span className="font-bold">{formatCurrency(totalAmount)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {showCartDrawer && (
        <>
          <div className="overlay" onClick={() => setShowCartDrawer(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="max-w-lg mx-auto bg-cream-50 rounded-t-3xl border border-cream-200 shadow-2xl max-h-[85vh] flex flex-col">
              {/* Drawer header */}
              <div className="p-4 border-b border-cream-200 flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold text-ink-900">Your Order</h2>
                <button onClick={() => setShowCartDrawer(false)} className="text-ink-400 hover:text-ink-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.map((cartItem) => (
                  <div key={cartItem.menuItem.id} className="bg-cream-100 rounded-xl p-3 border border-cream-200/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-ink-900">{cartItem.menuItem.name}</h4>
                        <p className="text-xs text-ink-400 mt-0.5">{formatCurrency(cartItem.menuItem.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1 bg-cream-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                          className="p-1.5 text-ink-500 hover:text-ink-900 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-ink-900 px-2">{cartItem.quantity}</span>
                        <button
                          onClick={() => addItem(cartItem.menuItem, 1)}
                          className="p-1.5 text-ink-500 hover:text-ink-900 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => {
                          setSelectedItem(cartItem.menuItem);
                          setSpecialInstructions(cartItem.specialInstructions);
                        }}
                        className="text-xs text-ink-400 hover:text-gold-500 flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {cartItem.specialInstructions || 'Add note'}
                      </button>
                      <span className="font-semibold text-sm text-ink-900">
                        {formatCurrency(cartItem.menuItem.price * cartItem.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart footer */}
              <div className="p-4 border-t border-cream-200 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">Subtotal ({totalItems} items)</span>
                  <span className="font-semibold text-ink-900">{formatCurrency(totalAmount)}</span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  className="btn-primary w-full py-4 rounded-xl text-base animate-pulse-gold"
                >
                  Place Order — {formatCurrency(totalAmount)}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Special instructions modal */}
      {selectedItem && (
        <>
          <div className="overlay" onClick={() => setSelectedItem(null)} style={{ zIndex: 60 }} />
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 61 }}>
            <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-xl w-full max-w-sm p-5 animate-scale-in">
              <h3 className="font-heading text-lg font-semibold text-ink-900 mb-3">
                Special Instructions
              </h3>
              <p className="text-sm text-ink-500 mb-3">for {selectedItem.name}</p>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Extra spicy, no onions..."
                className="input-field resize-none h-24 text-sm"
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setSelectedItem(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button
                  onClick={() => {
                    updateInstructions(selectedItem.id, specialInstructions);
                    setSelectedItem(null);
                  }}
                  className="btn-primary flex-1 text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
