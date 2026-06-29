'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Leaf, Flame, GripVertical, X, Triangle, Upload, ExternalLink } from 'lucide-react';
import { demoCategories, demoMenuItems, saveDemoCategories, saveDemoMenuItems, demoRestaurant } from '@/lib/demo-data';
import { MenuItem, MenuCategory } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

const PRESET_FOOD_IMAGES = [
  { label: 'Soup Starter', url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80' },
  { label: 'Paneer Tikka', url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Kebabs', url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80' },
  { label: 'Crispy Corn', url: '/crispy-corn.jpg' },
  { label: 'Dal Makhani', url: '/dal-makhani.jpg' },
  { label: 'Butter Chicken', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80' },
  { label: 'Paneer Masala', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80' },
  { label: 'Biryani Rice', url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80' },
  { label: 'Butter Naan', url: '/butter-naan.jpg' },
  { label: 'Garlic Naan', url: '/garlic-naan.jpg' },
  { label: 'Laccha Paratha', url: '/laccha-paratha.png' },
  { label: 'Mango Lassi', url: '/mango-lassi.jpg' },
  { label: 'Masala Chai', url: '/masala-chai.png' },
  { label: 'Gulab Jamun', url: '/gulab-jamun.png' },
  { label: 'Rasmalai', url: '/rasmalai.png' },
  { label: 'Chocolate Cake', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80' },
];

const generateUniqueId = (prefix: string) => `${prefix}-${Date.now()}`;

export default function MenuPage() {
  const [restaurantSlug, setRestaurantSlug] = useState('the-golden-plate');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('qrestro_demo_restaurant');
        if (saved) {
          const custom = JSON.parse(saved);
          if (custom.slug) {
            setRestaurantSlug(custom.slug);
            return;
          }
        }
      } catch {}
      if (demoRestaurant?.slug) {
        setRestaurantSlug(demoRestaurant.slug);
      }
    }
  }, []);

  const [categories, setCategories] = useState<MenuCategory[]>(demoCategories);
  const [items, setItems] = useState<MenuItem[]>(demoMenuItems);

  // Sync to localStorage
  useEffect(() => {
    saveDemoCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveDemoMenuItems(items);
  }, [items]);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form state for add/edit item
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', image_url: '', is_vegetarian: false, is_popular: false,
  });

  const filteredItems = items.filter(i => i.category_id === activeCategory);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: MenuCategory = {
      id: generateUniqueId('cat-new'),
      restaurant_id: 'demo',
      name: newCategoryName.trim(),
      description: '',
      sort_order: categories.length,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
    setShowAddCategory(false);
    setActiveCategory(newCat.id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = () => {
    if (!formData.name.trim() || !formData.price) return;
    const newItem: MenuItem = {
      id: generateUniqueId('item-new'),
      category_id: activeCategory,
      restaurant_id: 'demo',
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      image_url: formData.image_url.trim(),
      is_available: true,
      is_vegetarian: formData.is_vegetarian,
      is_popular: formData.is_popular,
      sort_order: filteredItems.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setItems([...items, newItem]);
    resetForm();
  };

  const handleUpdateItem = () => {
    if (!editItem || !formData.name.trim() || !formData.price) return;
    setItems(items.map(i => i.id === editItem.id ? {
      ...i,
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      image_url: formData.image_url.trim(),
      is_vegetarian: formData.is_vegetarian,
      is_popular: formData.is_popular,
    } : i));
    resetForm();
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (categories.length <= 1) return;
    const categoryItemsCount = items.filter(i => i.category_id === catId).length;
    const confirmMessage = categoryItemsCount > 0 
      ? `Are you sure you want to delete the category "${catName}"? This will also delete all ${categoryItemsCount} food items inside it.`
      : `Are you sure you want to delete the category "${catName}"?`;

    if (window.confirm(confirmMessage)) {
      const remainingCats = categories.filter(c => c.id !== catId);
      setCategories(remainingCats);
      setItems(items.filter(i => i.category_id !== catId));
      if (activeCategory === catId) {
        setActiveCategory(remainingCats[0]?.id || '');
      }
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const toggleAvailability = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, is_available: !i.is_available } : i));
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', image_url: '', is_vegetarian: false, is_popular: false });
    setShowAddItem(false);
    setEditItem(null);
  };

  const startEdit = (item: MenuItem) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      image_url: item.image_url || '',
      is_vegetarian: item.is_vegetarian,
      is_popular: item.is_popular,
    });
    setShowAddItem(true);
  };

  return (
    <div className="space-y-6 animate-simple-fade">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-900">Menu Management</h1>
          <p className="text-ink-500 mt-1">Manage your restaurant&apos;s menu categories and items</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <a
            href={`/order/${restaurantSlug}/table-1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#FAF4EB] hover:bg-[#FAF0E2] border border-[#B88A52]/30 hover:border-[#B88A52]/50 text-[#B88A52] px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Customer Menu View</span>
          </a>
          <button
            onClick={() => { resetForm(); setShowAddItem(true); }}
            className="btn-primary h-10 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={categories.length === 0}
            title={categories.length === 0 ? "Create a category first to add menu items" : "Add Item"}
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 group border cursor-pointer',
              activeCategory === cat.id
                ? 'bg-gold-500 text-white border-gold-600'
                : 'bg-cream-100 text-ink-600 hover:bg-cream-200 border-cream-200'
            )}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span>{cat.name}</span>
            <span className="text-xs opacity-75">
              ({items.filter(i => i.category_id === cat.id).length})
            </span>
            {categories.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(cat.id, cat.name);
                }}
                className={cn(
                  "p-0.5 rounded-md transition-all hover:bg-black/10 text-ink-400 hover:text-rose-500",
                  activeCategory === cat.id ? "text-white/80 hover:text-white hover:bg-white/20" : "opacity-0 group-hover:opacity-100"
                )}
                title={`Delete ${cat.name} category`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {showAddCategory ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="input-field py-2 px-3 text-sm w-40"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button onClick={handleAddCategory} className="btn-primary py-2 px-3 text-sm">Add</button>
            <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} className="text-ink-400 hover:text-ink-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddCategory(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-dashed border-cream-300 text-ink-400 hover:text-ink-600 hover:border-ink-300 transition-all"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Category
          </button>
        )}
      </div>

      {/* Menu items grid / Empty state */}
      {categories.length === 0 ? (
        <div className="text-center py-16 bg-cream-100/30 rounded-2xl border border-dashed border-cream-300">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-ink-800 font-semibold text-lg">Your Menu is Empty</p>
          <p className="text-ink-500 text-sm mt-1 max-w-sm mx-auto">Create your first food category (e.g., Starters, Drinks, Main Course) to start adding dishes.</p>
          <button onClick={() => setShowAddCategory(true)} className="btn-primary mt-5 text-xs font-bold py-2.5 px-4 mx-auto flex items-center justify-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Create First Category
          </button>
        </div>
      ) : (
        <>
          {filteredItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children animate-simple-fade">
              {filteredItems.map((item) => (
                <div key={item.id} className={cn('card group relative', !item.is_available && 'opacity-60')}>
                  {/* Item image */}
                  <div className="w-full h-32 bg-cream-200/50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                    ) : (
                      <span className="text-4xl">
                        {item.is_vegetarian ? '🥬' : '🍖'}
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {item.is_vegetarian ? (
                      <span className="badge badge-sage text-xs flex items-center gap-1">
                        <Leaf className="w-3 h-3" /> Veg
                      </span>
                    ) : (
                      <span className="badge badge-rose text-xs flex items-center gap-1">
                        <Triangle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> Non-Veg
                      </span>
                    )}
                    {item.is_popular && (
                      <span className="badge badge-gold text-xs flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Popular
                      </span>
                    )}
                    {!item.is_available && (
                      <span className="badge badge-rose text-xs">Unavailable</span>
                    )}
                  </div>

                  <h3 className="font-heading text-lg font-semibold text-ink-900">{item.name}</h3>
                  <p className="text-sm text-ink-500 mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-heading text-xl font-bold text-gold-500">
                      {formatCurrency(item.price)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleAvailability(item.id)}
                        className={cn('px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                          item.is_available ? 'bg-sage-400/10 text-sage-600 hover:bg-sage-400/20' : 'bg-gold-400/10 text-gold-600 hover:bg-gold-400/20'
                        )}
                      >
                        {item.is_available ? 'Mark Sold Out' : 'Mark Available'}
                      </button>
                      <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-cream-200 transition-colors cursor-pointer">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="text-ink-500 font-medium">No items in this category yet</p>
              <button onClick={() => { resetForm(); setShowAddItem(true); }} className="btn-primary mt-4 text-sm mx-auto flex items-center justify-center gap-1.5 cursor-pointer">
                <Plus className="w-4 h-4" /> Add First Item
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Item Modal */}
      {showAddItem && (
        <>
          <div className="overlay" onClick={resetForm} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-cream-50 rounded-2xl shadow-xl w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto outline-none">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-semibold text-ink-900">
                  {editItem ? 'Edit Item' : 'Add Menu Item'}
                </h2>
                <button onClick={resetForm} className="text-ink-400 hover:text-ink-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="e.g. Butter Chicken" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field resize-none h-20" placeholder="Brief description..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Price (₹)</label>
                  <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Item Picture</label>
                  <div className="space-y-3">
                    {/* Device upload option */}
                    <label className="border-2 border-dashed border-cream-300 hover:border-gold-500 bg-cream-100/30 hover:bg-cream-100/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group relative overflow-hidden h-28">
                      {formData.image_url ? (
                        <div className="absolute inset-0 w-full h-full">
                          <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200">
                            <Upload className="w-6 h-6 text-white mb-1" />
                            <span className="text-white text-xs font-semibold">Replace Photo</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="w-6 h-6 text-ink-400 group-hover:text-gold-600 mb-1.5 transition-colors" />
                          <span className="text-xs font-semibold text-ink-700">Choose Image from Device</span>
                          <span className="text-[9px] text-ink-400 mt-0.5">PNG, JPG, or WEBP</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </label>

                    {/* Preloaded presets option */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider">Or Select Preset Culinary Photo:</div>
                      <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-cream-100/50 rounded-xl max-h-24 overflow-y-auto outline-none">
                        {PRESET_FOOD_IMAGES.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormData({ ...formData, image_url: preset.url })}
                            className={cn(
                              "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.03]",
                              formData.image_url === preset.url ? "border-gold-500 ring-2 ring-gold-200" : "border-transparent opacity-85 hover:opacity-100"
                            )}
                          >
                            <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-0.5">
                              <span className="text-[8px] text-white font-medium truncate w-full text-center">{preset.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_vegetarian} onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })} className="w-4 h-4 rounded accent-sage-500" />
                    <span className="text-sm text-ink-700">Vegetarian</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!formData.is_vegetarian} onChange={(e) => setFormData({ ...formData, is_vegetarian: !e.target.checked })} className="w-4 h-4 rounded accent-rose-500" />
                    <span className="text-sm text-ink-700">Non-Veg</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_popular} onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })} className="w-4 h-4 rounded accent-gold-500" />
                    <span className="text-sm text-ink-700">Popular</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={resetForm} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={editItem ? handleUpdateItem : handleAddItem} className="btn-primary flex-1">
                    {editItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
