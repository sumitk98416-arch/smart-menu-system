'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, Leaf, Flame, GripVertical, X } from 'lucide-react';
import { demoCategories, demoMenuItems } from '@/lib/demo-data';
import { MenuItem, MenuCategory } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>(demoCategories);
  const [items, setItems] = useState<MenuItem[]>(demoMenuItems);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form state for add/edit item
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', is_vegetarian: false, is_popular: false,
  });

  const filteredItems = items.filter(i => i.category_id === activeCategory);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: MenuCategory = {
      id: `cat-new-${Date.now()}`,
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

  const handleAddItem = () => {
    if (!formData.name.trim() || !formData.price) return;
    const newItem: MenuItem = {
      id: `item-new-${Date.now()}`,
      category_id: activeCategory,
      restaurant_id: 'demo',
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      image_url: '',
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
      is_vegetarian: formData.is_vegetarian,
      is_popular: formData.is_popular,
    } : i));
    resetForm();
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const toggleAvailability = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, is_available: !i.is_available } : i));
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', is_vegetarian: false, is_popular: false });
    setShowAddItem(false);
    setEditItem(null);
  };

  const startEdit = (item: MenuItem) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      is_vegetarian: item.is_vegetarian,
      is_popular: item.is_popular,
    });
    setShowAddItem(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-900">Menu Management</h1>
          <p className="text-ink-500 mt-1">Manage your restaurant&apos;s menu categories and items</p>
        </div>
        <button onClick={() => { resetForm(); setShowAddItem(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              activeCategory === cat.id
                ? 'bg-gold-500 text-white'
                : 'bg-cream-100 text-ink-600 hover:bg-cream-200 border border-cream-200'
            )}
          >
            {cat.name}
            <span className="ml-1.5 text-xs opacity-70">
              ({items.filter(i => i.category_id === cat.id).length})
            </span>
          </button>
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

      {/* Menu items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
        {filteredItems.map((item) => (
          <div key={item.id} className={cn('card group relative', !item.is_available && 'opacity-60')}>
            {/* Item image placeholder */}
            <div className="w-full h-32 bg-cream-200/50 rounded-xl mb-3 flex items-center justify-center text-4xl">
              {item.is_vegetarian ? '🥬' : '🍖'}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-2">
              {item.is_vegetarian && (
                <span className="badge badge-sage text-xs">
                  <Leaf className="w-3 h-3" /> Veg
                </span>
              )}
              {item.is_popular && (
                <span className="badge badge-gold text-xs">
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
                  className={cn('px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                    item.is_available ? 'bg-sage-400/10 text-sage-600 hover:bg-sage-400/20' : 'bg-gold-400/10 text-gold-600 hover:bg-gold-400/20'
                  )}
                >
                  {item.is_available ? 'Mark Sold Out' : 'Mark Available'}
                </button>
                <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-cream-200 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-ink-500 font-medium">No items in this category yet</p>
          <button onClick={() => { resetForm(); setShowAddItem(true); }} className="btn-primary mt-4 text-sm">
            <Plus className="w-4 h-4" /> Add First Item
          </button>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showAddItem && (
        <>
          <div className="overlay" onClick={resetForm} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-xl w-full max-w-md p-6 animate-scale-in">
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
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_vegetarian} onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })} className="w-4 h-4 rounded accent-sage-500" />
                    <span className="text-sm text-ink-700">Vegetarian</span>
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
