'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, X, Pencil, ChefHat, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoMenuItems } from '@/lib/demo-data';

// Types matching inventory system
type RawMaterialCategory = 'vegetables' | 'dairy' | 'meat' | 'grains' | 'spices' | 'oils' | 'beverages' | 'packaging' | 'cleaning' | 'frozen' | 'bakery' | 'bar' | 'kitchen' | 'others';

interface StockBatch {
  id: string;
  batchNo?: string;
  quantity: number;
  expiryDate?: string;       // YYYY-MM-DD
  mfgDate?: string;          // YYYY-MM-DD
  costPrice?: number;
}

interface RawMaterial {
  id: string;
  name: string;
  category: RawMaterialCategory;
  existingStock: number;
  unit: string;
  openingStock: number;
  closingStock: number;
  currentStock: number;
  status: 'good' | 'low' | 'excess';
  costPrice?: number;        // cost per unit in ₹
  supplier?: string;
  mfgDate?: string;          // YYYY-MM-DD
  expiryDate?: string;       // YYYY-MM-DD
  minStockAlert?: number;    // alert threshold
  storageLocation?: string;
  lastRestocked?: string;    // YYYY-MM-DD
  batches?: StockBatch[];
  barcode?: string;
}

interface RecipeIngredient {
  rawMaterialId: string;
  quantity: number;
}

interface Recipe {
  id: string;
  menuItemName: string;
  ingredients: RecipeIngredient[];
}





