'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag, Plus, Minus, Leaf, Flame, Search, X, MessageSquare, Triangle, Crown, ChefHat, Soup, CupSoda, Star } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { getDemoMenuWithCategories, demoRestaurant } from '@/lib/demo-data';
import { MenuItem, MenuCategoryWithItems } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

export default function CustomerMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { items: cartItems, addItem, removeItem, updateQuantity, updateInstructions, totalItems, totalAmount } = useCart();

  const [restaurantLogo, setRestaurantLogo] = useState('default');
  const [restaurantName, setRestaurantName] = useState('The Golden Plate');
  const [isSuspended, setIsSuspended] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [categories, setCategories] = useState<MenuCategoryWithItems[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tableIdStr = params.tableId as string;
      try {
        const savedTables = localStorage.getItem('qrestro_demo_tables');
        if (savedTables) {
          const parsed = JSON.parse(savedTables);
          if (Array.isArray(parsed)) {
            const currentTable = parsed.find((t: any) => t.id === tableIdStr);
            if (currentTable && currentTable.table_number) {
              setTableNumber(currentTable.table_number);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error reading tables in customer page:', err);
      }

      // Fallback
      let fallbackNum = tableIdStr;
      if (tableIdStr.includes('bulk-')) {
        const parts = tableIdStr.split('-');
        fallbackNum = parts[parts.length - 1] || tableIdStr;
      } else {
        fallbackNum = tableIdStr.replace('table-', '');
      }
      setTableNumber(fallbackNum);
    }
  }, [params.tableId]);

  // Sync activeCategory when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const registered = localStorage.getItem('qrestro_registered_restaurants');
        if (registered) {
          const list = JSON.parse(registered);
          const currentRestaurant = list.find((r: any) => r.slug === params.restaurantSlug);
          if (currentRestaurant && currentRestaurant.is_active === false) {
            setIsSuspended(true);
          }
        }
      } catch {}

      if (params.restaurantSlug === 'the-golden-plate') {
        setRestaurantLogo('default');
        setRestaurantName('The Golden Plate');
        setCategories(getDemoMenuWithCategories(true));
        setIsLoaded(true);
        return;
      }

      // Load menu from the cloud API
      fetch(`/api/menu/public?slug=${params.restaurantSlug}`)
        .then((res) => {
          if (!res.ok) throw new Error('Not found in database');
          return res.json();
        })
        .then((data) => {
          if (data.restaurant) {
            if (data.restaurant.logo_url) setRestaurantLogo(data.restaurant.logo_url);
            if (data.restaurant.name) setRestaurantName(data.restaurant.name);
            sessionStorage.setItem('qrestro_last_restaurant', JSON.stringify(data.restaurant));
          }
          if (data.categories) {
            setCategories(data.categories);
          }
          setIsLoaded(true);
        })
        .catch((err) => {
          console.warn('Could not load custom menu from database, falling back to local demo:', err);
          if (params.restaurantSlug === 'the-golden-plate') {
            setRestaurantLogo('default');
            setRestaurantName('The Golden Plate');
            setCategories(getDemoMenuWithCategories(true));
            setIsLoaded(true);
            return;
          }
          // Fallback to local demo storage
          try {
            const saved = localStorage.getItem('qrestro_demo_restaurant');
            if (saved) {
              const custom = JSON.parse(saved);
              if (custom.logo_url) setRestaurantLogo(custom.logo_url);
              if (custom.name) setRestaurantName(custom.name);
            }
          } catch {}
          setCategories(getDemoMenuWithCategories());
          setIsLoaded(true);
        });
    }
  }, [params.restaurantSlug]);

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-cream-100 border border-cream-200 rounded-3xl p-8 max-w-sm text-center shadow-xl animate-scale-in">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <X className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-ink-900 mb-2">Service Suspended</h2>
          <p className="text-sm text-ink-500 mb-6 leading-relaxed">
            The menu service for <strong>{restaurantName}</strong> has been temporarily suspended by the platform administrator.
          </p>
          <p className="text-xs text-ink-400">
            Please contact restaurant staff or support if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const renderLogo = () => {
    const className = "w-6.5 h-6.5 text-white flex-shrink-0";
    if (restaurantLogo === 'crown') {
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
    if (restaurantLogo && restaurantLogo !== 'default') {
      return (
        <img
          src={restaurantLogo}
          className="w-full h-full rounded-xl object-cover"
          alt="Logo"
        />
      );
    }
    return (
      <svg className="w-8.5 h-8.5 text-white animate-fade-in" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
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
    );
  };



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

    // Check for an existing order session in this dining experience
    const existingOrderRaw = sessionStorage.getItem('qrestro_last_order');
    let orderNumber = Math.floor(100 + Math.random() * 900);
    let combinedItems: Array<{
      name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
      special_instructions: string;
    }> = [];

    if (existingOrderRaw) {
      try {
        const parsed = JSON.parse(existingOrderRaw);
        if (parsed.orderNumber) {
          orderNumber = parsed.orderNumber;
        }
        if (Array.isArray(parsed.items)) {
          combinedItems = [...parsed.items];
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Append/merge new items into the consolidated order list
    cartItems.forEach(ci => {
      const existing = combinedItems.find(
        item => item.name === ci.menuItem.name &&
          item.special_instructions === ci.specialInstructions
      );
      if (existing) {
        existing.quantity += ci.quantity;
        existing.subtotal += ci.menuItem.price * ci.quantity;
      } else {
        combinedItems.push({
          name: ci.menuItem.name,
          quantity: ci.quantity,
          unit_price: ci.menuItem.price,
          subtotal: ci.menuItem.price * ci.quantity,
          special_instructions: ci.specialInstructions,
        });
      }
    });

    const combinedTotal = combinedItems.reduce((acc, item) => acc + item.subtotal, 0);

    // Save consolidated order under the same order number
    sessionStorage.setItem('qrestro_last_order', JSON.stringify({
      items: combinedItems,
      total: combinedTotal,
      time: new Date().toISOString(),
      orderNumber: orderNumber,
    }));

    // Write/Sync with localStorage 'qrestro_demo_orders' so POS/Kitchen see it instantly
    if (typeof window !== 'undefined') {
      try {
        const storedOrdersRaw = localStorage.getItem('qrestro_demo_orders');
        let currentOrders = storedOrdersRaw ? JSON.parse(storedOrdersRaw) : [];
        const tableIdStr = params.tableId as string;
        const mockSessionId = `session-${tableIdStr}`;
        const orderId = `order-${orderNumber}`;
        const newOrderItems = combinedItems.map((item, idx) => ({
          id: `oi-${orderId}-${idx}`,
          order_id: orderId,
          menu_item_id: `item-mock-${idx}`,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          special_instructions: item.special_instructions,
          created_at: new Date().toISOString()
        }));

        const newOrder = {
          id: orderId,
          session_id: mockSessionId,
          restaurant_id: 'demo-restaurant-001',
          order_number: orderNumber,
          status: 'new',
          total_amount: combinedTotal,
          notes: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          order_items: newOrderItems
        };

        // Remove any existing order for this orderNumber to avoid duplicates
        currentOrders = currentOrders.filter((o: any) => o.id !== orderId);
        currentOrders.unshift(newOrder);
        
        localStorage.setItem('qrestro_demo_orders', JSON.stringify(currentOrders));

        // Dispatch a storage event to alert other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'qrestro_demo_orders',
          newValue: JSON.stringify(currentOrders)
        }));
      } catch (err) {
        console.error('Error writing to tableTap demo orders:', err);
      }
    }

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
              <div className="w-11 h-11 bg-gold-500 rounded-xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
                {renderLogo()}
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold text-ink-900">{restaurantName}</h1>
                <p className="text-xs text-ink-400">Table {tableNumber || (params.tableId as string)?.replace('table-', '')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCartDrawer(true)}
              className="relative p-2 rounded-xl bg-gold-500/10 text-gold-600 hover:bg-gold-500/20 transition-all active:scale-90 duration-150"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span key={totalItems} className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
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
              className="input-field pl-10 py-2.5 text-sm transition-all focus:scale-[1.01]"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Category tabs */}
          {!searchQuery && (
            <div className="flex items-center gap-2 overflow-x-auto mt-3 pb-1 scrollbar-hide">
              {categories.map((cat, catIdx) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 active:scale-95 transform animate-fade-in-up opacity-0',
                    activeCategory === cat.id
                      ? 'bg-gold-500 text-white shadow-md shadow-gold-500/20 scale-105'
                      : 'bg-cream-100 text-ink-500 border border-cream-200 hover:bg-cream-200/50'
                  )}
                  style={{
                    animationDelay: `${catIdx * 40}ms`,
                    animationFillMode: 'forwards'
                  }}
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
              {category.menu_items.filter(i => i.is_available).map((item, index) => {
                const qty = getItemQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className="card bg-cream-100 p-4 flex gap-3 animate-fade-in-up opacity-0"
                    style={{
                      animationDelay: `${index * 60}ms`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    {/* Item image */}
                    <div className="w-20 h-20 bg-cream-200/50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                      ) : (
                        <span className="text-3xl transition-transform duration-300 hover:scale-115">
                          {item.is_vegetarian ? '🥬' : '🍖'}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {item.is_vegetarian ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sage-600 bg-sage-50 px-1.5 py-0.5 rounded border border-sage-200 transition-all hover:bg-sage-100">
                                <Leaf className="w-3 h-3 text-sage-500" /> Veg
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 transition-all hover:bg-rose-100">
                                <Triangle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> Non-Veg
                              </span>
                            )}
                            {item.is_popular && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded border border-gold-200 transition-all hover:bg-gold-100">
                                <Flame className="w-3.5 h-3.5 text-gold-500" /> Popular
                              </span>
                            )}
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
                          <div className="flex items-center gap-1 bg-gold-500 rounded-lg overflow-hidden transition-all duration-150 shadow-sm shadow-gold-500/10">
                            <button
                              onClick={() => updateQuantity(item.id, qty - 1)}
                              className="p-1.5 text-white hover:bg-gold-600 transition-all active:scale-75 duration-100"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span key={qty} className="text-white font-bold text-sm px-2 animate-scale-in">{qty}</span>
                            <button
                              onClick={() => addItem(item, 1)}
                              className="p-1.5 text-white hover:bg-gold-600 transition-all active:scale-75 duration-100"
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

        {/* Loading skeleton */}
        {!isLoaded && (
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3].map(s => (
              <div key={s}>
                <div className="h-6 bg-cream-200 rounded-lg w-32 mb-1" />
                <div className="h-4 bg-cream-100 rounded w-48 mb-4" />
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="card bg-cream-100 p-4 flex gap-3">
                      <div className="w-20 h-20 bg-cream-200 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-cream-200 rounded w-3/4" />
                        <div className="h-3 bg-cream-200 rounded w-full" />
                        <div className="h-3 bg-cream-200 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoaded && filteredCategories.length === 0 && searchQuery && (
          <div className="text-center py-16 animate-fade-in">
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
            className="w-full max-w-lg mx-auto btn-primary py-4 rounded-2xl text-base flex items-center justify-between shadow-lg animate-fade-in-up active:scale-[0.98] transition-all duration-150"
          >
            <div className="flex items-center gap-2">
              <span key={totalItems} className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold animate-scale-in">
                {totalItems}
              </span>
              <span>View Cart</span>
            </div>
            <span className="font-bold">{formatCurrency(totalAmount)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <div
        className={cn(
          "overlay transition-opacity duration-300 ease-out",
          showCartDrawer ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setShowCartDrawer(false)}
        style={{ zIndex: 40 }}
      />
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out transform",
          showCartDrawer ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="max-w-lg mx-auto bg-cream-50 rounded-t-3xl border border-cream-200 shadow-2xl max-h-[85vh] flex flex-col">
          {/* Drawer header */}
          <div className="p-4 border-b border-cream-200 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-ink-900">Your Order</h2>
            <button onClick={() => setShowCartDrawer(false)} className="text-ink-400 hover:text-ink-600 p-1 active:scale-90 transition-all">
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
                  <div className="flex items-center gap-1 bg-cream-200 rounded-lg shadow-sm">
                    <button
                      onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                      className="p-1.5 text-ink-500 hover:text-ink-900 transition-all active:scale-75 duration-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span key={cartItem.quantity} className="text-sm font-bold text-ink-900 px-2 animate-scale-in">{cartItem.quantity}</span>
                    <button
                      onClick={() => addItem(cartItem.menuItem, 1)}
                      className="p-1.5 text-ink-500 hover:text-ink-900 transition-all active:scale-75 duration-100"
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
                      setShowInstructionsModal(true);
                    }}
                    className="text-xs text-ink-400 hover:text-gold-500 flex items-center gap-1 transition-colors active:scale-95"
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
              className="btn-primary w-full py-4 rounded-xl text-base animate-pulse-gold active:scale-[0.98] transition-all"
            >
              Place Order — {formatCurrency(totalAmount)}
            </button>
          </div>
        </div>
      </div>

      {/* Special instructions modal */}
      <div
        className={cn(
          "overlay transition-opacity duration-300 ease-out",
          showInstructionsModal ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setShowInstructionsModal(false)}
        style={{ zIndex: 60 }}
      />
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ease-out transform",
          showInstructionsModal ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
        )}
        style={{ zIndex: 61 }}
      >
        {selectedItem && (
          <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-xl w-full max-w-sm p-5">
            <h3 className="font-heading text-lg font-semibold text-ink-900 mb-3">
              Special Instructions
            </h3>
            <p className="text-sm text-ink-500 mb-3">for {selectedItem.name}</p>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra spicy, no onions..."
              className="input-field resize-none h-24 text-sm"
              autoFocus={showInstructionsModal}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowInstructionsModal(false)} className="btn-secondary flex-1 text-sm active:scale-95 transition-all">Cancel</button>
              <button
                onClick={() => {
                  updateInstructions(selectedItem.id, specialInstructions);
                  setShowInstructionsModal(false);
                }}
                className="btn-primary flex-1 text-sm active:scale-95 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