export default function RecipesPage() {
  // Shared rawMaterials state from localStorage
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => {
    if (typeof window !== 'undefined') {
      const isFresh = localStorage.getItem('qrestro_demo_fresh_signup') === 'true';
      const stored = localStorage.getItem('qrestro_raw_materials');
      if (stored) return JSON.parse(stored);
      if (isFresh) return [];
    }
    // Fallback to defaults
    return [
      { id: 'rm-1', name: 'Onion', category: 'vegetables', existingStock: 80, unit: 'kg', openingStock: 100, closingStock: 80, currentStock: 80, status: 'good', costPrice: 25, supplier: 'Fresh Farm Pvt Ltd', expiryDate: '2026-06-10', minStockAlert: 15, storageLocation: 'Dry Store A', lastRestocked: '2026-05-28' },
      { id: 'rm-2', name: 'Tomato', category: 'vegetables', existingStock: 8, unit: 'kg', openingStock: 40, closingStock: 8, currentStock: 8, status: 'low', costPrice: 40, supplier: 'Fresh Farm Pvt Ltd', expiryDate: '2026-06-05', minStockAlert: 10, storageLocation: 'Fridge B', lastRestocked: '2026-05-25' },
      { id: 'rm-3', name: 'Potato', category: 'vegetables', existingStock: 12, unit: 'kg', openingStock: 30, closingStock: 12, currentStock: 12, status: 'low', costPrice: 20, supplier: 'Fresh Farm Pvt Ltd', expiryDate: '2026-06-15', minStockAlert: 8, storageLocation: 'Dry Store A', lastRestocked: '2026-05-24' },
      { id: 'rm-4', name: 'Capsicum', category: 'vegetables', existingStock: 15, unit: 'kg', openingStock: 20, closingStock: 15, currentStock: 15, status: 'good', costPrice: 60, supplier: 'Fresh Farm Pvt Ltd', expiryDate: '2026-06-07', minStockAlert: 5, storageLocation: 'Fridge B', lastRestocked: '2026-05-27' },
      { id: 'rm-5', name: 'Garlic', category: 'vegetables', existingStock: 5, unit: 'kg', openingStock: 10, closingStock: 5, currentStock: 5, status: 'good', costPrice: 120, supplier: 'Fresh Farm Pvt Ltd', expiryDate: '2026-06-20', minStockAlert: 2, storageLocation: 'Dry Store A', lastRestocked: '2026-05-26' },
      { id: 'rm-6', name: 'Ginger', category: 'vegetables', existingStock: 3, unit: 'kg', openingStock: 5, closingStock: 3, currentStock: 3, status: 'good', costPrice: 100, supplier: 'Fresh Farm Pvt Ltd', expiryDate: '2026-06-18', minStockAlert: 1, storageLocation: 'Dry Store A', lastRestocked: '2026-05-26' },
      { id: 'rm-7', name: 'Coriander', category: 'vegetables', existingStock: 2, unit: 'kg', openingStock: 3, closingStock: 2, currentStock: 2, status: 'good', costPrice: 80, supplier: 'Fresh Farm Pvt Ltd', expiryDate: '2026-06-03', minStockAlert: 0.5, storageLocation: 'Fridge B', lastRestocked: '2026-05-28' },
      { id: 'rm-8', name: 'Lettuce', category: 'vegetables', existingStock: 1, unit: 'kg', openingStock: 5, closingStock: 1, currentStock: 1, status: 'low', costPrice: 150, supplier: 'Fresh Farm Pvt Ltd', expiryDate: '2026-06-02', minStockAlert: 2, storageLocation: 'Fridge B', lastRestocked: '2026-05-25' },
      { id: 'rm-9', name: 'Milk', category: 'dairy', existingStock: 40, unit: 'Ltr.', openingStock: 60, closingStock: 40, currentStock: 40, status: 'good', costPrice: 55, supplier: 'Dairyland Foods', expiryDate: '2026-06-01', minStockAlert: 10, storageLocation: 'Fridge A', lastRestocked: '2026-05-28' },
      { id: 'rm-10', name: 'Butter', category: 'dairy', existingStock: 8, unit: 'kg', openingStock: 10, closingStock: 8, currentStock: 8, status: 'good', costPrice: 480, supplier: 'Dairyland Foods', expiryDate: '2026-06-15', minStockAlert: 2, storageLocation: 'Fridge A', lastRestocked: '2026-05-26' },
      { id: 'rm-11', name: 'Cheese', category: 'dairy', existingStock: 4, unit: 'kg', openingStock: 6, closingStock: 4, currentStock: 4, status: 'good', costPrice: 550, supplier: 'Dairyland Foods', expiryDate: '2026-06-20', minStockAlert: 1, storageLocation: 'Fridge A', lastRestocked: '2026-05-25' },
      { id: 'rm-12', name: 'Paneer', category: 'dairy', existingStock: 45, unit: 'kg', openingStock: 50, closingStock: 45, currentStock: 45, status: 'good', costPrice: 350, supplier: 'Dairyland Foods', expiryDate: '2026-06-05', minStockAlert: 10, storageLocation: 'Fridge A', lastRestocked: '2026-05-27' },
      { id: 'rm-13', name: 'Cream (Amul)', category: 'dairy', existingStock: 255, unit: 'Ltr.', openingStock: 300, closingStock: 255, currentStock: 255, status: 'good', costPrice: 180, supplier: 'Dairyland Foods', expiryDate: '2026-06-10', minStockAlert: 50, storageLocation: 'Fridge A', lastRestocked: '2026-05-24' },
      { id: 'rm-14', name: 'Yogurt', category: 'dairy', existingStock: 15, unit: 'kg', openingStock: 20, closingStock: 15, currentStock: 15, status: 'good', costPrice: 80, supplier: 'Dairyland Foods', expiryDate: '2026-06-04', minStockAlert: 5, storageLocation: 'Fridge A', lastRestocked: '2026-05-27' },
      { id: 'rm-15', name: 'Chicken (Boneless)', category: 'meat', existingStock: 18, unit: 'kg', openingStock: 30, closingStock: 18, currentStock: 18, status: 'good', costPrice: 280, supplier: 'Prime Meats Ltd', expiryDate: '2026-06-01', minStockAlert: 5, storageLocation: 'Freezer A', lastRestocked: '2026-05-27' },
      { id: 'rm-22', name: 'Maida', category: 'grains', existingStock: 80, unit: 'kg', openingStock: 100, closingStock: 80, currentStock: 80, status: 'good', costPrice: 38, supplier: 'Grains & Spices Wholesale', expiryDate: '2026-10-01', minStockAlert: 20, storageLocation: 'Dry Store B', lastRestocked: '2026-05-20' },
      { id: 'rm-29', name: 'Garam Masala', category: 'spices', existingStock: 1.2, unit: 'kg', openingStock: 2, closingStock: 1.2, currentStock: 1.2, status: 'good', costPrice: 350, supplier: 'Grains & Spices Wholesale', expiryDate: '2027-04-01', minStockAlert: 0.5, storageLocation: 'Spice Rack', lastRestocked: '2026-05-10' },
      { id: 'rm-45', name: 'Chocolate Syrup', category: 'bakery', existingStock: 4, unit: 'Ltr.', openingStock: 6, closingStock: 4, currentStock: 4, status: 'good', costPrice: 350, supplier: 'Gourmet Imports', expiryDate: '2026-12-01', minStockAlert: 1, storageLocation: 'Dry Store A', lastRestocked: '2026-05-12' },
      { id: 'rm-46', name: 'Cocoa Powder', category: 'bakery', existingStock: 1.5, unit: 'kg', openingStock: 3, closingStock: 1.5, currentStock: 1.5, status: 'good', costPrice: 400, supplier: 'Gourmet Imports', expiryDate: '2027-01-01', minStockAlert: 0.5, storageLocation: 'Dry Store A', lastRestocked: '2026-05-12' },
      { id: 'rm-53', name: 'Soda Water', category: 'bar', existingStock: 24, unit: 'Btls', openingStock: 48, closingStock: 24, currentStock: 24, status: 'good', costPrice: 30, supplier: 'Deluxe Spirits Ltd', expiryDate: '2026-12-01', minStockAlert: 12, storageLocation: 'Bar Cabinet', lastRestocked: '2026-05-22' },
    ];
  });



  // Recipes State
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    if (typeof window !== 'undefined') {
      const isFresh = localStorage.getItem('qrestro_demo_fresh_signup') === 'true';
      const stored = localStorage.getItem('qrestro_recipes');
      if (stored) return JSON.parse(stored);
      if (isFresh) return [];
    }
    return [
      {
        id: 'r-1',
        menuItemName: 'Butter Chicken',
        ingredients: [
          { rawMaterialId: 'rm-15', quantity: 0.3 }, 
          { rawMaterialId: 'rm-10', quantity: 0.05 }, 
          { rawMaterialId: 'rm-2', quantity: 0.15 }, 
          { rawMaterialId: 'rm-13', quantity: 0.1 } 
        ]
      },
      {
        id: 'r-2',
        menuItemName: 'Paneer Butter Masala',
        ingredients: [
          { rawMaterialId: 'rm-12', quantity: 0.25 }, 
          { rawMaterialId: 'rm-10', quantity: 0.04 }, 
          { rawMaterialId: 'rm-2', quantity: 0.12 }, 
          { rawMaterialId: 'rm-13', quantity: 0.05 } 
        ]
      },
      {
        id: 'r-3',
        menuItemName: 'Paneer Tikka',
        ingredients: [
          { rawMaterialId: 'rm-12', quantity: 0.2 }, 
          { rawMaterialId: 'rm-10', quantity: 0.02 }, 
          { rawMaterialId: 'rm-29', quantity: 0.01 } 
        ]
      },
      {
        id: 'r-4',
        menuItemName: 'Butter Naan',
        ingredients: [
          { rawMaterialId: 'rm-22', quantity: 0.15 }, 
          { rawMaterialId: 'rm-10', quantity: 0.02 } 
        ]
      },
      {
        id: 'r-5',
        menuItemName: 'Garlic Naan',
        ingredients: [
          { rawMaterialId: 'rm-22', quantity: 0.15 }, 
          { rawMaterialId: 'rm-10', quantity: 0.02 }, 
          { rawMaterialId: 'rm-5', quantity: 0.01 } 
        ]
      },
      {
        id: 'r-6',
        menuItemName: 'Fresh Lime Soda',
        ingredients: [
          { rawMaterialId: 'rm-53', quantity: 1 } 
        ]
      },
      {
        id: 'r-7',
        menuItemName: 'Chocolate Fondant',
        ingredients: [
          { rawMaterialId: 'rm-45', quantity: 0.1 }, 
          { rawMaterialId: 'rm-46', quantity: 0.05 }, 
          { rawMaterialId: 'rm-10', quantity: 0.05 } 
        ]
      }
    ];
  });



  const [searchQuery, setSearchQuery] = useState('');
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeForm, setRecipeForm] = useState<{
    id?: string;
    menuItemName: string;
    ingredients: { rawMaterialId: string; quantity: number }[];
  }>({
    menuItemName: '',
    ingredients: [{ rawMaterialId: '', quantity: 0 }]
  });

  // Persist local states back to localStorage
  useEffect(() => {
    localStorage.setItem('qrestro_raw_materials', JSON.stringify(rawMaterials));
  }, [rawMaterials]);



  useEffect(() => {
    localStorage.setItem('qrestro_recipes', JSON.stringify(recipes));
  }, [recipes]);

  // Recipe Capacity Calculations
  const getRecipeCapacity = (recipe: Recipe) => {
    let minCapacity = Infinity;
    if (recipe.ingredients.length === 0) return 0;
    
    recipe.ingredients.forEach(ing => {
      const material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
      if (!material) {
        minCapacity = 0;
        return;
      }
      const capacity = Math.floor(material.currentStock / ing.quantity);
      if (capacity < minCapacity) {
        minCapacity = capacity;
      }
    });
    return minCapacity === Infinity ? 0 : minCapacity;
  };



  // Save recipe (add/edit)
  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeForm.menuItemName) return;
    const cleanIngredients = recipeForm.ingredients.filter(i => i.rawMaterialId && i.quantity > 0);
    if (cleanIngredients.length === 0) {
      alert('Please add at least one ingredient.');
      return;
    }

    if (recipeForm.id) {
      setRecipes(prev => prev.map(r => r.id === recipeForm.id ? { ...r, menuItemName: recipeForm.menuItemName, ingredients: cleanIngredients } : r));
    } else {
      const newRecipe: Recipe = {
        id: `r-${Date.now()}`,
        menuItemName: recipeForm.menuItemName,
        ingredients: cleanIngredients
      };
      setRecipes(prev => [...prev, newRecipe]);
    }
    setIsRecipeModalOpen(false);
  };

  // Delete recipe
  const handleDeleteRecipe = (recipeId: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#2C261F] flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-[#B88A52]" />
            <span>Recipes & Ingredient Requirements</span>
          </h1>
          <p className="text-[#8C8375] text-sm mt-1">Configure dish proportions and track live kitchen ingredient preparation capacities in real-time.</p>
        </div>
      </div>

      {/* RECIPE BOOK */}
      <div className="bg-white border border-[#E6E1DA] rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-[#F0ECE6] flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FCFAF7]">
              <div>
                <h3 className="text-sm font-bold text-[#2C261F] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#B88A52]" />
                  <span>Recipe Book</span>
                </h3>
                <p className="text-[11px] text-[#8C8375] mt-0.5 font-medium">Manage recipe proportions and check prep capacities in real-time.</p>
              </div>
              <button
                onClick={() => {
                  setRecipeForm({
                    menuItemName: '',
                    ingredients: [{ rawMaterialId: '', quantity: 0 }]
                  });
                  setIsRecipeModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer shadow-[#B88A52]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Recipe</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-[#F0ECE6] bg-[#FCFAF7]/50">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8C8375]" />
                <input
                  type="text"
                  placeholder="Search recipes by item name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl text-xs bg-white outline-none transition-all placeholder-[#A89F90] font-medium text-[#2C261F]"
                />
              </div>
            </div>

            <div className="divide-y divide-[#F3EFEA] bg-white">
              {recipes.filter(r => r.menuItemName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8C8375] font-semibold">
                  No matching recipes found.
                </div>
              ) : (
                recipes
                  .filter(r => r.menuItemName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(recipe => {
                    const capacity = getRecipeCapacity(recipe);
                    let statusBadge = '';
                    if (capacity === 0) {
                      statusBadge = 'bg-rose-50 text-rose-600 border border-rose-100';
                    } else if (capacity < 20) {
                      statusBadge = 'bg-amber-50 text-amber-600 border border-amber-100';
                    } else {
                      statusBadge = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                    }

                    return (
                      <div key={recipe.id} className="p-5 hover:bg-[#FAF9F6]/20 transition-all space-y-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-[#FAF4EB] rounded-lg border border-[#FAF0E2] text-[#B88A52]">
                              <ChefHat className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#2C261F]">{recipe.menuItemName}</h4>
                              <span className="text-[10px] font-medium text-[#8C8375]">
                                {recipe.ingredients.length} ingredients mapped
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide", statusBadge)}>
                              {capacity === 0 ? 'Out of Stock' : capacity < 20 ? 'Running Low' : 'Fully Stocked'} ({capacity} orders prep-ready)
                            </span>

                            <button
                              onClick={() => {
                                setRecipeForm({
                                  id: recipe.id,
                                  menuItemName: recipe.menuItemName,
                                  ingredients: recipe.ingredients.map(i => ({ ...i }))
                                });
                                setIsRecipeModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-[#E6E1DA] hover:bg-[#FAF7F2] text-[#8C8375] hover:text-[#B88A52] transition-colors cursor-pointer"
                              title="Edit Recipe"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecipe(recipe.id)}
                              className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Recipe"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Recipe Ingredients table */}
                        <div className="pl-0 sm:pl-11 pt-1.5">
                          <div className="border border-[#F0ECE6] rounded-xl overflow-hidden bg-[#FCFAF7]/30">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#FAF9F6] border-b border-[#F0ECE6] text-[9px] uppercase tracking-wider font-extrabold text-[#8C8375]">
                                  <th className="py-2 px-3.5">Raw Ingredient</th>
                                  <th className="py-2 px-3 text-right">Required (Per Food)</th>
                                  <th className="py-2 px-3 text-right">Current Stock</th>
                                  <th className="py-2 px-3.5 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F0ECE6] text-[11px] font-semibold text-[#5A5348]">
                                {recipe.ingredients.map(ing => {
                                  const material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
                                  const currentStock = material?.currentStock || 0;
                                  const unit = material?.unit || '';
                                  const isCritical = currentStock <= (material?.minStockAlert || 0);

                                  return (
                                    <tr key={ing.rawMaterialId} className="hover:bg-white/40">
                                      <td className="py-2 px-3.5 font-bold text-[#2C261F]">{material?.name || 'Unknown Item'}</td>
                                      <td className="py-2 px-3 text-right text-[#8C8375]">{ing.quantity} {unit}</td>
                                      <td className="py-2 px-3 text-right font-bold text-[#2C261F]">{currentStock} {unit}</td>
                                      <td className="py-2 px-3.5 text-center">
                                        {currentStock === 0 ? (
                                          <span className="text-red-500 text-[10px] font-bold">⚠️ Out of Stock</span>
                                        ) : isCritical ? (
                                          <span className="text-amber-500 text-[10px] font-bold">⚠️ Low Stock</span>
                                        ) : (
                                          <span className="text-emerald-600 text-[10px] font-bold">✓ OK</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

      {/* CREATE / EDIT RECIPE MODAL */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#23201D]/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-[#E6E1DA] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#F0ECE6]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FAF4EB] rounded-lg text-[#B88A52] border border-[#FAF0E2]">
                  <ChefHat className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C261F]">
                    {recipeForm.id ? 'Edit Recipe Configuration' : 'Create New Recipe'}
                  </h3>
                  <p className="text-[10px] text-[#8C8375]">Map menu items to their required ingredients</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsRecipeModalOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="overflow-y-auto p-6 pt-4 space-y-4 flex-1">
              {/* Menu Item Selector */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">
                  Menu Product *
                </label>
                {recipeForm.id ? (
                  <input
                    type="text"
                    disabled
                    value={recipeForm.menuItemName}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] bg-gray-50 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={recipeForm.menuItemName}
                    onChange={(e) => setRecipeForm(prev => ({ ...prev, menuItemName: e.target.value }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Menu Item --</option>
                    {demoMenuItems
                      .filter(item => !recipes.some(r => r.menuItemName === item.name))
                      .map(item => (
                        <option key={item.id} value={item.name}>
                          {item.name} ({item.is_vegetarian ? 'Veg' : 'Non-Veg'})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Ingredients List builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-1.5">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375]">
                    Ingredients & Proportions
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipeForm(prev => ({
                        ...prev,
                        ingredients: [...prev.ingredients, { rawMaterialId: '', quantity: 0 }]
                      }));
                    }}
                    className="text-[10px] font-bold text-[#B88A52] hover:text-[#C99E65] transition-colors cursor-pointer"
                  >
                    + Add Ingredient
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                  {recipeForm.ingredients.map((ing, index) => {
                    const selectedMat = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
                    return (
                      <div key={index} className="flex items-center gap-2.5 bg-[#FCFAF7] p-2.5 rounded-xl border border-[#F0ECE6]">
                        {/* Material Select */}
                        <div className="flex-1">
                          <select
                            value={ing.rawMaterialId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecipeForm(prev => {
                                const list = [...prev.ingredients];
                                list[index].rawMaterialId = val;
                                return { ...prev, ingredients: list };
                              });
                            }}
                            className="w-full text-xs font-semibold px-2.5 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-lg bg-white outline-none text-[#5A5348] cursor-pointer"
                            required
                          >
                            <option value="">-- Choose Ingredient --</option>
                            {rawMaterials.map(rm => (
                              <option key={rm.id} value={rm.id}>
                                {rm.name} ({rm.category})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity Input */}
                        <div className="w-28 flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="Qty"
                            value={ing.quantity || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setRecipeForm(prev => {
                                const list = [...prev.ingredients];
                                list[index].quantity = val;
                                return { ...prev, ingredients: list };
                              });
                            }}
                            className="w-full text-xs font-bold px-2 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-lg outline-none text-[#2C261F]"
                            required
                          />
                          <span className="text-[10px] text-[#8C8375] font-bold shrink-0 min-w-[30px]">
                            {selectedMat?.unit || '—'}
                          </span>
                        </div>

                        {/* Remove Ingredient button */}
                        <button
                          type="button"
                          onClick={() => {
                            setRecipeForm(prev => {
                              const list = prev.ingredients.filter((_, idx) => idx !== index);
                              return {
                                ...prev,
                                ingredients: list.length > 0 ? list : [{ rawMaterialId: '', quantity: 0 }]
                              };
                            });
                          }}
                          className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#F0ECE6]">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-[#B88A52]/20 cursor-pointer"
                >
                  Save Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
