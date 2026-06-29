'use client';

import { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Package, Plus, Search, Filter, AlertTriangle, CheckCircle, 
  Trash2, ShoppingBag, TrendingUp, Calendar, ArrowRight, X, Sparkles, ArrowUpRight, ChevronRight, Pencil,
  Clock, FileText, Download, Truck, Warehouse, ChefHat, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import { demoMenuItems } from '@/lib/demo-data';

// Types for our inventory system
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



interface SupplierContact {
  name: string;
  mobile?: string;
  email?: string;
}

interface SalesInventoryItem {
  id: string;
  menuProduct: string;
  quantitySold: number;
  estimatedRawMaterialUsed: string;
  date: string;
}

interface WastageItem {
  id: string;
  name: string;
  date: string;
  quantity: number;
  unit: string;
  reason: 'Spoilage' | 'Spillage' | 'Expired' | 'Theft' | 'Other';
  cost: number;
}

interface PurchaseOrder {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  orderDate: string;
  supplier: string;
  status: 'draft' | 'pending' | 'completed';
  totalCost: number;
  notes?: string;
  deliveredQty?: number;
  purchasePrice?: number;
  batchNo?: string;
  mfgDate?: string;
  expiryDate?: string;
}

// FIFO Batch tracking helper function
const updateMaterialBatches = (
  existingBatches: StockBatch[] | undefined,
  currentStock: number,
  newStock: number,
  newBatchExpiryDate?: string,
  newBatchMfgDate?: string,
  fallbackExpiryDate?: string,
  materialId?: string
): StockBatch[] => {
  let batches = existingBatches ? [...existingBatches].filter(b => b.quantity > 0) : [];
  
  if (batches.length === 0 && currentStock > 0) {
    batches = [
      {
        id: `${materialId || 'rm'}-b-init`,
        quantity: currentStock,
        expiryDate: fallbackExpiryDate
      }
    ];
  }

  if (newStock > currentStock) {
    const addedQty = newStock - currentStock;
    const newBatch: StockBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      quantity: addedQty,
      expiryDate: newBatchExpiryDate || fallbackExpiryDate,
      mfgDate: newBatchMfgDate
    };
    batches.push(newBatch);
  } else if (newStock < currentStock) {
    let qtyToRemove = currentStock - newStock;
    const updatedBatches: StockBatch[] = [];

    for (const batch of batches) {
      if (qtyToRemove <= 0) {
        updatedBatches.push(batch);
      } else if (batch.quantity <= qtyToRemove) {
        qtyToRemove -= batch.quantity;
      } else {
        updatedBatches.push({
          ...batch,
          quantity: batch.quantity - qtyToRemove
        });
        qtyToRemove = 0;
      }
    }
    batches = updatedBatches;
  }
  
  return batches;
};

const getMockMaterials = (): RawMaterial[] => {
  const mockItems: RawMaterial[] = [
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
    { id: 'rm-16', name: 'Mutton', category: 'meat', existingStock: 5, unit: 'kg', openingStock: 15, closingStock: 5, currentStock: 5, status: 'low', costPrice: 650, supplier: 'Prime Meats Ltd', expiryDate: '2026-06-01', minStockAlert: 4, storageLocation: 'Freezer A', lastRestocked: '2026-05-26' },
    { id: 'rm-17', name: 'Fish (Rohu)', category: 'meat', existingStock: 8, unit: 'kg', openingStock: 12, closingStock: 8, currentStock: 8, status: 'good', costPrice: 220, supplier: 'Ocean Fresh Seafood', expiryDate: '2026-06-01', minStockAlert: 3, storageLocation: 'Freezer A', lastRestocked: '2026-05-28' },
    { id: 'rm-18', name: 'Prawns', category: 'meat', existingStock: 3, unit: 'kg', openingStock: 8, closingStock: 3, currentStock: 3, status: 'low', costPrice: 480, supplier: 'Ocean Fresh Seafood', expiryDate: '2026-06-01', minStockAlert: 2, storageLocation: 'Freezer A', lastRestocked: '2026-05-25' },
    { id: 'rm-19', name: 'Eggs', category: 'meat', existingStock: 72, unit: 'Pcs', openingStock: 120, closingStock: 72, currentStock: 72, status: 'good', costPrice: 7, supplier: 'Prime Meats Ltd', expiryDate: '2026-06-12', minStockAlert: 24, storageLocation: 'Fridge B', lastRestocked: '2026-05-27' },
    { id: 'rm-20', name: 'Basmati Rice', category: 'grains', existingStock: 480, unit: 'kg', openingStock: 600, closingStock: 480, currentStock: 480, status: 'good', costPrice: 90, supplier: 'Grains & Spices Wholesale', expiryDate: '2027-05-01', minStockAlert: 100, storageLocation: 'Dry Store B', lastRestocked: '2026-05-20' },
    { id: 'rm-21', name: 'Atta (Wheat Flour)', category: 'grains', existingStock: 1020, unit: 'kg', openingStock: 1200, closingStock: 1020, currentStock: 1020, status: 'good', costPrice: 42, supplier: 'Grains & Spices Wholesale', expiryDate: '2026-11-01', minStockAlert: 200, storageLocation: 'Dry Store B', lastRestocked: '2026-05-18' },
    { id: 'rm-22', name: 'Maida', category: 'grains', existingStock: 80, unit: 'kg', openingStock: 100, closingStock: 80, currentStock: 80, status: 'good', costPrice: 38, supplier: 'Grains & Spices Wholesale', expiryDate: '2026-10-01', minStockAlert: 20, storageLocation: 'Dry Store B', lastRestocked: '2026-05-20' },
    { id: 'rm-23', name: 'Pasta', category: 'grains', existingStock: 12, unit: 'kg', openingStock: 20, closingStock: 12, currentStock: 12, status: 'good', costPrice: 120, supplier: 'Grains & Spices Wholesale', expiryDate: '2027-01-01', minStockAlert: 4, storageLocation: 'Dry Store B', lastRestocked: '2026-05-15' },
    { id: 'rm-24', name: 'Lentils (Dal)', category: 'grains', existingStock: 60, unit: 'kg', openingStock: 80, closingStock: 60, currentStock: 60, status: 'good', costPrice: 100, supplier: 'Grains & Spices Wholesale', expiryDate: '2027-03-01', minStockAlert: 15, storageLocation: 'Dry Store B', lastRestocked: '2026-05-15' },
    { id: 'rm-25', name: 'Salt', category: 'spices', existingStock: 15, unit: 'kg', openingStock: 20, closingStock: 15, currentStock: 15, status: 'good', costPrice: 18, supplier: 'Grains & Spices Wholesale', expiryDate: '2028-01-01', minStockAlert: 3, storageLocation: 'Spice Rack', lastRestocked: '2026-05-10' },
    { id: 'rm-26', name: 'Black Pepper', category: 'spices', existingStock: 1.5, unit: 'kg', openingStock: 3, closingStock: 1.5, currentStock: 1.5, status: 'good', costPrice: 600, supplier: 'Grains & Spices Wholesale', expiryDate: '2027-06-01', minStockAlert: 0.5, storageLocation: 'Spice Rack', lastRestocked: '2026-05-10' },
    { id: 'rm-27', name: 'Turmeric Powder', category: 'spices', existingStock: 2, unit: 'kg', openingStock: 3, closingStock: 2, currentStock: 2, status: 'good', costPrice: 180, supplier: 'Grains & Spices Wholesale', expiryDate: '2027-05-01', minStockAlert: 0.5, storageLocation: 'Spice Rack', lastRestocked: '2026-05-10' },
    { id: 'rm-28', name: 'Chili Powder', category: 'spices', existingStock: 0.8, unit: 'kg', openingStock: 3, closingStock: 0.8, currentStock: 0.8, status: 'low', costPrice: 200, supplier: 'Grains & Spices Wholesale', expiryDate: '2027-05-01', minStockAlert: 1, storageLocation: 'Spice Rack', lastRestocked: '2026-05-05' },
    { id: 'rm-29', name: 'Garam Masala', category: 'spices', existingStock: 1.2, unit: 'kg', openingStock: 2, closingStock: 1.2, currentStock: 1.2, status: 'good', costPrice: 350, supplier: 'Grains & Spices Wholesale', expiryDate: '2027-04-01', minStockAlert: 0.5, storageLocation: 'Spice Rack', lastRestocked: '2026-05-10' },
    { id: 'rm-30', name: 'Cooking Oil', category: 'oils', existingStock: 180, unit: 'Ltr.', openingStock: 200, closingStock: 180, currentStock: 180, status: 'good', costPrice: 130, supplier: 'Grains & Spices Wholesale', expiryDate: '2027-01-01', minStockAlert: 30, storageLocation: 'Dry Store B', lastRestocked: '2026-05-15' },
    { id: 'rm-31', name: 'Olive Oil', category: 'oils', existingStock: 5, unit: 'Ltr.', openingStock: 8, closingStock: 5, currentStock: 5, status: 'good', costPrice: 600, supplier: 'Gourmet Imports', expiryDate: '2027-03-01', minStockAlert: 2, storageLocation: 'Dry Store B', lastRestocked: '2026-05-12' },
    { id: 'rm-32', name: 'Soy Sauce', category: 'oils', existingStock: 3, unit: 'Ltr.', openingStock: 5, closingStock: 3, currentStock: 3, status: 'good', costPrice: 200, supplier: 'Gourmet Imports', expiryDate: '2027-06-01', minStockAlert: 1, storageLocation: 'Dry Store B', lastRestocked: '2026-05-12' },
    { id: 'rm-33', name: 'Soft Drinks (Cans)', category: 'beverages', existingStock: 60, unit: 'Pcs', openingStock: 120, closingStock: 60, currentStock: 60, status: 'good', costPrice: 40, supplier: 'Deluxe Spirits Ltd', expiryDate: '2026-12-01', minStockAlert: 24, storageLocation: 'Beverage Store', lastRestocked: '2026-05-22' },
    { id: 'rm-34', name: 'Mineral Water (500ml)', category: 'beverages', existingStock: 3, unit: 'Box', openingStock: 10, closingStock: 3, currentStock: 3, status: 'low', costPrice: 500, supplier: 'Deluxe Spirits Ltd', expiryDate: '2027-01-01', minStockAlert: 3, storageLocation: 'Beverage Store', lastRestocked: '2026-05-20' },
    { id: 'rm-35', name: 'Coffee Beans', category: 'beverages', existingStock: 4, unit: 'kg', openingStock: 6, closingStock: 4, currentStock: 4, status: 'good', costPrice: 800, supplier: 'Gourmet Imports', expiryDate: '2026-10-01', minStockAlert: 1, storageLocation: 'Dry Store A', lastRestocked: '2026-05-15' },
    { id: 'rm-36', name: 'Tea Powder', category: 'beverages', existingStock: 3, unit: 'kg', openingStock: 4, closingStock: 3, currentStock: 3, status: 'good', costPrice: 250, supplier: 'Grains & Spices Wholesale', expiryDate: '2026-11-01', minStockAlert: 1, storageLocation: 'Dry Store A', lastRestocked: '2026-05-15' },
    { id: 'rm-37', name: 'Juice Bottles', category: 'beverages', existingStock: 24, unit: 'Pcs', openingStock: 48, closingStock: 24, currentStock: 24, status: 'good', costPrice: 60, supplier: 'Deluxe Spirits Ltd', expiryDate: '2026-09-01', minStockAlert: 12, storageLocation: 'Beverage Store', lastRestocked: '2026-05-22' },
    { id: 'rm-38', name: 'Paper Bags', category: 'packaging', existingStock: 200, unit: 'Pcs', openingStock: 500, closingStock: 200, currentStock: 200, status: 'good', costPrice: 3, supplier: 'PackRight Solutions', expiryDate: '', minStockAlert: 100, storageLocation: 'Supply Room', lastRestocked: '2026-05-10' },
    { id: 'rm-39', name: 'Plastic Containers', category: 'packaging', existingStock: 50, unit: 'Pcs', openingStock: 300, closingStock: 50, currentStock: 50, status: 'low', costPrice: 5, supplier: 'PackRight Solutions', expiryDate: '', minStockAlert: 100, storageLocation: 'Supply Room', lastRestocked: '2026-05-05' },
    { id: 'rm-40', name: 'Pizza Boxes', category: 'packaging', existingStock: 80, unit: 'Pcs', openingStock: 200, closingStock: 80, currentStock: 80, status: 'good', costPrice: 12, supplier: 'PackRight Solutions', expiryDate: '', minStockAlert: 50, storageLocation: 'Supply Room', lastRestocked: '2026-05-12' },
    { id: 'rm-41', name: 'Tissue Papers (Pack)', category: 'packaging', existingStock: 30, unit: 'Pcs', openingStock: 50, closingStock: 30, currentStock: 30, status: 'good', costPrice: 25, supplier: 'PackRight Solutions', expiryDate: '', minStockAlert: 10, storageLocation: 'Supply Room', lastRestocked: '2026-05-15' },
    { id: 'rm-42', name: 'Frozen Fries', category: 'frozen', existingStock: 25, unit: 'kg', openingStock: 40, closingStock: 25, currentStock: 25, status: 'good', costPrice: 120, supplier: 'FrostyFoods Ltd', expiryDate: '2026-12-01', minStockAlert: 8, storageLocation: 'Freezer B', lastRestocked: '2026-05-20' },
    { id: 'rm-43', name: 'Frozen Nuggets', category: 'frozen', existingStock: 8, unit: 'kg', openingStock: 15, closingStock: 8, currentStock: 8, status: 'good', costPrice: 280, supplier: 'FrostyFoods Ltd', expiryDate: '2026-11-01', minStockAlert: 3, storageLocation: 'Freezer B', lastRestocked: '2026-05-20' },
    { id: 'rm-44', name: 'Ice Cream Stock', category: 'frozen', existingStock: 2, unit: 'kg', openingStock: 8, closingStock: 2, currentStock: 2, status: 'low', costPrice: 400, supplier: 'FrostyFoods Ltd', expiryDate: '2026-10-01', minStockAlert: 3, storageLocation: 'Freezer B', lastRestocked: '2026-05-15' },
    { id: 'rm-45', name: 'Chocolate Syrup', category: 'bakery', existingStock: 4, unit: 'Ltr.', openingStock: 6, closingStock: 4, currentStock: 4, status: 'good', costPrice: 350, supplier: 'Gourmet Imports', expiryDate: '2026-12-01', minStockAlert: 1, storageLocation: 'Dry Store A', lastRestocked: '2026-05-12' },
    { id: 'rm-46', name: 'Cocoa Powder', category: 'bakery', existingStock: 1.5, unit: 'kg', openingStock: 3, closingStock: 1.5, currentStock: 1.5, status: 'good', costPrice: 400, supplier: 'Gourmet Imports', expiryDate: '2027-01-01', minStockAlert: 0.5, storageLocation: 'Dry Store A', lastRestocked: '2026-05-12' },
    { id: 'rm-47', name: 'Yeast', category: 'bakery', existingStock: 0.3, unit: 'kg', openingStock: 1, closingStock: 0.3, currentStock: 0.3, status: 'low', costPrice: 500, supplier: 'Grains & Spices Wholesale', expiryDate: '2026-08-01', minStockAlert: 0.3, storageLocation: 'Fridge A', lastRestocked: '2026-05-08' },
    { id: 'rm-48', name: 'Dishwash Liquid', category: 'cleaning', existingStock: 6, unit: 'Ltr.', openingStock: 10, closingStock: 6, currentStock: 6, status: 'good', costPrice: 120, supplier: 'CleanPro Supplies', expiryDate: '2027-06-01', minStockAlert: 2, storageLocation: 'Utility Room', lastRestocked: '2026-05-10' },
    { id: 'rm-49', name: 'Sanitizer (500ml)', category: 'cleaning', existingStock: 4, unit: 'Pcs', openingStock: 10, closingStock: 4, currentStock: 4, status: 'good', costPrice: 180, supplier: 'CleanPro Supplies', expiryDate: '2027-01-01', minStockAlert: 2, storageLocation: 'Utility Room', lastRestocked: '2026-05-10' },
    { id: 'rm-50', name: 'Garbage Bags (Roll)', category: 'cleaning', existingStock: 2, unit: 'Pcs', openingStock: 8, closingStock: 2, currentStock: 2, status: 'low', costPrice: 60, supplier: 'CleanPro Supplies', expiryDate: '', minStockAlert: 3, storageLocation: 'Utility Room', lastRestocked: '2026-05-05' },
    { id: 'rm-51', name: '100 Pipers (Scotch)', category: 'bar', existingStock: 52, unit: 'Btls', openingStock: 60, closingStock: 52, currentStock: 52, status: 'good', costPrice: 1500, supplier: 'Deluxe Spirits Ltd', expiryDate: '', minStockAlert: 12, storageLocation: 'Bar Cabinet', lastRestocked: '2026-05-22' },
    { id: 'rm-52', name: 'Mocktail Syrups', category: 'bar', existingStock: 8, unit: 'Btls', openingStock: 12, closingStock: 8, currentStock: 8, status: 'good', costPrice: 350, supplier: 'Gourmet Imports', expiryDate: '2027-01-01', minStockAlert: 3, storageLocation: 'Bar Cabinet', lastRestocked: '2026-05-15' },
    { id: 'rm-53', name: 'Soda Water', category: 'bar', existingStock: 24, unit: 'Btls', openingStock: 48, closingStock: 24, currentStock: 24, status: 'good', costPrice: 30, supplier: 'Deluxe Spirits Ltd', expiryDate: '2026-12-01', minStockAlert: 12, storageLocation: 'Bar Cabinet', lastRestocked: '2026-05-22' },
  ];
  return mockItems.map(item => ({
    ...item,
    batches: item.batches || (item.expiryDate ? [{ id: `${item.id}-b1`, quantity: item.currentStock, expiryDate: item.expiryDate, mfgDate: item.mfgDate, costPrice: item.costPrice }] : [])
  }));
};

const getMockSales = (): SalesInventoryItem[] => [
  { id: 's-1', menuProduct: 'French Fries (Large)', quantitySold: 42, estimatedRawMaterialUsed: '8.4 kg Potato', date: '2026-05-26' },
  { id: 's-2', menuProduct: 'Aloo Tikki Burger', quantitySold: 28, estimatedRawMaterialUsed: '28 Dish Aloo Tikki', date: '2026-05-26' },
  { id: 's-3', menuProduct: 'Paneer Butter Masala', quantitySold: 18, estimatedRawMaterialUsed: '4.5 kg Paneer, 1.8 Ltr. Amul Cream', date: '2026-05-26' },
  { id: 's-4', menuProduct: 'Butter Chicken (Half)', quantitySold: 22, estimatedRawMaterialUsed: '2.2 Ltr. Amul Cream', date: '2026-05-25' },
  { id: 's-5', menuProduct: 'Butter Naan', quantitySold: 120, estimatedRawMaterialUsed: '12 kg Aata', date: '2026-05-25' },
];

const getMockWastage = (): WastageItem[] => [
  { id: 'w-1', name: 'Tomatoes', date: '2026-05-25', quantity: 2.5, unit: 'kg', reason: 'Spoilage', cost: 120 },
  { id: 'w-2', name: 'Amul Cream', date: '2026-05-24', quantity: 1, unit: 'Ltr.', reason: 'Expired', cost: 180 },
  { id: 'w-3', name: 'Aloo Tikki', date: '2026-05-23', quantity: 5, unit: 'Dish', reason: 'Spillage', cost: 150 },
];

const getMockPOs = (): PurchaseOrder[] => [
  { id: 'po-1', itemName: 'Potato', quantity: 100, unit: 'kg', orderDate: '2026-05-26', supplier: 'Fresh Veggies Corp', status: 'pending', totalCost: 0, notes: 'Urgent refill for high demand weekend.' },
  { id: 'po-2', itemName: '100 Pipers', quantity: 24, unit: 'Btls', orderDate: '2026-05-24', supplier: 'Deluxe Spirits Ltd', status: 'draft', totalCost: 0, notes: 'Procuring premium stock for the bar section.' },
  { id: 'po-3', itemName: 'Amul Cream', quantity: 50, unit: 'Ltr.', orderDate: '2026-05-22', supplier: 'Dairyland Foods', status: 'completed', totalCost: 7500, deliveredQty: 50, purchasePrice: 7500, batchNo: 'BAT-003', mfgDate: '2026-05-21', expiryDate: '2026-06-05', notes: 'Need high fat fresh cream for curries.' },
  { id: 'po-4', itemName: 'Tomatoes', quantity: 50, unit: 'kg', orderDate: '2026-05-25', supplier: 'Fresh Veggies Corp', status: 'pending', totalCost: 0, notes: 'Fresh local farm tomatoes preferred.' },
];

const getMockSuppliers = (): SupplierContact[] => [
  { name: "Fresh Farm Pvt Ltd", mobile: "+91 98765 43210", email: "orders@freshfarm.com" },
  { name: "Fresh Veggies Corp", mobile: "+91 87654 32109", email: "sales@freshveggies.com" },
  { name: "Deluxe Spirits Ltd", mobile: "+91 76543 21098" },
  { name: "Dairyland Foods", email: "delivery@dairyland.com" },
  { name: "Grains & Spices Wholesale" },
  { name: "Prime Meats Ltd" },
  { name: "Ocean Fresh Seafood" },
  { name: "Gourmet Imports" },
  { name: "PackRight Solutions" },
  { name: "FrostyFoods Ltd" },
  { name: "CleanPro Supplies" }
];

const getMockStorage = (): string[] => [
  'Dry Store A',
  'Dry Store B',
  'Fridge A',
  'Fridge B',
  'Freezer A',
  'Freezer B',
  'Beverage Store',
  'Bar Cabinet',
  'Supply Room',
  'Utility Room',
  'Spice Rack'
];

function InventoryPageContent() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [salesData, setSalesData] = useState<SalesInventoryItem[]>([]);
  const [wastageData, setWastageData] = useState<WastageItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierContact[]>([]);
  const [storageSections, setStorageSections] = useState<string[]>([]);
  const [isInventoryLoaded, setIsInventoryLoaded] = useState(false);

  useEffect(() => {
    const fresh = localStorage.getItem('qrestro_demo_fresh_signup') === 'true';

    // 1. rawMaterials
    const storedRM = localStorage.getItem('qrestro_raw_materials');
    if (storedRM) {
      try { setRawMaterials(JSON.parse(storedRM)); } catch { setRawMaterials(fresh ? [] : getMockMaterials()); }
    } else {
      setRawMaterials(fresh ? [] : getMockMaterials());
    }

    // 2. salesData
    const storedSales = localStorage.getItem('qrestro_sales_data');
    if (storedSales) {
      try { setSalesData(JSON.parse(storedSales)); } catch { setSalesData(fresh ? [] : getMockSales()); }
    } else {
      setSalesData(fresh ? [] : getMockSales());
    }

    // 3. wastageData
    const storedWastage = localStorage.getItem('qrestro_wastage_data');
    if (storedWastage) {
      try { setWastageData(JSON.parse(storedWastage)); } catch { setWastageData(fresh ? [] : getMockWastage()); }
    } else {
      setWastageData(fresh ? [] : getMockWastage());
    }

    // 4. purchaseOrders
    const storedPOs = localStorage.getItem('qrestro_purchase_orders');
    if (storedPOs) {
      try { setPurchaseOrders(JSON.parse(storedPOs)); } catch { setPurchaseOrders(fresh ? [] : getMockPOs()); }
    } else {
      setPurchaseOrders(fresh ? [] : getMockPOs());
    }

    // 5. suppliers
    const storedSuppliers = localStorage.getItem('qrestro_suppliers');
    if (storedSuppliers) {
      try { setSuppliers(JSON.parse(storedSuppliers)); } catch { setSuppliers(getMockSuppliers()); }
    } else {
      setSuppliers(getMockSuppliers());
    }

    // 6. storageSections
    const storedStorage = localStorage.getItem('qrestro_storage_sections');
    if (storedStorage) {
      try { setStorageSections(JSON.parse(storedStorage)); } catch { setStorageSections(getMockStorage()); }
    } else {
      setStorageSections(getMockStorage());
    }

    setIsInventoryLoaded(true);
  }, []);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // 2. Active Tab and Row states
  const [activeTab, setActiveTab] = useState<'raw_materials' | 'sales' | 'wastage' | 'purchase_orders'>('raw_materials');

  useEffect(() => {
    if (tabParam === 'purchase_orders') {
      setActiveTab('purchase_orders');
    } else if (tabParam === 'raw_materials') {
      setActiveTab('raw_materials');
    } else if (tabParam === 'sales') {
      setActiveTab('sales');
    } else if (tabParam === 'wastage') {
      setActiveTab('wastage');
    }
  }, [tabParam]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('rm-5'); // Potato selected by default
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('vegetables');

  // 3. Modal Toggles
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isSuppliersModalOpen, setIsSuppliersModalOpen] = useState(false);
  const [newSupplierInput, setNewSupplierInput] = useState('');
  const [newSupplierMobile, setNewSupplierMobile] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [newStorageInput, setNewStorageInput] = useState('');
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);

  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddCustomUnit, setIsAddCustomUnit] = useState(false);
  const [isEditCustomUnit, setIsEditCustomUnit] = useState(false);

  const [editingSupplierName, setEditingSupplierName] = useState<string | null>(null);

  // Supplier addition states per modal
  const [isAddingPoSupplier, setIsAddingPoSupplier] = useState(false);
  const [newPoSupplierName, setNewPoSupplierName] = useState('');

  const [isAddingReceiveSupplier, setIsAddingReceiveSupplier] = useState(false);
  const [newReceiveSupplierName, setNewReceiveSupplierName] = useState('');

  const [isAddingAddMaterialSupplier, setIsAddingAddMaterialSupplier] = useState(false);
  const [newAddMaterialSupplierName, setNewAddMaterialSupplierName] = useState('');

  const [isAddingEditMaterialSupplier, setIsAddingEditMaterialSupplier] = useState(false);
  const [newEditMaterialSupplierName, setNewEditMaterialSupplierName] = useState('');

  // Storage section addition states per modal
  const [isAddingAddMaterialStorage, setIsAddingAddMaterialStorage] = useState(false);
  const [newAddMaterialStorageName, setNewAddMaterialStorageName] = useState('');

  const [isAddingEditMaterialStorage, setIsAddingEditMaterialStorage] = useState(false);
  const [newEditMaterialStorageName, setNewEditMaterialStorageName] = useState('');

  // Selected Category Section in Create/Edit PO modal
  const [poModalCategory, setPoModalCategory] = useState<string>('vegetables');

  // Add Material Form State
  const [addMaterialForm, setAddMaterialForm] = useState({
    name: '',
    category: 'vegetables' as RawMaterialCategory,
    unit: 'kg',
    openingStock: 0,
    currentStock: 0,
    costPrice: 0,
    supplier: '',
    expiryDate: '',
    minStockAlert: 0,
    storageLocation: '',
  });



  // 4. Modal Form States
  const [stockForm, setStockForm] = useState({
    materialId: 'rm-5',
    openingStock: 30,
    closingStock: 12,
    newBatchExpiryDate: '',
  });

  const [wastageForm, setWastageForm] = useState({
    materialId: 'rm-5',
    quantity: 1,
    reason: 'Spoilage' as WastageItem['reason'],
    cost: 50,
  });

  const [poForm, setPoForm] = useState({
    itemName: 'Potato',
    quantity: 50,
    unit: 'kg',
    supplier: '',
    totalCost: 0,
    orderDate: '',
    status: 'pending' as PurchaseOrder['status'],
    notes: '',
  });

  const [editingPoId, setEditingPoId] = useState<string | null>(null);

  // Receive Stock Modal State
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
  const [receivingPoId, setReceivingPoId] = useState<string | null>(null);
  const [receiveForm, setReceiveForm] = useState({
    itemName: '',
    quantity: 0,
    unit: '',
    deliveredQty: 0,
    purchasePrice: 0,
    supplier: '',
    batchNo: '',
    mfgDate: '',
    expiryDate: '',
  });

  // Edit Material Form State
  const [isEditMaterialOpen, setIsEditMaterialOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editMaterialForm, setEditMaterialForm] = useState({
    name: '',
    category: 'vegetables' as RawMaterialCategory,
    unit: 'kg',
    openingStock: 0,
    currentStock: 0,
    costPrice: 0,
    supplier: '',
    mfgDate: '',
    expiryDate: '',
    minStockAlert: 0,
    storageLocation: '',
    newBatchExpiryDate: '',
  });

  // Persist states in localStorage for sync across pages
  useEffect(() => {
    if (isInventoryLoaded) {
      localStorage.setItem('qrestro_raw_materials', JSON.stringify(rawMaterials));
    }
  }, [rawMaterials, isInventoryLoaded]);

  useEffect(() => {
    if (isInventoryLoaded) {
      localStorage.setItem('qrestro_sales_data', JSON.stringify(salesData));
    }
  }, [salesData, isInventoryLoaded]);

  useEffect(() => {
    if (isInventoryLoaded) {
      localStorage.setItem('qrestro_wastage_data', JSON.stringify(wastageData));
    }
  }, [wastageData, isInventoryLoaded]);

  useEffect(() => {
    if (isInventoryLoaded) {
      localStorage.setItem('qrestro_purchase_orders', JSON.stringify(purchaseOrders));
    }
  }, [purchaseOrders, isInventoryLoaded]);

  useEffect(() => {
    if (isInventoryLoaded) {
      localStorage.setItem('qrestro_suppliers', JSON.stringify(suppliers));
    }
  }, [suppliers, isInventoryLoaded]);

  useEffect(() => {
    if (isInventoryLoaded) {
      localStorage.setItem('qrestro_storage_sections', JSON.stringify(storageSections));
    }
  }, [storageSections, isInventoryLoaded]);

  // 5. Select active item
  const selectedMaterial = useMemo(() => {
    if (rawMaterials.length === 0) return null;
    return rawMaterials.find(m => m.id === selectedMaterialId) || rawMaterials[0] || null;
  }, [rawMaterials, selectedMaterialId]);

  // 6. Filter Raw Materials
  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [rawMaterials, searchQuery, categoryFilter]);

  // 7. Handlers for Modals
  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    setRawMaterials(prev => prev.map(m => {
      if (m.id === stockForm.materialId) {
        const current = m.currentStock;
        const newStock = stockForm.closingStock;
        const updatedBatches = updateMaterialBatches(
          m.batches,
          current,
          newStock,
          (stockForm as any).newBatchExpiryDate,
          undefined,
          m.expiryDate,
          m.id
        );
        const primaryBatch = updatedBatches.find(b => b.quantity > 0);
        const status = newStock <= (stockForm.openingStock * 0.3) ? 'low' : 'good';
        return {
          ...m,
          openingStock: stockForm.openingStock,
          closingStock: newStock,
          currentStock: newStock,
          existingStock: newStock,
          status: status as RawMaterial['status'],
          batches: updatedBatches,
          expiryDate: primaryBatch?.expiryDate || m.expiryDate
        };
      }
      return m;
    }));
    setStockForm(prev => ({ ...prev, newBatchExpiryDate: '' }));
    setIsStockModalOpen(false);
  };

  const handleLogWastage = (e: React.FormEvent) => {
    e.preventDefault();
    const item = rawMaterials.find(m => m.id === wastageForm.materialId);
    if (!item) return;

    // Add to wastage list
    const newWastage: WastageItem = {
      id: `w-${Date.now()}`,
      name: item.name,
      date: new Date().toISOString().split('T')[0],
      quantity: wastageForm.quantity,
      unit: item.unit,
      reason: wastageForm.reason,
      cost: wastageForm.cost,
    };

    setWastageData(prev => [newWastage, ...prev]);

    // Update raw material inventory quantities
    setRawMaterials(prev => prev.map(m => {
      if (m.id === wastageForm.materialId) {
        const current = m.currentStock;
        const newCurrent = Math.max(0, current - wastageForm.quantity);
        const updatedBatches = updateMaterialBatches(
          m.batches,
          current,
          newCurrent,
          undefined,
          undefined,
          m.expiryDate,
          m.id
        );
        const primaryBatch = updatedBatches.find(b => b.quantity > 0);
        return {
          ...m,
          currentStock: newCurrent,
          existingStock: newCurrent,
          closingStock: newCurrent,
          status: newCurrent <= (m.openingStock * 0.3) ? 'low' : 'good',
          batches: updatedBatches,
          expiryDate: primaryBatch?.expiryDate || m.expiryDate
        };
      }
      return m;
    }));

    setIsWastageModalOpen(false);
  };

  const handleSavePOWithStatus = (statusToApply: 'draft' | 'pending') => {
    if (!poForm.itemName.trim()) return;

    if (editingPoId) {
      setPurchaseOrders(prev => prev.map(po => {
        if (po.id === editingPoId) {
          return {
            ...po,
            itemName: poForm.itemName,
            quantity: poForm.quantity,
            unit: poForm.unit,
            supplier: poForm.supplier || '',
            totalCost: poForm.totalCost || 0,
            orderDate: poForm.orderDate || po.orderDate,
            status: statusToApply,
            notes: poForm.notes,
          };
        }
        return po;
      }));
      setEditingPoId(null);
    } else {
      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        itemName: poForm.itemName,
        quantity: poForm.quantity,
        unit: poForm.unit,
        orderDate: poForm.orderDate || new Date().toISOString().split('T')[0],
        supplier: poForm.supplier || '',
        status: statusToApply,
        totalCost: poForm.totalCost || 0,
        notes: poForm.notes,
      };
      setPurchaseOrders(prev => [newPO, ...prev]);
    }
    setIsPoModalOpen(false);
  };

  const getRestaurantInfo = () => {
    let name = 'The Golden Plate';
    let email = 'contact@thegoldenplate.com';
    let phone = '+91 98765 43210';
    try {
      const saved = localStorage.getItem('qrestro_demo_restaurant');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) name = parsed.name;
        if (parsed.email) email = parsed.email;
        if (parsed.phone) phone = parsed.phone;
      }
    } catch { /* fallback */ }
    return { name, email, phone };
  };



  const handleReceiveStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPoId) return;

    // 1. Update the Purchase Order status and delivered details
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === receivingPoId) {
        return {
          ...po,
          status: 'completed' as const,
          supplier: receiveForm.supplier,
          totalCost: receiveForm.purchasePrice,
          deliveredQty: receiveForm.deliveredQty,
          purchasePrice: receiveForm.purchasePrice,
          batchNo: receiveForm.batchNo,
          mfgDate: receiveForm.mfgDate,
          expiryDate: receiveForm.expiryDate,
        };
      }
      return po;
    }));

    // 2. Auto-update Raw Materials stock and batches
    setRawMaterials(prev => prev.map(m => {
      if (m.name.toLowerCase() === receiveForm.itemName.toLowerCase()) {
        const current = m.currentStock;
        const deliveredQty = receiveForm.deliveredQty;
        const newStock = current + deliveredQty;
        const costPerUnit = Number((receiveForm.purchasePrice / deliveredQty).toFixed(2));
        
        const newBatch: StockBatch = {
          id: receiveForm.batchNo || `batch-${Date.now()}`,
          batchNo: receiveForm.batchNo,
          quantity: deliveredQty,
          expiryDate: receiveForm.expiryDate || undefined,
          mfgDate: receiveForm.mfgDate || undefined,
          costPrice: costPerUnit
        };
        
        let batches = m.batches ? [...m.batches].filter(b => b.quantity > 0) : [];
        if (batches.length === 0 && current > 0) {
          batches = [{
            id: `${m.id}-b-init`,
            quantity: current,
            expiryDate: m.expiryDate,
            mfgDate: m.mfgDate,
            costPrice: m.costPrice
          }];
        }
        batches.push(newBatch);
        const primaryBatch = batches.find(b => b.quantity > 0);
        
        return {
          ...m,
          currentStock: newStock,
          existingStock: newStock,
          closingStock: newStock,
          supplier: receiveForm.supplier,
          costPrice: costPerUnit,
          expiryDate: primaryBatch?.expiryDate || m.expiryDate,
          batches,
          lastRestocked: new Date().toISOString().split('T')[0],
          status: newStock <= (m.minStockAlert || m.openingStock * 0.3) ? 'low' as const : 'good' as const
        };
      }
      return m;
    }));

    setIsReceiveStockOpen(false);
    setReceivingPoId(null);
  };

  const downloadPOListPDF = (title: string, list: PurchaseOrder[]) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PW = 210;
      const PH = 297;
      const generatedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Read actual restaurant name from localStorage (same as payroll)
      let restaurantName = 'The Golden Plate';
      try {
        const saved = localStorage.getItem('qrestro_demo_restaurant');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name) restaurantName = parsed.name;
        }
      } catch { /* fallback to default */ }

      // Check if it is a Supplier PO PDF (has supplier name in title)
      const isSupplierPO = title.toLowerCase().includes('supplier po');

      // ── 1. HEADER BANNER ──
      doc.setFillColor(44, 38, 31);
      doc.rect(0, 0, PW, 30, 'F');
      // Gold accent stripe
      doc.setFillColor(184, 138, 82);
      doc.rect(0, 30, PW, 2.5, 'F');
      
      // Company name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text(restaurantName, 14, 12);
      
      // Report subtitle
      doc.setFontSize(8);
      doc.setTextColor(184, 138, 82);
      doc.text('SUPPLY CHAIN PORTAL  |  ' + title.toUpperCase(), 14, 21);
      
      // Date on right
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 165, 140);
      doc.text('Generated: ' + generatedDate, PW - 14, 12, { align: 'right' });
      doc.text('Confidential Purchase Record', PW - 14, 21, { align: 'right' });

      // Deduce supplier name and calculate totals
      const uniqueSuppliers = Array.from(new Set(list.map(po => po.supplier?.trim() || 'Unassigned / Drafts')));
      const isSingleSupplier = uniqueSuppliers.length === 1;
      const supplierName = isSingleSupplier ? uniqueSuppliers[0] : 'Various Suppliers';

      const totalUniqueItems = list.length;
      const totalCost = list.filter(po => po.status === 'completed').reduce((sum, po) => sum + (po.totalCost || 0), 0);
      const completedCount = list.filter(po => po.status === 'completed').length;
      const pendingCount = list.filter(po => po.status === 'pending').length;

      // ── 2. SUMMARY STAT CARDS ──
      let cards = [];
      if (isSupplierPO) {
        cards = [
          { label: 'TOTAL ORDERS', value: String(list.length), sub: `${completedCount} Completed  |  ${pendingCount} Pending` },
          { label: 'SUPPLIER PARTNER', value: supplierName.length > 30 ? supplierName.slice(0, 28) + '..' : supplierName, sub: `Active supplier section` },
        ];
      } else {
        cards = [
          { label: 'TOTAL ORDERS', value: String(list.length), sub: `${completedCount} Completed  |  ${pendingCount} Pending` },
          { label: 'SUPPLIER PARTNER', value: supplierName.length > 22 ? supplierName.slice(0, 20) + '..' : supplierName, sub: `Active supplier section` },
          { label: 'TOTAL EXPENSE', value: 'Rs.' + totalCost.toLocaleString('en-IN'), sub: `Completed orders only` },
        ];
      }

      const cardW = (PW - 28 - (cards.length - 1) * 3) / cards.length;
      let cardX = 14;
      const cardY = 36;
      cards.forEach((card) => {
        doc.setFillColor(250, 247, 242);
        doc.setDrawColor(220, 215, 208);
        doc.roundedRect(cardX, cardY, cardW, 20, 2, 2, 'FD');
        doc.setFillColor(184, 138, 82);
        doc.rect(cardX, cardY, 2.5, 20, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(130, 118, 106);
        doc.text(card.label, cardX + 5, cardY + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(44, 38, 31);
        doc.text(card.value, cardX + 5, cardY + 12.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(150, 140, 125);
        doc.text(card.sub, cardX + 5, cardY + 18);
        cardX += cardW + 3;
      });

      // ── 3. SECTION TITLE ──
      let y = 62;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(184, 138, 82);
      doc.text(isSupplierPO ? 'PO ITEMS FOR FULFILLMENT' : 'DETAILED PROCUREMENT ITEMIZATION', 14, y);
      doc.setDrawColor(184, 138, 82);
      doc.setLineWidth(0.4);
      doc.line(14, y + 1.5, PW - 14, y + 1.5);
      y += 5;

      // ── 4. TABLE HEADERS ──
      const colDefs = isSupplierPO ? [
        { label: 'PO Ref ID', w: 30 },
        { label: 'Ingredient / Product Description', w: 85 },
        { label: 'Quantity Ordered', w: 35 },
        { label: 'Order Date', w: 32 },
      ] : [
        { label: 'PO Ref ID', w: 25 },
        { label: 'Ingredient / Product', w: 45 },
        { label: 'Quantity\nOrdered', w: 25 },
        { label: 'Supplier\nPartner', w: 32 },
        { label: 'Order Date', w: 23 },
        { label: 'Status', w: 16 },
        { label: 'Cost\n(Rs.)', w: 16 },
      ];
      const headerH = 12;
      const rowH = 8;
      const startX = 14;

      // Header background
      doc.setFillColor(44, 38, 31);
      let hx = startX;
      colDefs.forEach(col => { doc.rect(hx, y, col.w, headerH, 'F'); hx += col.w; });

      // Header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      hx = startX;
      colDefs.forEach(col => {
        const lines = col.label.split('\n');
        if (lines.length === 2) {
          doc.text(lines[0], hx + 1.5, y + 4.5);
          doc.text(lines[1], hx + 1.5, y + 8.5);
        } else {
          doc.text(lines[0], hx + 1.5, y + 6.5);
        }
        hx += col.w;
      });
      y += headerH;

      // ── 5. DATA ROWS ──
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      list.forEach((po, idx) => {
        const isEven = idx % 2 === 0;
        doc.setFillColor(isEven ? 252 : 246, isEven ? 250 : 247, isEven ? 247 : 243);
        let rx = startX;
        colDefs.forEach(col => { doc.rect(rx, y, col.w, rowH, 'F'); rx += col.w; });

        // Row border line
        doc.setDrawColor(220, 215, 208);
        doc.setLineWidth(0.2);
        doc.line(startX, y + rowH, startX + colDefs.reduce((a, c) => a + c.w, 0), y + rowH);

        const statusLabel = po.status.toUpperCase();
        const rowData = isSupplierPO ? [
          po.id.slice(0, 8).toUpperCase(),
          po.itemName,
          `${po.quantity} ${po.unit}`,
          po.orderDate,
        ] : [
          po.id.slice(0, 8).toUpperCase(),
          po.itemName,
          `${po.quantity} ${po.unit}`,
          po.supplier || 'Unassigned',
          po.orderDate,
          statusLabel,
          po.status === 'completed' && po.totalCost > 0 ? 'Rs.' + po.totalCost.toLocaleString('en-IN') : '—',
        ];

        rx = startX;
        doc.setTextColor(44, 38, 31);
        rowData.forEach((cell, i) => {
          const maxChars = Math.floor(colDefs[i].w / 1.7);
          const text = cell.length > maxChars ? cell.substring(0, maxChars - 1) + '.' : cell;
          if (!isSupplierPO && i === 5) {
            if (po.status === 'completed') { doc.setTextColor(22, 163, 74); doc.setFont('helvetica', 'bold'); }
            else if (po.status === 'pending') { doc.setTextColor(202, 138, 4); doc.setFont('helvetica', 'bold'); }
            else { doc.setTextColor(100, 110, 120); doc.setFont('helvetica', 'bold'); }
          } else {
            doc.setTextColor(44, 38, 31);
            doc.setFont('helvetica', 'normal');
          }
          doc.text(text, rx + 1.5, y + 5);
          rx += colDefs[i].w;
        });
        y += rowH;
        if (y > 265) { doc.addPage(); y = 14; }
      });

      // ── 6. GRAND TOTAL ROW ──
      if (!isSupplierPO) {
        doc.setFillColor(184, 138, 82);
        let tx = startX;
        colDefs.forEach(col => { doc.rect(tx, y, col.w, rowH + 1, 'F'); tx += col.w; });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('GRAND TOTAL FULFILLED COST', startX + 1.5, y + 6);
        const totalColX = startX + colDefs.slice(0, 6).reduce((a, c) => a + c.w, 0);
        doc.text('Rs.' + totalCost.toLocaleString('en-IN'), totalColX + 1.5, y + 6);
        y += rowH + 1;
      } else {
        doc.setFillColor(184, 138, 82);
        doc.rect(startX, y, PW - 28, 1.5, 'F');
        y += 3;
      }

      // ── 7. FOOTER BANNER ──
      doc.setFillColor(44, 38, 31);
      doc.rect(0, 289, PW, 8, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(160, 140, 110);
      doc.text(restaurantName + '  |  Confidential Procurement Document  |  Supply Chain Logistics', PW / 2, 294, { align: 'center' });

      doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
      alert('PDF generation failed: ' + (e as Error).message);
    }
  };



  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMaterialForm.name.trim()) return;
    const closing = addMaterialForm.currentStock;
    const status: RawMaterial['status'] = closing <= addMaterialForm.openingStock * 0.3 ? 'low' : 'good';
    const newMaterial: RawMaterial = {
      id: `rm-${Date.now()}`,
      name: addMaterialForm.name.trim(),
      category: addMaterialForm.category,
      unit: addMaterialForm.unit,
      existingStock: closing,
      openingStock: addMaterialForm.openingStock,
      closingStock: closing,
      currentStock: closing,
      status,
      costPrice: addMaterialForm.costPrice || undefined,
      supplier: addMaterialForm.supplier || undefined,
      mfgDate: (addMaterialForm as any).mfgDate || undefined,
      expiryDate: addMaterialForm.expiryDate || undefined,
      minStockAlert: addMaterialForm.minStockAlert || undefined,
      storageLocation: addMaterialForm.storageLocation || undefined,
      lastRestocked: new Date().toISOString().split('T')[0],
      batches: closing > 0 ? [{
        id: `rm-${Date.now()}-b-init`,
        quantity: closing,
        expiryDate: addMaterialForm.expiryDate || undefined,
        mfgDate: (addMaterialForm as any).mfgDate || undefined,
        costPrice: addMaterialForm.costPrice || undefined
      }] : [],
    };
    setRawMaterials(prev => [newMaterial, ...prev]);
    setSelectedMaterialId(newMaterial.id);
    setAddMaterialForm({ name: '', category: 'vegetables', unit: 'kg', openingStock: 0, currentStock: 0, costPrice: 0, supplier: '', expiryDate: '', minStockAlert: 0, storageLocation: '', ...{ mfgDate: '' } } as any);
    setIsAddCustomUnit(false);
    setIsAddMaterialOpen(false);
  };

  const handleEditMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterialId || !editMaterialForm.name.trim()) return;

    setRawMaterials(prev => prev.map(m => {
      if (m.id === editingMaterialId) {
        const current = m.currentStock;
        const newStock = editMaterialForm.currentStock;
        const updatedBatches = updateMaterialBatches(
          m.batches,
          current,
          newStock,
          (editMaterialForm as any).newBatchExpiryDate,
          undefined,
          editMaterialForm.expiryDate,
          m.id
        );
        const primaryBatch = updatedBatches.find(b => b.quantity > 0);
        const status: RawMaterial['status'] = newStock <= editMaterialForm.openingStock * 0.3 ? 'low' : 'good';
        return {
          ...m,
          name: editMaterialForm.name.trim(),
          category: editMaterialForm.category,
          unit: editMaterialForm.unit,
          openingStock: editMaterialForm.openingStock,
          currentStock: newStock,
          closingStock: newStock,
          existingStock: newStock,
          status,
          costPrice: editMaterialForm.costPrice || undefined,
          supplier: editMaterialForm.supplier || undefined,
          mfgDate: editMaterialForm.mfgDate || undefined,
          expiryDate: primaryBatch?.expiryDate || editMaterialForm.expiryDate || undefined,
          minStockAlert: editMaterialForm.minStockAlert || undefined,
          storageLocation: editMaterialForm.storageLocation || undefined,
          batches: updatedBatches
        };
      }
      return m;
    }));

    setIsEditMaterialOpen(false);
    setIsEditCustomUnit(false);
    setEditingMaterialId(null);
  };

  // Helper to render premium inline SVG category icons instead of emojis
  const renderCategoryIcon = (id: string, active: boolean) => {
    const color = active ? '#B88A52' : '#8C8375';
    switch (id) {
      case 'all':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        );
      case 'vegetables':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#10B981' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2c1-1 3 .5 3 2s-2 3-3 4-3-2.5-3-4 2-3 3-2z" fill="#10B981" opacity="0.4" />
            <path d="M12 8c-3 1.5-6 5.5-6 10a6 6 0 0 0 12 0c0-4.5-3-8.5-6-10z" stroke={active ? '#059669' : color} fill={active ? '#E6F4EA' : 'none'} />
          </svg>
        );
      case 'dairy':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2h6v3H9z" />
            <path d="M7 8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V8z" fill={active ? '#DBEAFE' : 'none'} />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
        );
      case 'meat':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#EF4444' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3a5 5 0 0 0-5 5c0 1.6.8 3 2 4l-7.7 7.7a2 2 0 1 0 2.8 2.8L15 14.8c1 .8 2.4 1.2 4 1.2a5 5 0 0 0 5-5V3h-9z" fill={active ? '#FEE2E2' : 'none'} />
          </svg>
        );
      case 'grains':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#F59E0B' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M8 5c1-1 3-1 4 1M16 5c-1-1-3-1-4 1M8 10c1-1 3-1 4 1M16 10c-1-1-3-1-4 1M8 15c1-1 3-1 4 1M16 15c-1-1-3-1-4 1" />
          </svg>
        );
      case 'spices':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#F97316' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 3c-1.2 1.8-3.6 4.2-6 6a18 18 0 0 1-7.2 2.4A2 2 0 0 0 3 13.6a8.4 8.4 0 0 0 15 5.4c1.8-2.4 3.6-5.4 3.6-9.6 0-3.6-1.8-5.4-3.6-6.4z" fill={active ? '#FFEDD5' : 'none'} />
          </svg>
        );
      case 'oils':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#84CC16' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C12 2 4 10 4 14a8 8 0 0 0 16 0c0-4-8-12-8-12z" fill={active ? '#ECFDF5' : 'none'} />
          </svg>
        );
      case 'beverages':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#EC4899' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 9h10l-1.5 12h-7L7 9z" fill={active ? '#FCE7F3' : 'none'} />
            <path d="M6 9h12" />
            <path d="M14 9l1-6" />
          </svg>
        );
      case 'packaging':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#B45309' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      case 'frozen':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#06B6D4' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20M12 12l7.5 7.5M12 12L4.5 4.5M12 12L4.5 19.5M12 12l7.5-7.5" />
          </svg>
        );
      case 'bakery':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#D946EF' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M5 16a7 7 0 0 1 14 0v4H5v-4z" fill={active ? '#FDF4FF' : 'none'} />
            <path d="M12 6a4 4 0 0 0-4 4v2h8v-2a4 4 0 0 0-4-4z" />
          </svg>
        );
      case 'cleaning':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#0EA5E9' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z" fill={active ? '#E0F2FE' : 'none'} />
            <path d="M6 12h12M12 4v8" />
          </svg>
        );
      case 'bar':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#A855F7' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 22H6M12 15v7M12 15a6 6 0 0 0 6-6V3H6v6a6 6 0 0 0 6 6z" fill={active ? '#F3E8FF' : 'none'} />
          </svg>
        );
      case 'others':
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={active ? '#64748B' : color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        );
      default:
        return (
          <svg className="w-3.5 h-3.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  // SVG Render Helper for Ingredients matching screenshot visual premiumness
  const renderItemIllustration = (category: string) => {
    switch (category) {
      case 'vegetables':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Wooden Basket */}
            <path d="M 25 60 L 135 60 L 125 105 L 35 105 Z" fill="#D7CCC8" stroke="#8D6E63" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Basket Weave lines */}
            <line x1="50" y1="60" x2="55" y2="105" stroke="#8D6E63" strokeWidth="1.5" />
            <line x1="80" y1="60" x2="80" y2="105" stroke="#8D6E63" strokeWidth="1.5" />
            <line x1="110" y1="60" x2="105" y2="105" stroke="#8D6E63" strokeWidth="1.5" />
            <line x1="30" y1="80" x2="130" y2="80" stroke="#8D6E63" strokeWidth="1.5" />
            
            {/* Carrot peeking out */}
            <path d="M 85 25 L 115 55 L 75 75 Z" fill="#FF9800" stroke="#E65100" strokeWidth="1.5" />
            <path d="M 85 25 Q 92 10 90 5 Q 83 12 85 25 Q 75 18 70 12 Q 78 22 85 25" fill="#4CAF50" />
            
            {/* Red Tomato */}
            <circle cx="55" cy="55" r="22" fill="#E53935" stroke="#B71C1C" strokeWidth="1.5" />
            <circle cx="55" cy="33" r="4" fill="#4CAF50" />
            
            {/* Garlic Bulb */}
            <path d="M 95 65 C 80 65, 80 45, 95 45 C 110 45, 110 65, 95 65 Z" fill="#ECEFF1" stroke="#CFD8DC" strokeWidth="1.5" />
            <path d="M 95 45 Q 95 35 97 33" stroke="#CFD8DC" strokeWidth="2" fill="none" />
            
            {/* Green lettuce leaf */}
            <path d="M 35 55 C 20 40, 20 20, 45 35 C 55 42, 45 55, 35 55 Z" fill="#81C784" opacity="0.9" stroke="#4CAF50" strokeWidth="1" />
          </svg>
        );
      case 'dairy':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Cheese Wedge */}
            <path d="M 75 85 L 135 60 L 135 95 L 75 105 Z" fill="#FFB300" stroke="#FF6F00" strokeWidth="2" />
            <path d="M 75 85 L 105 45 L 135 60 Z" fill="#FFC107" stroke="#FF6F00" strokeWidth="2" />
            <circle cx="95" cy="65" r="5" fill="#FFA000" />
            <circle cx="115" cy="70" r="7" fill="#FFA000" />
            <circle cx="120" cy="55" r="4" fill="#FFA000" />
            
            {/* Milk Bottle */}
            <path d="M 35 35 L 55 35 L 55 45 L 63 60 L 63 105 L 27 105 L 27 60 L 35 45 Z" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="2" />
            {/* Cap */}
            <rect x="33" y="27" width="24" height="8" rx="2" fill="#E53935" />
            {/* Label */}
            <rect x="29" y="70" width="32" height="20" fill="#29B6F6" opacity="0.2" />
            <text x="45" y="83" fontSize="8" fontWeight="bold" fill="#0288D1" textAnchor="middle" fontFamily="sans-serif">MILK</text>
            {/* Glass reflections */}
            <line x1="32" y1="50" x2="32" y2="95" stroke="#ECEFF1" strokeWidth="1.5" />
          </svg>
        );
      case 'meat':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Steak */}
            <path d="M 30 75 C 30 50, 90 40, 110 55 C 130 70, 130 90, 100 100 C 70 110, 30 100, 30 75 Z" fill="#D32F2F" stroke="#5D4037" strokeWidth="2.5" />
            {/* Marbling */}
            <path d="M 45 75 Q 70 70 95 80" stroke="#FFCDD2" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 55 60 Q 75 58 85 68" stroke="#FFCDD2" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Bone */}
            <circle cx="105" cy="70" r="10" fill="#FFFFFF" stroke="#5D4037" strokeWidth="2" />
            
            {/* Drumstick */}
            <g transform="translate(10, -5) rotate(15 90 50)">
              <path d="M 90 50 C 90 35, 135 35, 135 55 C 135 75, 90 75, 90 55" fill="#A1887F" stroke="#5D4037" strokeWidth="2" />
              <rect x="70" y="51" width="22" height="8" fill="#FFF" stroke="#5D4037" strokeWidth="2" />
              <circle cx="68" cy="49" r="6" fill="#FFF" stroke="#5D4037" strokeWidth="2" />
              <circle cx="68" cy="59" r="6" fill="#FFF" stroke="#5D4037" strokeWidth="2" />
            </g>
          </svg>
        );
      case 'grains':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Grain Sack */}
            <path d="M 40 40 C 40 32, 80 32, 80 40 C 80 48, 40 48, 40 40 Z" fill="#D7CCC8" />
            <path d="M 33 40 L 87 40 C 95 60, 95 90, 87 110 C 80 113, 40 113, 33 110 C 25 90, 25 60, 33 40 Z" fill="#FFE0B2" stroke="#8D6E63" strokeWidth="2" />
            {/* Rope */}
            <path d="M 35 43 Q 60 48 85 43" fill="none" stroke="#BCAAA4" strokeWidth="3.5" />
            {/* Wheat Icon on Sack */}
            <path d="M 60 65 L 60 90 M 54 70 L 60 76 M 66 70 L 60 76 M 54 78 L 60 84 M 66 78 L 60 84" stroke="#8D6E63" strokeWidth="2" fill="none" strokeLinecap="round" />
            
            {/* Rice Bowl */}
            <path d="M 95 80 C 95 80, 115 65, 135 80 L 140 100 C 140 105, 90 105, 90 100 Z" fill="#E0F7FA" stroke="#00838F" strokeWidth="2" />
            {/* Rice Stack */}
            <path d="M 98 80 C 105 70, 125 70, 132 80 Z" fill="#FFFFFF" stroke="#00838F" strokeWidth="1" />
            {/* Chopsticks */}
            <line x1="110" y1="50" x2="135" y2="85" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
            <line x1="118" y1="48" x2="143" y2="83" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'spices':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Mortar */}
            <path d="M 35 55 L 125 55 C 125 85, 105 105, 80 105 C 55 105, 35 85, 35 55 Z" fill="#78909C" stroke="#37474F" strokeWidth="2.5" />
            <ellipse cx="80" cy="55" rx="45" ry="8" fill="#546E7A" stroke="#37474F" strokeWidth="2" />
            {/* Pestle */}
            <path d="M 100 35 L 125 15 L 135 25 L 110 45 Z" fill="#90A4AE" stroke="#37474F" strokeWidth="2" />
            
            {/* Chili Pepper */}
            <path d="M 45 45 Q 25 35 15 50 Q 12 75 35 85 Q 38 86 42 78 Q 25 75 25 55" fill="#E53935" stroke="#B71C1C" strokeWidth="1.5" />
            <path d="M 45 45 Q 50 42 52 35" stroke="#4CAF50" strokeWidth="2" fill="none" strokeLinecap="round" />
            
            {/* Floating spice stars */}
            <path d="M 80 25 L 83 32 L 90 32 L 85 36 L 87 43 L 80 39 L 73 43 L 75 36 L 70 32 L 77 32 Z" fill="#FFB300" />
          </svg>
        );
      case 'oils':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Glass Carafe Bottle */}
            <path d="M 70 30 L 90 30 L 88 50 L 115 90 C 120 100, 110 110, 95 110 L 65 110 C 50 110, 40 100, 45 90 L 72 50 Z" fill="#DCEDC8" stroke="#558B2F" strokeWidth="2.5" />
            {/* Golden Oil Level */}
            <path d="M 52 80 C 52 80, 80 75, 108 80 L 100 102 L 60 102 Z" fill="#FFD54F" stroke="#FFB300" strokeWidth="1" />
            {/* Cork Stopper */}
            <rect x="74" y="20" width="12" height="10" fill="#A1887F" stroke="#5D4037" strokeWidth="1.5" rx="1" />
            
            {/* Olive Sprig hanging in front */}
            <circle cx="115" cy="55" r="7" fill="#7CB342" stroke="#558B2F" strokeWidth="1.5" />
            <path d="M 115 48 Q 125 45 130 52" stroke="#558B2F" strokeWidth="1.5" fill="none" />
            
            {/* Droplet */}
            <path d="M 80 62 C 80 62, 74 72, 80 76 C 86 76, 80 62, 80 62 Z" fill="#FFC107" />
          </svg>
        );
      case 'beverages':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Soda Can */}
            <rect x="25" y="45" width="34" height="60" rx="3" fill="#E53935" stroke="#B71C1C" strokeWidth="2" />
            <ellipse cx="42" cy="45" rx="17" ry="4" fill="#CFD8DC" stroke="#B71C1C" strokeWidth="1.5" />
            <rect x="35" y="58" width="14" height="34" fill="#FFFFFF" opacity="0.3" />
            
            {/* Cocktail Glass */}
            <path d="M 80 35 L 130 35 L 105 75 Z" fill="#FCE7F3" stroke="#EC4899" strokeWidth="2" strokeLinejoin="round" />
            <line x1="105" y1="75" x2="105" y2="105" stroke="#EC4899" strokeWidth="2.5" />
            <line x1="90" y1="105" x2="120" y2="105" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Straw */}
            <line x1="95" y1="65" x2="70" y2="20" stroke="#FFB300" strokeWidth="3" strokeLinecap="round" />
            {/* Lemon slice */}
            <circle cx="128" cy="35" r="10" fill="#FFEB3B" stroke="#FBC02D" strokeWidth="1.5" />
          </svg>
        );
      case 'packaging':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Cardboard Box */}
            <path d="M 30 65 L 75 45 L 120 65 L 120 100 L 75 115 L 30 100 Z" fill="#D7CCC8" stroke="#8D6E63" strokeWidth="2" strokeLinejoin="round" />
            {/* Box opening flaps */}
            <path d="M 30 65 L 75 45 L 75 80 L 30 100 Z" fill="#BCAAA4" stroke="#8D6E63" strokeWidth="1.5" />
            <path d="M 75 45 L 120 65 L 120 100 L 75 80 Z" fill="#8D6E63" opacity="0.15" stroke="#8D6E63" strokeWidth="1.5" />
            <path d="M 30 65 L 75 80 L 120 65" fill="none" stroke="#8D6E63" strokeWidth="2" />
            
            {/* Paper bag behind */}
            <path d="M 85 30 L 125 35 L 130 85 L 90 80 Z" fill="#FFE0B2" opacity="0.85" stroke="#BCAAA4" strokeWidth="1.5" />
            {/* String handle */}
            <path d="M 100 31 C 100 22, 110 22, 110 32" stroke="#8D6E63" strokeWidth="2" fill="none" />
          </svg>
        );
      case 'frozen':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Ice Snowflake */}
            <g transform="translate(80, 50)" stroke="#00B4D8" strokeWidth="3" strokeLinecap="round">
              {/* Main axes */}
              <line x1="-30" y1="0" x2="30" y2="0" />
              <line x1="0" y1="-30" x2="0" y2="30" />
              <line x1="-21" y1="-21" x2="21" y2="21" />
              <line x1="-21" y1="21" x2="21" y2="-21" />
              {/* Branch details */}
              <path d="M -15 5 L -20 0 L -15 -5" fill="none" strokeWidth="2.5" />
              <path d="M 15 5 L 20 0 L 15 -5" fill="none" strokeWidth="2.5" />
              <path d="M 5 -15 L 0 -20 L -5 -15" fill="none" strokeWidth="2.5" />
              <path d="M 5 15 L 0 20 L -5 15" fill="none" strokeWidth="2.5" />
            </g>
            
            {/* Frozen Ice Cream Tub */}
            <path d="M 30 75 L 70 75 L 65 105 L 35 105 Z" fill="#E0F7FA" stroke="#009688" strokeWidth="2" />
            <ellipse cx="50" cy="75" rx="20" ry="5" fill="#B2EBF2" stroke="#009688" strokeWidth="2" />
            {/* Sparkles */}
            <path d="M 25 35 L 27 40 L 32 40 L 28 43 L 30 48 L 25 45 L 20 48 L 22 43 L 18 40 L 23 40 Z" fill="#00E5FF" />
          </svg>
        );
      case 'bakery':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Croissant */}
            <path d="M 25 85 C 20 70, 50 50, 75 60 C 95 68, 125 50, 135 75 C 110 95, 40 100, 25 85 Z" fill="#D84315" stroke="#5D4037" strokeWidth="2" />
            <path d="M 40 75 C 45 68, 65 65, 75 75" stroke="#FFF" strokeWidth="1.5" fill="none" opacity="0.3" />
            <path d="M 75 70 C 85 62, 105 65, 110 78" stroke="#FFF" strokeWidth="1.5" fill="none" opacity="0.3" />
            
            {/* Cupcake */}
            <path d="M 80 80 L 115 80 L 110 105 L 85 105 Z" fill="#FFCC80" stroke="#5D4037" strokeWidth="2" />
            {/* Frosting swirl */}
            <path d="M 75 80 C 70 65, 125 65, 120 80 C 120 70, 75 70, 75 80 Z" fill="#F48FB1" />
            <path d="M 80 72 C 80 55, 115 55, 115 72 Z" fill="#F48FB1" stroke="#5D4037" strokeWidth="2" />
            {/* Cherry */}
            <circle cx="98" cy="50" r="6" fill="#D32F2F" />
            <path d="M 98 44 Q 105 32 108 35" stroke="#5D4037" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'cleaning':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Spray Bottle */}
            <path d="M 45 60 L 75 60 L 70 105 L 50 105 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
            <path d="M 52 60 L 52 45 L 68 45 L 68 60" fill="none" stroke="#0284C7" strokeWidth="2" />
            {/* Spray trigger head */}
            <path d="M 45 40 L 75 35 L 75 45 L 65 45 Z" fill="#0EA5E9" stroke="#0284C7" strokeWidth="2" />
            <path d="M 45 40 L 40 45 L 52 45" stroke="#0284C7" strokeWidth="2" fill="none" />
            
            {/* Sponge */}
            <rect x="85" y="70" width="45" height="25" rx="4" fill="#FDE047" stroke="#CA8A04" strokeWidth="2" />
            <circle cx="95" cy="78" r="3" fill="#CA8A04" opacity="0.3" />
            <circle cx="115" cy="84" r="2.5" fill="#CA8A04" opacity="0.3" />
            
            {/* Magic sparkles */}
            <path d="M 120 30 L 123 35 L 128 35 L 124 38 L 126 43 L 120 40 L 114 43 L 116 38 L 112 35 L 117 35 Z" fill="#00E5FF" />
          </svg>
        );
      case 'bar':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Wine Bottle */}
            <rect x="52" y="20" width="14" height="25" fill="#4C1D95" stroke="#2E1065" strokeWidth="2" />
            <path d="M 42 55 L 76 55 L 76 105 L 42 105 Z" fill="#5B21B6" stroke="#2E1065" strokeWidth="2" />
            <path d="M 42 55 C 42 45, 52 45, 52 45 L 66 45 C 66 45, 76 45, 76 55" fill="#5B21B6" stroke="#2E1065" strokeWidth="2" />
            {/* Wine label */}
            <rect x="47" y="68" width="24" height="22" fill="#FAF5FF" stroke="#C084FC" strokeWidth="1" />
            <line x1="52" y1="78" x2="66" y2="78" stroke="#701A75" strokeWidth="1.5" />
            
            {/* Wine Glass */}
            <path d="M 90 50 C 90 75, 120 75, 120 50 Z" fill="#F472B6" opacity="0.2" stroke="#DB2777" strokeWidth="2" />
            <line x1="105" y1="72" x2="105" y2="105" stroke="#DB2777" strokeWidth="2.5" />
            <line x1="95" y1="105" x2="115" y2="105" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'kitchen':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Chef's Pot */}
            <rect x="35" y="55" width="90" height="45" rx="3" fill="#94A3B8" stroke="#475569" strokeWidth="2.5" />
            <line x1="35" y1="62" x2="125" y2="62" stroke="#475569" strokeWidth="2" />
            {/* Pot lid */}
            <path d="M 40 55 L 120 55 L 110 45 L 50 45 Z" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
            <rect x="73" y="38" width="14" height="7" rx="1.5" fill="#475569" />
            {/* Pot handles */}
            <path d="M 35 70 C 25 70, 25 80, 35 80" fill="none" stroke="#475569" strokeWidth="2" />
            <path d="M 125 70 C 135 70, 135 80, 125 80" fill="none" stroke="#475569" strokeWidth="2" />
          </svg>
        );
      case 'others':
        return (
          <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto filter drop-shadow-md">
            {/* Folder Illustration */}
            <path d="M25 32c0-2.2 1.8-4 4-4h28c1.3 0 2.5.6 3.2 1.6l5.2 6.8c.7.9 1.9 1.4 3.2 1.4h49c2.2 0 4 1.8 4 4v51c0 2.2-1.8 4-4 4H29c-2.2 0-4-1.8-4-4V32z" fill="#FAF8F5" stroke="#E6E1DA" strokeWidth="2" />
            <path d="M25 44h94v49c0 2.2-1.8 4-4 4H29c-2.2 0-4-1.8-4-4V44z" fill="#B88A52" opacity="0.08" />
            {/* Document layout inside */}
            <rect x="52" y="58" width="40" height="26" rx="3" fill="none" stroke="#B88A52" strokeWidth="2.5" />
            <line x1="60" y1="66" x2="84" y2="66" stroke="#B88A52" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="60" y1="74" x2="76" y2="74" stroke="#B88A52" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 120 120" className="w-28 h-28 mx-auto filter drop-shadow-md">
            {/* Ingredient Container Box */}
            <path d="M 25 35 L 60 15 L 95 35 L 95 105 L 25 105 Z" fill="#E2E8F0" stroke="#BEE3F8" strokeWidth="1" />
            <path d="M 25 35 L 60 15 L 60 105 L 25 105 Z" fill="#CBD5E0" />
            <path d="M 60 15 L 95 35 L 75 55 L 40 35 Z" fill="#EDF2F7" />
            {/* Shiny QRestro Gold Label */}
            <rect x="35" y="55" width="50" height="35" rx="3" fill="#D69E2E" />
            <rect x="38" y="58" width="44" height="29" rx="1.5" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
            <text x="60" y="77" fontSize="10" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">STOCK</text>
            <circle cx="85" cy="20" r="8" fill="#E53E3E" />
            <path d="M 82 20 L 88 20" stroke="#FFFFFF" strokeWidth="2" />
          </svg>
        );
    }
  };

  const getPOCategory = (itemName: string): string => {
    const nameLower = itemName.toLowerCase();
    const exactMatch = rawMaterials.find(m => m.name.toLowerCase() === nameLower);
    if (exactMatch) return exactMatch.category;

    const partialMatch = rawMaterials.find(m => 
      m.name.toLowerCase().includes(nameLower) || 
      nameLower.includes(m.name.toLowerCase())
    );
    if (partialMatch) return partialMatch.category;

    return 'others';
  };

  const renderPOTable = (orders: PurchaseOrder[], sectionName: string) => {
    if (orders.length === 0) {
      return (
        <div className="p-8 text-center bg-[#FAF9F6]/50 rounded-2xl border border-dashed border-[#E6E1DA] text-xs text-[#8C8375] font-semibold">
          No orders found in {sectionName}.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border border-[#E6E1DA] rounded-xl bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#F0ECE6] bg-[#FCFAF7] text-[10px] uppercase font-bold text-[#8C8375]">
              <th className="py-2.5 px-4">PO Reference ID</th>
              <th className="py-2.5 px-4">Ingredient</th>
              <th className="py-2.5 px-4">Quantity</th>
              <th className="py-2.5 px-4">Supplier</th>
              <th className="py-2.5 px-4">Order Date</th>
              <th className="py-2.5 px-4">Expiry Date</th>
              <th className="py-2.5 px-4 text-center">Status</th>
              <th className="py-2.5 px-4 text-right">Cost (₹)</th>
              <th className="py-2.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3EFEA] text-xs font-medium text-[#5A5348]">
            {orders.map((po) => (
              <tr key={po.id} className="hover:bg-[#FAF7F2]/40">
                <td className="py-3 px-4 font-mono font-bold text-[#8C8375] uppercase">{po.id.slice(0, 8)}</td>
                <td className="py-3 px-4">
                  <div className="font-bold text-[#2C261F]">{po.itemName}</div>
                </td>
                <td className="py-3 px-4 text-sm font-bold">{po.quantity} {po.unit}</td>
                <td className={cn("py-3 px-4 font-semibold", !po.supplier && "text-[#8C8375] italic text-[11px]")}>
                  {po.supplier || 'Pending Assignment'}
                </td>
                <td className="py-3 px-4 text-[#8C8375] font-semibold">{po.orderDate}</td>
                <td className="py-3 px-4 text-[#5A5348] font-semibold">
                  {po.expiryDate ? (
                    <span>{po.expiryDate}</span>
                  ) : (
                    <span className="text-[#A89F90]">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider border",
                    po.status === 'draft' && 'bg-slate-50 text-slate-700 border-slate-100',
                    po.status === 'pending' && 'bg-amber-50 text-amber-700 border-amber-100',
                    po.status === 'completed' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
                  )}>
                    {po.status}
                  </span>
                </td>
                <td className={cn("py-3 px-4 text-right font-extrabold text-sm", (po.status !== 'completed' || po.totalCost === 0) ? "text-[#8C8375] font-normal" : "text-slate-800")}>
                  {po.status === 'completed' && po.totalCost > 0 ? `₹${po.totalCost}` : '—'}
                </td>
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  {po.status !== 'completed' ? (
                    <>
                      <button
                        onClick={() => {
                          setReceiveForm({
                            itemName: po.itemName,
                            quantity: po.quantity,
                            unit: po.unit,
                            deliveredQty: po.quantity,
                            purchasePrice: po.totalCost || 0,
                            supplier: po.supplier || '',
                            batchNo: `BAT-${Math.floor(100 + Math.random() * 900)}`,
                            mfgDate: new Date().toISOString().split('T')[0],
                            expiryDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
                          });
                          setReceivingPoId(po.id);
                          setIsReceiveStockOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer mr-1.5 shadow-sm shadow-emerald-600/10 inline-flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Receive Stock</span>
                      </button>
                      <button
                        onClick={() => {
                          setPoForm({
                            itemName: po.itemName,
                            quantity: po.quantity,
                            unit: po.unit,
                            supplier: po.supplier || '',
                            totalCost: po.totalCost || 0,
                            orderDate: po.orderDate,
                            status: po.status,
                            notes: po.notes || '',
                          });
                          setEditingPoId(po.id);
                          const resolvedCat = getPOCategory(po.itemName);
                          setPoModalCategory(resolvedCat);
                          setIsPoModalOpen(true);
                        }}
                        className="p-1.5 text-[#B88A52] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer inline-flex items-center"
                        title="Edit Purchase Order"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                      ✓ Fulfilled & Injected
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const totalStockValue = useMemo(() => {
    return rawMaterials.reduce((acc, curr) => acc + (curr.currentStock * (curr.costPrice || 0)), 0);
  }, [rawMaterials]);

  const formatLakh = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} Lakh`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const totalWastage = useMemo(() => {
    return wastageData.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  }, [wastageData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 sm:p-4 text-[#5A5348] animate-fade-in font-sans">
      
      {/* 1. TOP HEADER & MAIN STATS ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/70 backdrop-blur-md border border-[#E6E1DA] p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FAF4EB] rounded-xl text-[#B88A52] border border-[#FAF0E2]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#2C261F] tracking-tight">Inventory Management</h1>
            <p className="text-xs text-[#8C8375]">Real-time tracking of ingredients, stock depletion, wastage, and supply logistics</p>
          </div>
        </div>

        {/* Global Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setIsSuppliersModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E6E1DA] hover:border-[#B88A52]/40 bg-white hover:bg-[#FAF7F2] text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-[#B88A52]" />
            <span>Suppliers</span>
          </button>

          <button 
            onClick={() => setIsStorageModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E6E1DA] hover:border-[#B88A52]/40 bg-white hover:bg-[#FAF7F2] text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Warehouse className="w-3.5 h-3.5 text-[#B88A52]" />
            <span>Storage Sections</span>
          </button>

          <button 
            onClick={() => setIsAddMaterialOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer shadow-[#B88A52]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Raw Material</span>
          </button>
          
          <button 
            onClick={() => setIsStockModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer shadow-rose-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Closing Stock</span>
          </button>
        </div>
      </div>

      {/* KPI Dynamic Indicators to wow the user */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Stock Value', value: formatLakh(totalStockValue), detail: `Across ${rawMaterials.length} materials`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Low Stock Alerts', value: rawMaterials.filter(m => m.status === 'low').length.toString(), detail: 'Needs immediate reordering', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Total Wastage Logged', value: `₹${totalWastage.toLocaleString('en-IN')}`, detail: `${wastageData.length} logged ingredient claims`, icon: Trash2, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          { label: 'Pending POs', value: purchaseOrders.filter(o => o.status === 'pending').length.toString(), detail: 'Waiting supplier approvals', icon: ShoppingBag, color: 'text-blue-600 bg-blue-50 border-blue-100' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-[#E6E1DA] p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8C8375] tracking-wider block">{kpi.label}</span>
              <span className="text-lg font-bold text-[#2C261F] mt-1 block">{kpi.value}</span>
              <span className="text-[10px] text-[#8C8375] mt-0.5 block font-medium">{kpi.detail}</span>
            </div>
            <div className={cn("p-2.5 rounded-xl border", kpi.color)}>
              <kpi.icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* 2. SUB-TABS SELECTOR ROW */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#FAF4EB]/60 border border-[#E6E1DA] rounded-xl">
        {[
          { id: 'raw_materials', label: '+ Raw Materials' },
          { id: 'sales', label: '+ Sales' },
          { id: 'wastage', label: '+ Wastage' },
          { id: 'purchase_orders', label: '+ Purchase Order' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                isActive 
                  ? "bg-[#23201D] text-white shadow-md shadow-[#23201D]/20 scale-102"
                  : "text-[#5A5348] hover:bg-white/60 hover:text-[#2C261F]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. TABS CONTAINER SWITCH */}
      {activeTab === 'raw_materials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT 2/3 COLUMN: Raw Materials Table */}
          <div className="lg:col-span-2 bg-white border border-[#E6E1DA] rounded-2xl shadow-sm overflow-hidden">
            
            {/* Search, Categories, and Filters panel */}
            <div className="p-4 border-b border-[#F0ECE6] flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FCFAF7]">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8C8375]" />
                <input
                  type="text"
                  placeholder="Search ingredient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl text-xs bg-white outline-none transition-all placeholder-[#A89F90] font-medium"
                />
              </div>

              {/* Category selector capsules */}
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'vegetables', label: 'Veggies' },
                  { id: 'dairy', label: 'Dairy' },
                  { id: 'meat', label: 'Meat' },
                  { id: 'grains', label: 'Grains' },
                  { id: 'spices', label: 'Spices' },
                  { id: 'oils', label: 'Oils' },
                  { id: 'beverages', label: 'Beverages' },
                  { id: 'packaging', label: 'Packaging' },
                  { id: 'frozen', label: 'Frozen' },
                  { id: 'bakery', label: 'Bakery' },
                  { id: 'cleaning', label: 'Cleaning' },
                  { id: 'bar', label: 'Bar' },
                  { id: 'others', label: 'Others' },
                  { id: 'all', label: 'All' },
                ].map(cat => {
                  const isActive = categoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={cn(
                        "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer border whitespace-nowrap flex items-center gap-1.5",
                        isActive
                          ? "bg-[#FAF4EB] text-[#B88A52] border-[#FAF0E2] shadow-sm"
                          : "bg-white text-[#8C8375] border-[#E6E1DA] hover:bg-[#FAF7F2] hover:text-[#5A5348]"
                      )}
                    >
                      {renderCategoryIcon(cat.id, isActive)}
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main high-fidelity table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0ECE6] bg-[#FCFAF7] text-[10px] uppercase font-bold text-[#8C8375] tracking-wider">
                    <th className="py-3.5 px-5">Raw Material</th>
                    <th className="py-3.5 px-5 text-[#10B981]">Existing Stock</th>
                    <th className="py-3.5 px-5 text-[#B88A52]">Rate</th>
                    <th className="py-3.5 px-5 text-[#B88A52]">Expiry Date</th>
                    <th className="py-3.5 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFEA]">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#8C8375] text-xs font-semibold">
                        <Package className="w-8 h-8 mx-auto mb-2 text-[#C0B7A6] stroke-1" />
                        No ingredients found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((material) => {
                      const isSelected = selectedMaterialId === material.id;
                      return (
                        <tr 
                          key={material.id}
                          onClick={() => setSelectedMaterialId(material.id)}
                          className={cn(
                            "group cursor-pointer transition-all text-xs font-medium",
                            isSelected 
                              ? "bg-[#FAF4EB]/70 font-semibold" 
                              : "hover:bg-[#FAF7F2]/50 text-[#5A5348]"
                          )}
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2.5 h-2.5 rounded-full flex-shrink-0",
                                material.category === 'vegetables' && 'bg-emerald-400',
                                material.category === 'dairy' && 'bg-blue-400',
                                material.category === 'meat' && 'bg-rose-400',
                                material.category === 'grains' && 'bg-amber-400',
                                material.category === 'spices' && 'bg-orange-400',
                                material.category === 'oils' && 'bg-yellow-400',
                                material.category === 'beverages' && 'bg-cyan-400',
                                material.category === 'packaging' && 'bg-slate-400',
                                material.category === 'frozen' && 'bg-sky-400',
                                material.category === 'bakery' && 'bg-pink-400',
                                material.category === 'cleaning' && 'bg-lime-400',
                                material.category === 'bar' && 'bg-purple-400',
                                material.category === 'kitchen' && 'bg-gray-400',
                                material.category === 'others' && 'bg-slate-500',
                              )} title={`Category: ${material.category}`} />
                              <div>
                                <span className={cn("text-xs block", isSelected ? "text-[#B88A52] font-bold" : "text-[#2C261F] font-semibold group-hover:text-[#B88A52]")}>
                                  {material.name}
                                </span>
                                <span className="text-[10px] text-[#8C8375] uppercase tracking-wider block font-semibold mt-0.5">{material.category}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-sm font-bold text-[#5A5348]">
                            <div className="flex items-baseline gap-1">
                              <span className={cn(material.status === 'low' && 'text-rose-600 font-extrabold')}>{material.existingStock}</span>
                              <span className="text-[10px] text-[#8C8375] font-semibold">{material.unit}</span>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-xs text-[#2C261F] font-bold">
                            {material.costPrice ? `₹${material.costPrice}/${material.unit}` : <span className="text-[#8C8375] font-normal">—</span>}
                          </td>
                          <td className="py-4 px-5 text-xs font-semibold">
                            {(() => {
                              const activeBatches = material.batches?.filter(b => b.quantity > 0) || [];
                              if (activeBatches.length > 1) {
                                return (
                                  <div className="flex flex-col gap-1 w-max">
                                    <span className="text-[9px] font-extrabold text-[#B88A52] uppercase tracking-wider bg-[#FAF4EB] border border-[#FAF0E2] px-1.5 py-0.5 rounded-md inline-block">
                                      📦 {activeBatches.length} Batches
                                    </span>
                                    <div className="flex flex-col gap-0.5 text-[9px] text-[#8C8375] font-bold">
                                      {activeBatches.map((b, i) => (
                                        <span key={b.id || i} className={cn(
                                          b.expiryDate && new Date(b.expiryDate) < new Date() ? "text-rose-600 font-extrabold" : b.expiryDate && new Date(b.expiryDate) <= new Date(Date.now() + 7 * 86400000) ? "text-orange-500 font-bold" : "text-[#5A5348]"
                                        )}>
                                          B{i+1}: {b.expiryDate || 'No Expiry'}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              } else {
                                const primaryDate = activeBatches[0]?.expiryDate || material.expiryDate;
                                if (primaryDate) {
                                  const isExpired = new Date(primaryDate) < new Date();
                                  const isNearExpiry = new Date(primaryDate) <= new Date(Date.now() + 7 * 86400000);
                                  return (
                                    <span className={cn(
                                      isExpired ? "text-rose-600 font-extrabold" : isNearExpiry ? "text-orange-500 font-bold" : "text-[#5A5348]"
                                    )}>
                                      {primaryDate}
                                    </span>
                                  );
                                }
                                return <span className="text-[#8C8375] font-normal">—</span>;
                              }
                            })()}
                          </td>
                          <td className="py-4 px-5 text-right">
                            {material.status === 'low' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                <CheckCircle className="w-2.5 h-2.5" />
                                Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#FCFAF7] border-t border-[#F0ECE6] flex items-center justify-between text-[10px] text-[#8C8375] font-bold flex-wrap gap-2">
              <span>Showing {filteredMaterials.length} of {rawMaterials.length} materials</span>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Vegetables</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Dairy</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> Meat</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Grains</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> Spices</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Oils</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Beverages</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Packaging</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" /> Frozen</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400" /> Bakery</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> Bar</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-lime-400" /> Cleaning</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> Kitchen</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500" /> Others</span>
              </div>
            </div>

          </div>

          {/* RIGHT 1/3 COLUMN: Selected Item Card */}
          <div className="bg-white border border-[#E6E1DA] rounded-2xl shadow-sm p-4 relative">
            {!selectedMaterial ? (
              <div className="text-center py-16 flex flex-col justify-center items-center min-h-[400px]">
                <Package className="w-12 h-12 text-[#8C8375] opacity-30 mb-3" />
                <p className="text-xs font-bold text-[#2C261F]">No Material Selected</p>
                <p className="text-[10px] text-[#8C8375] mt-1 max-w-[200px] leading-relaxed">
                  Select an item from the inventory list to view its batch logs and tracking details.
                </p>
              </div>
            ) : (
              <>
                {/* Header label in card */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#F0ECE6]">
              <span className="text-xs uppercase tracking-wider font-extrabold text-[#8C8375] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B88A52]" />
                Inventory | <span className="text-[#2C261F]">{selectedMaterial.name}</span>
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider",
                selectedMaterial.status === 'low' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              )}>
                {selectedMaterial.status}
              </span>
            </div>

            {/* Illustration preview */}
            <div className="my-4 p-4 rounded-xl bg-[#FBF9F5] border border-[#F0ECE6]/60 text-center flex flex-col justify-center min-h-[140px]">
              {renderItemIllustration(selectedMaterial.category)}
            </div>

            {/* Stock details */}
            <div className="space-y-3.5 mt-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8C8375]">
                <span>Opening Stock</span>
                <span className="text-sm font-bold text-[#2C261F]">{selectedMaterial.openingStock} <span className="text-[10px] font-semibold">{selectedMaterial.unit}</span></span>
              </div>
              
              <div className="flex items-center justify-between text-xs font-semibold text-[#8C8375] border-t border-[#FAF7F2] pt-2.5">
                <span>Closing Stock</span>
                <span className="text-sm font-bold text-[#2C261F]">{selectedMaterial.closingStock} <span className="text-[10px] font-semibold">{selectedMaterial.unit}</span></span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-[#8C8375] border-t border-[#FAF7F2] pt-2.5">
                <span className="text-[#10B981]">Current</span>
                <span className="text-base font-extrabold text-[#10B981]">{selectedMaterial.currentStock} <span className="text-[10px] font-bold">{selectedMaterial.unit}</span></span>
              </div>

              {selectedMaterial.costPrice && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#8C8375] border-t border-[#FAF7F2] pt-2.5">
                  <span>Cost Price</span>
                  <span className="text-sm font-bold text-[#2C261F]">₹{selectedMaterial.costPrice}/{selectedMaterial.unit}</span>
                </div>
              )}
              {selectedMaterial.supplier && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#8C8375] border-t border-[#FAF7F2] pt-2.5">
                  <span>Supplier</span>
                  <span className="text-xs font-bold text-[#2C261F] text-right max-w-[55%] leading-tight">{selectedMaterial.supplier}</span>
                </div>
              )}
              {selectedMaterial.storageLocation && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#8C8375] border-t border-[#FAF7F2] pt-2.5">
                  <span>Storage</span>
                  <span className="text-xs font-bold text-[#2C261F]">{selectedMaterial.storageLocation}</span>
                </div>
              )}
              {selectedMaterial.mfgDate && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#8C8375] border-t border-[#FAF7F2] pt-2.5">
                  <span>Mfg. Date</span>
                  <span className="text-xs font-bold text-[#2C261F]">{selectedMaterial.mfgDate}</span>
                </div>
              )}
              {selectedMaterial.expiryDate && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#8C8375] border-t border-[#FAF7F2] pt-2.5">
                  <span>Expiry Date</span>
                  <span className={cn("text-xs font-bold", new Date(selectedMaterial.expiryDate) <= new Date(Date.now() + 7*86400000) ? 'text-rose-600' : 'text-[#2C261F]')}>{selectedMaterial.expiryDate}</span>
                </div>
              )}
              {/* Active Stock Batches & Expiry Dates */}
              <div className="border-t border-[#FAF7F2] pt-3.5 mt-3.5 space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8375] block">Active Batches & Expiry Dates</span>
                {(!selectedMaterial.batches || selectedMaterial.batches.filter(b => b.quantity > 0).length <= 1) ? (
                  <div className="text-xs text-[#8C8375] font-semibold italic flex items-center justify-between bg-[#FBF9F5]/40 border border-dashed border-[#F0ECE6] p-2 rounded-xl">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Single Batch Tracked</span>
                    <span className="font-bold text-[#5A5348]">{selectedMaterial.expiryDate || 'No Expiry Set'}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedMaterial.batches.filter(b => b.quantity > 0).map((batch, idx) => {
                      const isExpired = batch.expiryDate ? new Date(batch.expiryDate) < new Date() : false;
                      const isNearExpiry = batch.expiryDate ? new Date(batch.expiryDate) <= new Date(Date.now() + 7*86400000) : false;
                      return (
                        <div key={batch.id || idx} className="flex items-center justify-between text-[11px] p-2 bg-[#FBF9F5] border border-[#F0ECE6]/60 rounded-xl hover:border-[#B88A52]/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] px-1.5 py-0.5 bg-[#FAF4EB] text-[#B88A52] font-extrabold uppercase rounded-md border border-[#FAF0E2] tracking-wider">Batch {idx + 1}</span>
                            <span className="font-extrabold text-[#2C261F]">{batch.quantity} {selectedMaterial.unit}</span>
                          </div>
                          <span className={cn("font-bold text-[10px]", isExpired ? "text-rose-600 font-extrabold" : isNearExpiry ? "text-orange-500 font-bold" : "text-[#5A5348]")}>
                            {batch.expiryDate ? `Exp: ${batch.expiryDate}` : 'No Expiry'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {selectedMaterial.minStockAlert !== undefined && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#8C8375] border-t border-[#FAF7F2] pt-2.5">
                  <span>Min Stock Alert</span>
                  <span className="text-xs font-bold text-[#2C261F]">{selectedMaterial.minStockAlert} {selectedMaterial.unit}</span>
                </div>
              )}
              {selectedMaterial.lastRestocked && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#8C8375] border-t border-[#FAF7F2] pt-2.5">
                  <span>Last Restocked</span>
                  <span className="text-xs font-bold text-[#2C261F]">{selectedMaterial.lastRestocked}</span>
                </div>
              )}
            </div>

            {/* Real-time consumption visual slider/gauge */}
            <div className="mt-5 bg-[#FAF7F2] border border-[#EBE7DF] p-3.5 rounded-xl">
              <div className="flex justify-between text-[10px] font-bold text-[#8C8375] mb-1">
                <span>Depletion Analytics</span>
                <span>{Math.round((selectedMaterial.currentStock / selectedMaterial.openingStock) * 100)}% left</span>
              </div>
              <div className="w-full bg-[#E6E1DA] h-2 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    selectedMaterial.status === 'low' ? 'bg-rose-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, (selectedMaterial.currentStock / selectedMaterial.openingStock) * 100))}%` }}
                />
              </div>
              
              <p className="text-[9px] text-[#8C8375] font-semibold mt-2.5 leading-relaxed">
                {selectedMaterial.status === 'low' 
                  ? `⚠️ Critical shortage! This material has depleted below safety threshold. Please initiate a purchase order.`
                  : `✅ Stock levels are healthy. Regular kitchen allocations are operating under standard bounds.`
                }
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div className="mt-5 space-y-2">
              <button
                onClick={() => {
                  setEditingMaterialId(selectedMaterial.id);
                  setEditMaterialForm({
                    name: selectedMaterial.name,
                    category: selectedMaterial.category,
                    unit: selectedMaterial.unit,
                    openingStock: selectedMaterial.openingStock,
                    currentStock: selectedMaterial.currentStock,
                    costPrice: selectedMaterial.costPrice || 0,
                    supplier: selectedMaterial.supplier || '',
                    mfgDate: selectedMaterial.mfgDate || '',
                    expiryDate: selectedMaterial.expiryDate || '',
                    minStockAlert: selectedMaterial.minStockAlert || 0,
                    storageLocation: selectedMaterial.storageLocation || '',
                    newBatchExpiryDate: '',
                  });
                  const isStandard = ["kg", "g", "Ltr.", "ml", "Btls", "Dish", "Pcs", "Dozen", "Bag", "Box", "Roll", "Pack"].includes(selectedMaterial.unit);
                  setIsEditCustomUnit(!isStandard);
                  setIsEditMaterialOpen(true);
                }}
                className="w-full py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm shadow-[#B88A52]/10"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Product Details</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    setStockForm({
                      materialId: selectedMaterial.id,
                      openingStock: selectedMaterial.openingStock,
                      closingStock: selectedMaterial.closingStock,
                      newBatchExpiryDate: '',
                    });
                    setIsStockModalOpen(true);
                  }}
                  className="w-full py-2 bg-[#2C261F] hover:bg-[#3D352C] text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer text-center"
                >
                  Stock Take
                </button>
                
                {selectedMaterial.status === 'low' ? (
                  <button 
                    onClick={() => {
                      setPoForm({
                        itemName: selectedMaterial.name,
                        quantity: Math.max(50, selectedMaterial.openingStock - selectedMaterial.currentStock),
                        unit: selectedMaterial.unit,
                        supplier: selectedMaterial.supplier || '',
                        totalCost: 0,
                        orderDate: new Date().toISOString().split('T')[0],
                        status: 'pending',
                        notes: '',
                      });
                      setEditingPoId(null);
                      setIsPoModalOpen(true);
                    }}
                    className="w-full py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    Order Stock
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setWastageForm({
                        materialId: selectedMaterial.id,
                        quantity: 1,
                        reason: 'Spoilage',
                        cost: 100
                      });
                      setIsWastageModalOpen(true);
                    }}
                    className="w-full py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-center"
                  >
                    Log Wastage
                  </button>
                )}
              </div>
            </div>

            {/* Popup modals rendered inside parent container for perfect lg:absolute side alignment next to the card */}
            {isEditMaterialOpen && (
              <>
                <div onClick={() => setIsEditMaterialOpen(false)} className="fixed inset-0 z-[60] bg-[#23201D]/40 backdrop-blur-sm cursor-pointer animate-fade-in" />
                <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center p-4 lg:absolute lg:inset-auto lg:top-0 lg:right-full lg:mr-4 lg:w-[380px] lg:h-auto lg:p-0 lg:z-[70] animate-fade-in">
                  <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] lg:max-h-none lg:shadow-xl pointer-events-auto animate-scale-up">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 pb-4 border-b border-[#F0ECE6]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-[#FAF4EB] rounded-lg text-[#B88A52] border border-[#FAF0E2]">
                        <Pencil className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#2C261F]">Edit Raw Material</h3>
                        <p className="text-[10px] text-[#8C8375]">Modify properties of the inventory item</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setIsEditMaterialOpen(false)} className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable form body */}
                  <form onSubmit={handleEditMaterialSubmit} className="overflow-y-auto p-6 pt-4 space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Material Name *</label>
                      <input type="text" required placeholder="e.g. Basmati Rice, Chicken Breast…" value={editMaterialForm.name}
                        onChange={e => setEditMaterialForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Category</label>
                        <select
                          value={editMaterialForm.category}
                          onChange={e => setEditMaterialForm(prev => ({ ...prev, category: e.target.value as any }))}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                        >
                          <option value="vegetables">🥦 Vegetables</option>
                          <option value="dairy">🥛 Dairy</option>
                          <option value="meat">🍗 Meat & Seafood</option>
                          <option value="grains">🌾 Grains & Staples</option>
                          <option value="spices">🌶️ Spices & Seasonings</option>
                          <option value="oils">🫙 Oils & Liquids</option>
                          <option value="beverages">🥤 Beverages</option>
                          <option value="packaging">📦 Packaging</option>
                          <option value="frozen">🧊 Frozen Items</option>
                          <option value="bakery">🎂 Bakery</option>
                          <option value="cleaning">🧹 Cleaning & Hygiene</option>
                          <option value="bar">🍷 Bar</option>
                          <option value="kitchen">🔧 Kitchen Supplies</option>
                          <option value="others">📁 Others</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Unit</label>
                        <select
                          value={isEditCustomUnit ? "custom" : (["kg", "g", "Ltr.", "ml", "Btls", "Dish", "Pcs", "Dozen", "Bag", "Box", "Roll", "Pack"].includes(editMaterialForm.unit) ? editMaterialForm.unit : "custom")}
                          onChange={e => {
                            if (e.target.value === "custom") {
                              setIsEditCustomUnit(true);
                              setEditMaterialForm(prev => ({ ...prev, unit: "" }));
                            } else {
                              setIsEditCustomUnit(false);
                              setEditMaterialForm(prev => ({ ...prev, unit: e.target.value }));
                            }
                          }}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                        >
                          <option value="kg">kg</option>
                          <option value="g">g (grams)</option>
                          <option value="Ltr.">Ltr. (Litres)</option>
                          <option value="ml">ml</option>
                          <option value="Btls">Btls (Bottles)</option>
                          <option value="Dish">Dish</option>
                          <option value="Pcs">Pcs (Pieces)</option>
                          <option value="Dozen">Dozen</option>
                          <option value="Bag">Bag</option>
                          <option value="Box">Box</option>
                          <option value="Roll">Roll</option>
                          <option value="Pack">Pack</option>
                          <option value="custom">✍️ Custom Unit...</option>
                        </select>
                        {isEditCustomUnit && (
                          <div className="mt-2 animate-fade-in">
                            <input
                              type="text"
                              required
                              placeholder="Type custom unit..."
                              value={editMaterialForm.unit}
                              onChange={e => setEditMaterialForm(prev => ({ ...prev, unit: e.target.value }))}
                              className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Opening Stock</label>
                        <input type="number" min="0" value={editMaterialForm.openingStock}
                          onChange={e => setEditMaterialForm(prev => ({ ...prev, openingStock: Number(e.target.value) }))}
                          className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Current Stock</label>
                        <input type="number" min="0" value={editMaterialForm.currentStock}
                          onChange={e => setEditMaterialForm(prev => ({ ...prev, currentStock: Number(e.target.value) }))}
                          className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all" />
                      </div>
                    </div>

                    {editMaterialForm.currentStock > selectedMaterial.currentStock && (
                      <div className="p-3 bg-amber-50/60 border border-amber-200/50 rounded-xl space-y-2 animate-fade-in">
                        <span className="block text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                          🎁 You are adding new stock! (+{editMaterialForm.currentStock - selectedMaterial.currentStock} {selectedMaterial.unit})
                        </span>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">
                          New Batch Expiry Date
                        </label>
                        <input
                          type="date"
                          required
                          value={(editMaterialForm as any).newBatchExpiryDate || ''}
                          onChange={(e) => setEditMaterialForm(prev => ({ ...prev, newBatchExpiryDate: e.target.value } as any))}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] cursor-pointer bg-white"
                        />
                        <span className="block text-[9px] text-[#8C8375] font-semibold leading-relaxed">
                          This creates a separate batch to distinguish the new stock's expiry date from the existing stock.
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Cost Price (₹)</label>
                        <input type="number" min="0" value={editMaterialForm.costPrice}
                          onChange={e => setEditMaterialForm(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                          className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Min Stock Alert</label>
                        <input type="number" min="0" value={editMaterialForm.minStockAlert}
                          onChange={e => setEditMaterialForm(prev => ({ ...prev, minStockAlert: Number(e.target.value) }))}
                          className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375]">Supplier</label>
                          {!isAddingEditMaterialSupplier ? (
                            <button
                              type="button"
                              onClick={() => setIsAddingEditMaterialSupplier(true)}
                              className="text-[10px] font-bold text-[#B88A52] hover:text-[#C99E65] transition-colors"
                            >
                              + Add New
                            </button>
                          ) : null}
                        </div>
                        {!isAddingEditMaterialSupplier ? (
                          <select value={editMaterialForm.supplier}
                            onChange={e => setEditMaterialForm(prev => ({ ...prev, supplier: e.target.value }))}
                            className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer">
                            <option value="">Select supplier…</option>
                            {suppliers.map(s => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newEditMaterialSupplierName}
                              onChange={(e) => setNewEditMaterialSupplierName(e.target.value)}
                              placeholder="Supplier name"
                              className="flex-1 text-xs font-semibold px-2 py-1.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newEditMaterialSupplierName.trim()) {
                                  const name = newEditMaterialSupplierName.trim();
                                  if (!suppliers.some(s => s.name.toLowerCase() === name.toLowerCase())) {
                                    setSuppliers(prev => [...prev, { name }]);
                                  }
                                  setEditMaterialForm(prev => ({ ...prev, supplier: name }));
                                  setNewEditMaterialSupplierName('');
                                  setIsAddingEditMaterialSupplier(false);
                                }
                              }}
                              className="px-2 py-1.5 bg-[#B88A52] hover:bg-[#C99E65] text-white text-[10px] font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingEditMaterialSupplier(false);
                                setNewEditMaterialSupplierName('');
                              }}
                              className="px-2 py-1.5 border border-[#E6E1DA] text-[#5A5348] text-[10px] font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375]">Storage Location</label>
                          {!isAddingEditMaterialStorage ? (
                            <button
                              type="button"
                              onClick={() => setIsAddingEditMaterialStorage(true)}
                              className="text-[10px] font-bold text-[#B88A52] hover:text-[#C99E65] transition-colors"
                            >
                              + Add New
                            </button>
                          ) : null}
                        </div>
                        {!isAddingEditMaterialStorage ? (
                          <select value={editMaterialForm.storageLocation}
                            onChange={e => setEditMaterialForm(prev => ({ ...prev, storageLocation: e.target.value }))}
                            className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer">
                            <option value="">Select location…</option>
                            {storageSections.map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newEditMaterialStorageName}
                              onChange={(e) => setNewEditMaterialStorageName(e.target.value)}
                              placeholder="Storage name"
                              className="flex-1 text-xs font-semibold px-2 py-1.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newEditMaterialStorageName.trim()) {
                                  const name = newEditMaterialStorageName.trim();
                                  if (!storageSections.includes(name)) {
                                    setStorageSections(prev => [...prev, name]);
                                  }
                                  setEditMaterialForm(prev => ({ ...prev, storageLocation: name }));
                                  setNewEditMaterialStorageName('');
                                  setIsAddingEditMaterialStorage(false);
                                }
                              }}
                              className="px-2 py-1.5 bg-[#B88A52] hover:bg-[#C99E65] text-white text-[10px] font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingEditMaterialStorage(false);
                                setNewEditMaterialStorageName('');
                              }}
                              className="px-2 py-1.5 border border-[#E6E1DA] text-[#5A5348] text-[10px] font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Mfg. Date <span className="normal-case font-normal">(optional)</span></label>
                        <input type="date" value={editMaterialForm.mfgDate}
                          onChange={e => setEditMaterialForm(prev => ({ ...prev, mfgDate: e.target.value }))}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] transition-all cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Expiry Date <span className="normal-case font-normal">(optional)</span></label>
                        <input type="date" value={editMaterialForm.expiryDate}
                          onChange={e => setEditMaterialForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] transition-all cursor-pointer" />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0ECE6]">
                      <button type="button" onClick={() => setIsEditMaterialOpen(false)}
                        className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                        Cancel
                      </button>
                      <button type="submit"
                        className="px-5 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-[#B88A52]/20 cursor-pointer flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Save Product Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

            {isStockModalOpen && (
              <>
                <div onClick={() => setIsStockModalOpen(false)} className="fixed inset-0 z-[60] bg-[#23201D]/40 backdrop-blur-sm cursor-pointer animate-fade-in" />
                <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center p-4 lg:absolute lg:inset-auto lg:top-0 lg:right-full lg:mr-4 lg:w-[380px] lg:h-auto lg:p-0 lg:z-[70] animate-fade-in">
                  <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-xl overflow-hidden p-6 lg:shadow-xl pointer-events-auto animate-scale-up">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE6]">
                    <h3 className="text-base font-bold text-[#2C261F] flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-[#B88A52]" />
                      Update Stock Audit
                    </h3>
                    <button 
                      onClick={() => setIsStockModalOpen(false)}
                      className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveStock} className="space-y-4 mt-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Select Ingredient</label>
                      <select
                        value={stockForm.materialId}
                        onChange={(e) => {
                          const item = rawMaterials.find(r => r.id === e.target.value);
                          if (item) {
                            setStockForm(prev => ({
                              ...prev,
                              materialId: item.id,
                              openingStock: item.openingStock,
                              closingStock: item.closingStock,
                              newBatchExpiryDate: '',
                            }));
                          }
                        }}
                        className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                      >
                        {rawMaterials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Opening Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={stockForm.openingStock}
                          onChange={(e) => setStockForm(prev => ({ ...prev, openingStock: Number(e.target.value) }))}
                          className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Closing / Current Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={stockForm.closingStock}
                          onChange={(e) => setStockForm(prev => ({ ...prev, closingStock: Number(e.target.value) }))}
                          className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                        />
                      </div>
                    </div>

                    {(() => {
                      const currentItem = rawMaterials.find(r => r.id === stockForm.materialId);
                      const hasAddedStock = currentItem ? stockForm.closingStock > currentItem.currentStock : false;
                      if (!hasAddedStock) return null;
                      return (
                        <div className="p-3 bg-amber-50/60 border border-amber-200/50 rounded-xl space-y-2 animate-fade-in">
                          <span className="block text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                            🎁 You are adding new stock! (+{stockForm.closingStock - (currentItem?.currentStock || 0)} {currentItem?.unit})
                          </span>
                          <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">
                            New Batch Expiry Date
                          </label>
                          <input
                            type="date"
                            required
                            value={(stockForm as any).newBatchExpiryDate || ''}
                            onChange={(e) => setStockForm(prev => ({ ...prev, newBatchExpiryDate: e.target.value } as any))}
                            className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] cursor-pointer bg-white"
                          />
                          <span className="block text-[9px] text-[#8C8375] font-semibold leading-relaxed">
                            This creates a new batch to track the expiration separate from the existing stock.
                          </span>
                        </div>
                      );
                    })()}

                    <div className="p-3 bg-[#FAF4EB]/60 border border-[#FAF0E2] rounded-xl text-[10px] text-[#8C8375] font-semibold flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#B88A52] flex-shrink-0" />
                      <span>Entering audited closing stocks will automatically recalculate the active inventory level status logs shown in kitchen analytics.</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0ECE6]">
                      <button
                        type="button"
                        onClick={() => setIsStockModalOpen(false)}
                        className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-[#B88A52]/20 cursor-pointer"
                      >
                        Audit Stock Record
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

            {isWastageModalOpen && (
              <>
                <div onClick={() => setIsWastageModalOpen(false)} className="fixed inset-0 z-[60] bg-[#23201D]/40 backdrop-blur-sm cursor-pointer animate-fade-in" />
                <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center p-4 lg:absolute lg:inset-auto lg:top-0 lg:right-full lg:mr-4 lg:w-[380px] lg:h-auto lg:p-0 lg:z-[70] animate-fade-in">
                  <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-xl overflow-hidden p-6 lg:shadow-xl pointer-events-auto animate-scale-up">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE6]">
                    <h3 className="text-base font-bold text-rose-700 flex items-center gap-1.5">
                      <Trash2 className="w-5 h-5" />
                      Log Material Loss & Spoilage
                    </h3>
                    <button 
                      onClick={() => setIsWastageModalOpen(false)}
                      className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleLogWastage} className="space-y-4 mt-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Select Spoiled Ingredient</label>
                      <select
                        value={wastageForm.materialId}
                        onChange={(e) => setWastageForm(prev => ({ ...prev, materialId: e.target.value }))}
                        className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                      >
                        {rawMaterials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Wasted Volume</label>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={wastageForm.quantity}
                          onChange={(e) => setWastageForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Financial Impact (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={wastageForm.cost}
                          onChange={(e) => setWastageForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                          className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Wastage Primary Reason</label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        {['Spoilage', 'Expired', 'Spillage', 'Theft'].map(reason => (
                          <button
                            type="button"
                            key={reason}
                            onClick={() => setWastageForm(prev => ({ ...prev, reason: reason as any }))}
                            className={cn(
                              "py-2 text-[10px] font-bold uppercase rounded-lg border tracking-wider transition-all cursor-pointer text-center",
                              wastageForm.reason === reason 
                                ? "bg-rose-50 border-rose-300 text-rose-700 shadow-sm"
                                : "bg-white border-[#E6E1DA] text-[#8C8375] hover:bg-[#FAF7F2]"
                            )}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0ECE6]">
                      <button
                        type="button"
                        onClick={() => setIsWastageModalOpen(false)}
                        className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-rose-200 cursor-pointer"
                      >
                        Log Food Wastage
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
              </>
            )}
          </div>

        </div>
      )}



      {/* 4. SALES TAB CONTENT PANEL */}
      {activeTab === 'sales' && (
        <div className="bg-white border border-[#E6E1DA] rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#2C261F]">Daily Ingredient Depletion (Sales Driven)</h2>
              <p className="text-xs text-[#8C8375]">Estimated inventory raw materials depleted from sales transactions.</p>
            </div>
            <div className="px-3 py-1.5 bg-[#FAF4EB] border border-[#FAF0E2] text-xs font-bold text-[#B88A52] rounded-xl flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5" />
              <span>Live Syncing</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F0ECE6] bg-[#FCFAF7] text-[10px] uppercase font-bold text-[#8C8375]">
                  <th className="py-3 px-4">Menu Item Ordered</th>
                  <th className="py-3 px-4 text-center">Qty Sold</th>
                  <th className="py-3 px-4">Estimated Ingredient Deductions</th>
                  <th className="py-3 px-4">Sale Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA] text-xs font-medium text-[#5A5348]">
                {salesData.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF7F2]/40">
                    <td className="py-3.5 px-4 font-semibold text-[#2C261F]">{s.menuProduct}</td>
                    <td className="py-3.5 px-4 text-center text-sm font-bold text-[#5A5348]">{s.quantitySold}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-amber-700 bg-amber-50/40">{s.estimatedRawMaterialUsed}</td>
                    <td className="py-3.5 px-4 text-[#8C8375] font-semibold">{s.date}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] uppercase font-bold tracking-wider">
                        Deducted
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. WASTAGE TAB CONTENT PANEL */}
      {activeTab === 'wastage' && (
        <div className="bg-white border border-[#E6E1DA] rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#2C261F]">Wastage & Spoilage Log</h2>
              <p className="text-xs text-[#8C8375]">Log spoiled raw materials and track associated kitchen losses.</p>
            </div>
            <button
              onClick={() => {
                setWastageForm({
                  materialId: rawMaterials[4]?.id || 'rm-5',
                  quantity: 1,
                  reason: 'Spoilage',
                  cost: 100
                });
                setIsWastageModalOpen(true);
              }}
              className="px-3 py-2 bg-[#2C261F] hover:bg-[#3D352C] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Log Material Loss</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F0ECE6] bg-[#FCFAF7] text-[10px] uppercase font-bold text-[#8C8375]">
                  <th className="py-3 px-4">Raw Material</th>
                  <th className="py-3 px-4">Loss Date</th>
                  <th className="py-3 px-4">Wasted Quantity</th>
                  <th className="py-3 px-4">Waste Reason</th>
                  <th className="py-3 px-4 text-right">Financial Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA] text-xs font-medium text-[#5A5348]">
                {wastageData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-[#8C8375] font-semibold">
                      No material losses logged this week. Good job!
                    </td>
                  </tr>
                ) : (
                  wastageData.map((w) => (
                    <tr key={w.id} className="hover:bg-rose-50/20">
                      <td className="py-3.5 px-4 font-bold text-[#2C261F]">{w.name}</td>
                      <td className="py-3.5 px-4 text-[#8C8375] font-semibold">{w.date}</td>
                      <td className="py-3.5 px-4 text-rose-600 font-extrabold">{w.quantity} {w.unit}</td>
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider border",
                          w.reason === 'Spoilage' && 'bg-amber-50 text-amber-700 border-amber-100',
                          w.reason === 'Expired' && 'bg-rose-50 text-rose-700 border-rose-100',
                          w.reason === 'Spillage' && 'bg-orange-50 text-orange-700 border-orange-100',
                          w.reason === 'Theft' && 'bg-purple-50 text-purple-700 border-purple-100',
                        )}>
                          {w.reason}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 text-sm">₹{w.cost}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PURCHASE ORDER TAB CONTENT PANEL */}
      {activeTab === 'purchase_orders' && (() => {
        // Resolve raw material category helper
        const getPOCategory = (itemName: string): string => {
          const nameLower = itemName.toLowerCase();
          const exactMatch = rawMaterials.find(m => m.name.toLowerCase() === nameLower);
          if (exactMatch) return exactMatch.category;

          const partialMatch = rawMaterials.find(m => 
            m.name.toLowerCase().includes(nameLower) || 
            nameLower.includes(m.name.toLowerCase())
          );
          if (partialMatch) return partialMatch.category;

          return 'others';
        };

        // Group purchase orders dynamically by supplier partner
        const activeSuppliersMap = purchaseOrders.reduce((acc, po) => {
          const supName = po.supplier ? po.supplier.trim() : 'Unassigned / Drafts';
          let existing = acc.find(x => x.name.toLowerCase() === supName.toLowerCase());
          if (!existing) {
            existing = { name: supName, orders: [] };
            acc.push(existing);
          }
          existing.orders.push(po);
          return acc;
        }, [] as { name: string; orders: PurchaseOrder[] }[]);

        // Sort: alphabetical, with "Unassigned / Drafts" at the bottom
        const sortedSuppliers = [...activeSuppliersMap].sort((a, b) => {
          if (a.name === 'Unassigned / Drafts') return 1;
          if (b.name === 'Unassigned / Drafts') return -1;
          return a.name.localeCompare(b.name);
        });

        return (
          <div className="bg-white border border-[#E6E1DA] rounded-2xl shadow-sm p-5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#F0ECE6]">
              <div>
                <h2 className="text-base font-bold text-[#2C261F]">Purchase Orders (POs)</h2>
                <p className="text-xs text-[#8C8375]">Procurement pipelines, wholesale deliveries, and supplier accounts grouped by active supplier.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => downloadPOListPDF("All Purchase Orders Consolidated", purchaseOrders)}
                  className="px-3 py-2 border border-[#B88A52] text-[#B88A52] hover:bg-[#FAF4EB] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All POs PDF</span>
                </button>
                <button
                  onClick={() => {
                    setPoForm({
                      itemName: 'Potato',
                      quantity: 100,
                      unit: 'kg',
                      supplier: '',
                      totalCost: 0,
                      orderDate: new Date().toISOString().split('T')[0],
                      status: 'pending',
                      notes: '',
                    });
                    setEditingPoId(null);
                    setPoModalCategory('vegetables');
                    setIsPoModalOpen(true);
                  }}
                  className="px-3 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Purchase Order</span>
                </button>
              </div>
            </div>

            {sortedSuppliers.length === 0 ? (
              <div className="p-12 text-center bg-[#FCFAF7] border border-dashed border-[#E6E1DA] rounded-2xl">
                <p className="text-sm font-semibold text-[#8C8375]">No purchase orders found.</p>
                <button
                  onClick={() => {
                    setPoForm({
                      itemName: 'Potato',
                      quantity: 100,
                      unit: 'kg',
                      supplier: '',
                      totalCost: 0,
                      orderDate: new Date().toISOString().split('T')[0],
                      status: 'pending',
                      notes: '',
                    });
                    setEditingPoId(null);
                    setPoModalCategory('vegetables');
                    setIsPoModalOpen(true);
                  }}
                  className="mt-3 px-3.5 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Create Your First PO
                </button>
              </div>
            ) : (
              sortedSuppliers.map(sup => (
                <div key={sup.name} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAF9F6]/40 p-3 rounded-xl border border-[#F0ECE6]">
                    <div>
                      <h3 className="text-sm font-bold text-[#2C261F] flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#B88A52]" />
                        <span className="uppercase tracking-wider text-xs">{sup.name} Section</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FAF4EB] text-[#B88A52] font-extrabold border border-[#FAF0E2]">
                          {sup.orders.length} {sup.orders.length === 1 ? 'Order' : 'Orders'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-[#8C8375] mt-0.5">Procurement orders corresponding to supplier {sup.name}.</p>
                    </div>
                    <button
                      onClick={() => downloadPOListPDF(`Supplier POs - ${sup.name}`, sup.orders)}
                      className="px-2.5 py-1.5 border border-[#B88A52]/60 text-[#B88A52] hover:bg-[#FAF4EB] text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Supplier PO PDF</span>
                    </button>
                  </div>
                  {renderPOTable(sup.orders, `${sup.name} Section`)}
                </div>
              ))
            )}
          </div>
        );
      })()}




      {/* MODAL WINDOWS */}
      {/* 1. STOCK ADJUSTMENT MODAL */}


      {/* 2. EXCEL / CSV IMPORT MODAL */}
      {/* 2. SUPPLIERS MANAGEMENT MODAL */}
      {isSuppliersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23201D]/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-6 pb-3 border-b border-[#F0ECE6]">
              <h3 className="text-base font-bold text-[#2C261F] flex items-center gap-1.5">
                <Truck className="w-5 h-5 text-[#B88A52]" />
                <span>Manage Supplier Partners</span>
              </h3>
              <button 
                onClick={() => {
                  setIsSuppliersModalOpen(false);
                  setNewSupplierInput('');
                  setNewSupplierMobile('');
                  setNewSupplierEmail('');
                  setEditingSupplierName(null);
                }}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col overflow-hidden space-y-4">
              <div className="space-y-3 p-4 bg-[#FAF9F6] border border-[#F0ECE6] rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#B88A52] uppercase tracking-wider">
                    {editingSupplierName ? 'Edit Supplier Partner' : 'Register New Partner'}
                  </span>
                  {editingSupplierName && (
                    <button
                      onClick={() => {
                        setEditingSupplierName(null);
                        setNewSupplierInput('');
                        setNewSupplierMobile('');
                        setNewSupplierEmail('');
                      }}
                      className="text-[10px] font-semibold text-[#8C8375] hover:text-[#2C261F] underline cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Farm Pvt Ltd"
                    value={newSupplierInput}
                    onChange={(e) => setNewSupplierInput(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Mobile (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={newSupplierMobile}
                      onChange={(e) => setNewSupplierMobile(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. contact@farm.com"
                      value={newSupplierEmail}
                      onChange={(e) => setNewSupplierEmail(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] bg-white"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const name = newSupplierInput.trim();
                    const mobile = newSupplierMobile.trim();
                    const email = newSupplierEmail.trim();
                    if (!name) return;

                    if (editingSupplierName) {
                      const oldName = editingSupplierName;
                      if (name.toLowerCase() !== oldName.toLowerCase() && suppliers.some(s => s.name.toLowerCase() === name.toLowerCase())) {
                        alert('A supplier with this name already exists.');
                        return;
                      }
                      setSuppliers(prev => prev.map(s => s.name === oldName ? { name, mobile: mobile || undefined, email: email || undefined } : s));
                      setRawMaterials(prev => prev.map(rm => rm.supplier === oldName ? { ...rm, supplier: name } : rm));
                      setPurchaseOrders(prev => prev.map(po => po.supplier === oldName ? { ...po, supplier: name } : po));
                      setNewSupplierInput('');
                      setNewSupplierMobile('');
                      setNewSupplierEmail('');
                      setEditingSupplierName(null);
                    } else {
                      if (!suppliers.some(s => s.name.toLowerCase() === name.toLowerCase())) {
                        setSuppliers(prev => [...prev, { name, mobile: mobile || undefined, email: email || undefined }]);
                        setNewSupplierInput('');
                        setNewSupplierMobile('');
                        setNewSupplierEmail('');
                      } else {
                        alert('A supplier with this name already exists.');
                      }
                    }
                  }}
                  className="w-full py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer text-center"
                >
                  {editingSupplierName ? 'Update Supplier Partner' : 'Add Supplier Partner'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto border border-[#E6E1DA] rounded-xl divide-y divide-[#F3EFEA] bg-white">
                {suppliers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8C8375] font-semibold">
                    No suppliers registered yet.
                  </div>
                ) : (
                  suppliers.map(sup => (
                    <div key={sup.name} className={`flex items-center justify-between px-4 py-3 hover:bg-[#FAF7F2]/30 transition-all ${editingSupplierName === sup.name ? 'bg-[#FAF4EB]/60' : ''}`}>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#2C261F] block">{sup.name}</span>
                        {(sup.mobile || sup.email) && (
                          <div className="flex items-center gap-3 text-[10px] text-[#8C8375] font-semibold">
                            {sup.mobile && <span className="flex items-center gap-1">📞 {sup.mobile}</span>}
                            {sup.email && <span className="flex items-center gap-1">✉️ {sup.email}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingSupplierName(sup.name);
                            setNewSupplierInput(sup.name);
                            setNewSupplierMobile(sup.mobile || '');
                            setNewSupplierEmail(sup.email || '');
                          }}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${editingSupplierName === sup.name ? 'bg-[#B88A52]/20 text-[#B88A52]' : 'hover:bg-[#FAF4EB] text-[#8C8375] hover:text-[#B88A52]'}`}
                          title={`Edit ${sup.name}`}
                        >
                          <Pencil className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (editingSupplierName === sup.name) {
                              setEditingSupplierName(null);
                              setNewSupplierInput('');
                              setNewSupplierMobile('');
                              setNewSupplierEmail('');
                            }
                            setSuppliers(prev => prev.filter(s => s.name !== sup.name));
                          }}
                          className="p-1 rounded-lg hover:bg-red-50 text-[#8C8375] hover:text-red-500 transition-colors cursor-pointer"
                          title={`Delete ${sup.name}`}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 pt-3 border-t border-[#F0ECE6] flex justify-end">
              <button
                onClick={() => {
                  setIsSuppliersModalOpen(false);
                  setNewSupplierInput('');
                  setNewSupplierMobile('');
                  setNewSupplierEmail('');
                  setEditingSupplierName(null);
                }}
                className="px-5 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. STORAGE SECTIONS MANAGEMENT MODAL */}
      {isStorageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23201D]/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-6 pb-3 border-b border-[#F0ECE6]">
              <h3 className="text-base font-bold text-[#2C261F] flex items-center gap-1.5">
                <Warehouse className="w-5 h-5 text-[#B88A52]" />
                <span>Manage Storage Sections</span>
              </h3>
              <button 
                onClick={() => {
                  setIsStorageModalOpen(false);
                  setNewStorageInput('');
                }}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col overflow-hidden space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter new storage section name..."
                  value={newStorageInput}
                  onChange={(e) => setNewStorageInput(e.target.value)}
                  className="flex-1 text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const name = newStorageInput.trim();
                      if (name && !storageSections.includes(name)) {
                        setStorageSections(prev => [...prev, name]);
                        setNewStorageInput('');
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const name = newStorageInput.trim();
                    if (name && !storageSections.includes(name)) {
                      setStorageSections(prev => [...prev, name]);
                      setNewStorageInput('');
                    }
                  }}
                  className="px-4 py-2.5 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex-1 overflow-y-auto border border-[#E6E1DA] rounded-xl divide-y divide-[#F3EFEA] bg-white">
                {storageSections.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8C8375] font-semibold">
                    No storage sections registered yet.
                  </div>
                ) : (
                  storageSections.map(loc => (
                    <div key={loc} className="flex items-center justify-between px-4 py-3 hover:bg-[#FAF7F2]/30">
                      <span className="text-xs font-bold text-[#5A5348]">{loc}</span>
                      <button
                        onClick={() => {
                          setStorageSections(prev => prev.filter(s => s !== loc));
                        }}
                        className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                        title={`Delete ${loc}`}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 pt-3 border-t border-[#F0ECE6] flex justify-end">
              <button
                onClick={() => {
                  setIsStorageModalOpen(false);
                  setNewStorageInput('');
                }}
                className="px-5 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PURCHASE ORDER MODAL */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23201D]/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-6 pb-3 border-b border-[#F0ECE6]">
              <h3 className="text-base font-bold text-[#B88A52] flex items-center gap-1.5">
                <ShoppingBag className="w-5 h-5" />
                {editingPoId ? 'Edit Draft Purchase Order (PO)' : 'Draft Purchase Order (PO)'}
              </h3>
              <button 
                onClick={() => setIsPoModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Product Section (Category)</label>
                  <select
                    value={poModalCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setPoModalCategory(cat);
                      // Auto-select first product in this category
                      const firstMat = rawMaterials.find(m => m.category === cat);
                      if (firstMat) {
                        setPoForm(prev => ({
                          ...prev,
                          itemName: firstMat.name,
                          unit: firstMat.unit
                        }));
                      } else {
                        setPoForm(prev => ({
                          ...prev,
                          itemName: '',
                          unit: 'kg'
                        }));
                      }
                    }}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                  >
                    <option value="vegetables">Veggies</option>
                    <option value="dairy">Dairy</option>
                    <option value="meat">Meat</option>
                    <option value="grains">Grains</option>
                    <option value="spices">Spices</option>
                    <option value="oils">Oils</option>
                    <option value="beverages">Beverages</option>
                    <option value="packaging">Packaging</option>
                    <option value="frozen">Frozen</option>
                    <option value="bakery">Bakery</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="bar">Bar</option>
                    <option value="others">Others / Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Product Name</label>
                  {poModalCategory !== 'others' ? (
                    <select
                      value={poForm.itemName}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setPoForm(prev => ({ ...prev, itemName: '' }));
                        } else {
                          const mat = rawMaterials.find(m => m.name === val);
                          setPoForm(prev => ({
                            ...prev,
                            itemName: val,
                            unit: mat ? mat.unit : prev.unit
                          }));
                        }
                      }}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                    >
                      <option value="">-- Choose Product --</option>
                      {rawMaterials.filter(m => m.category === poModalCategory).map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                      <option value="__custom__">➕ Custom Product...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={poForm.itemName}
                      onChange={(e) => setPoForm(prev => ({ ...prev, itemName: e.target.value }))}
                      className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                      placeholder="Enter custom product name"
                      required
                    />
                  )}
                </div>
              </div>

              {/* If category is not others, but user selected custom product, show the text input below */}
              {poModalCategory !== 'others' && !rawMaterials.some(m => m.name === poForm.itemName && m.category === poModalCategory) && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Custom Product Name</label>
                  <input
                    type="text"
                    value={poForm.itemName}
                    onChange={(e) => setPoForm(prev => ({ ...prev, itemName: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    placeholder="Enter custom product name"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Quantity Required</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={poForm.quantity}
                      onChange={(e) => setPoForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    />
                    <input
                      type="text"
                      value={poForm.unit}
                      onChange={(e) => setPoForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-16 text-center text-xs font-bold px-1 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                      placeholder="kg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Order Date</label>
                  <input
                    type="date"
                    value={poForm.orderDate}
                    onChange={(e) => setPoForm(prev => ({ ...prev, orderDate: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] cursor-pointer bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375]">Choose Supplier Partner <span className="normal-case font-normal">(optional)</span></label>
                  {!isAddingPoSupplier ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingPoSupplier(true)}
                      className="text-[10px] font-bold text-[#B88A52] hover:text-[#C99E65] transition-colors"
                    >
                      + Add New Supplier
                    </button>
                  ) : null}
                </div>
                {!isAddingPoSupplier ? (
                  <select
                    value={poForm.supplier}
                    onChange={(e) => setPoForm(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                  >
                    <option value="">-- No Supplier Assigned Yet --</option>
                    {suppliers.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPoSupplierName}
                      onChange={(e) => setNewPoSupplierName(e.target.value)}
                      placeholder="Enter new supplier name"
                      className="flex-1 text-xs font-semibold px-3.5 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newPoSupplierName.trim()) {
                          const name = newPoSupplierName.trim();
                          if (!suppliers.some(s => s.name.toLowerCase() === name.toLowerCase())) {
                            setSuppliers(prev => [...prev, { name }]);
                          }
                          setPoForm(prev => ({ ...prev, supplier: name }));
                          setNewPoSupplierName('');
                          setIsAddingPoSupplier(false);
                        }
                      }}
                      className="px-3 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingPoSupplier(false);
                        setNewPoSupplierName('');
                      }}
                      className="px-3 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Notes / Special Instructions <span className="normal-case font-normal">(optional)</span></label>
                <textarea
                  value={poForm.notes}
                  onChange={(e) => setPoForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-xs font-semibold px-3.5 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] min-h-[60px] resize-none"
                  placeholder="e.g. Please supply fresh batches only, pack in standard boxes..."
                />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-[#F0ECE6]">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPoModalOpen(false)}
                    className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSavePOWithStatus('draft')}
                      disabled={!poForm.itemName.trim()}
                      className="px-4 py-2 bg-[#FAF7F2] border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#F0ECE6] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePOWithStatus('pending')}
                      disabled={!poForm.itemName.trim()}
                      className="px-4 py-2 bg-[#2C261F] hover:bg-[#3D352E] text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-[#2C261F]/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save to Purchase Order
                    </button>
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}



      {/* 5. RECEIVE STOCK MODAL */}
      {isReceiveStockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23201D]/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-6 pb-3 border-b border-[#F0ECE6]">
              <h3 className="text-base font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle className="w-5 h-5" />
                <span>Receive Stock (Fulfillment)</span>
              </h3>
              <button 
                onClick={() => setIsReceiveStockOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReceiveStockSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Product</label>
                <input
                  type="text"
                  disabled
                  value={receiveForm.itemName}
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] bg-gray-50 rounded-xl outline-none text-[#8C8375] cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Ordered Qty</label>
                  <input
                    type="text"
                    disabled
                    value={`${receiveForm.quantity} ${receiveForm.unit}`}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] bg-gray-50 rounded-xl outline-none text-[#8C8375] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-emerald-800 mb-1">Delivered Qty</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={receiveForm.deliveredQty}
                      onChange={(e) => setReceiveForm(prev => ({ ...prev, deliveredQty: Number(e.target.value) }))}
                      className="w-full text-xs font-extrabold px-3.5 py-2.5 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl outline-none text-emerald-950 bg-emerald-50/20"
                    />
                    <span className="flex items-center text-xs font-bold text-[#8C8375] px-2">{receiveForm.unit}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={receiveForm.purchasePrice || ''}
                    onChange={(e) => setReceiveForm(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    placeholder="e.g. 1400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Batch No</label>
                  <input
                    type="text"
                    required
                    value={receiveForm.batchNo}
                    onChange={(e) => setReceiveForm(prev => ({ ...prev, batchNo: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    placeholder="e.g. BAT-001"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375]">Supplier</label>
                  {!isAddingReceiveSupplier ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingReceiveSupplier(true)}
                      className="text-[10px] font-bold text-[#B88A52] hover:text-[#C99E65] transition-colors"
                    >
                      + Add New Supplier
                    </button>
                  ) : null}
                </div>
                {!isAddingReceiveSupplier ? (
                  <select
                    value={receiveForm.supplier}
                    onChange={(e) => setReceiveForm(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Supplier Partner --</option>
                    {suppliers.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newReceiveSupplierName}
                      onChange={(e) => setNewReceiveSupplierName(e.target.value)}
                      placeholder="Enter new supplier name"
                      className="flex-1 text-xs font-semibold px-3.5 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newReceiveSupplierName.trim()) {
                          const name = newReceiveSupplierName.trim();
                          if (!suppliers.some(s => s.name.toLowerCase() === name.toLowerCase())) {
                            setSuppliers(prev => [...prev, { name }]);
                          }
                          setReceiveForm(prev => ({ ...prev, supplier: name }));
                          setNewReceiveSupplierName('');
                          setIsAddingReceiveSupplier(false);
                        }
                      }}
                      className="px-3 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingReceiveSupplier(false);
                        setNewReceiveSupplierName('');
                      }}
                      className="px-3 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Mfg Date</label>
                  <input
                    type="date"
                    required
                    value={receiveForm.mfgDate}
                    onChange={(e) => setReceiveForm(prev => ({ ...prev, mfgDate: e.target.value }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] cursor-pointer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={receiveForm.expiryDate}
                    onChange={(e) => setReceiveForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] cursor-pointer bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200/50 rounded-xl text-[9px] text-emerald-800 font-semibold leading-relaxed">
                🎉 Saving this receipt will increase the inventory levels of <strong className="text-emerald-950">{receiveForm.itemName}</strong> by <strong className="text-emerald-950">{receiveForm.deliveredQty} {receiveForm.unit}</strong>, log a new batch <strong>{receiveForm.batchNo}</strong> with expiration, and mark this order as <strong>Completed</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#F0ECE6]">
                <button
                  type="button"
                  onClick={() => setIsReceiveStockOpen(false)}
                  className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Save Receipt & Receive Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ADD RAW MATERIAL MODAL */}
      {isAddMaterialOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#23201D]/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#F0ECE6]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FAF4EB] rounded-lg text-[#B88A52] border border-[#FAF0E2]">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C261F]">Add New Raw Material</h3>
                  <p className="text-[10px] text-[#8C8375]">Add a new ingredient to your inventory list</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsAddMaterialOpen(false)} className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleAddMaterial} className="overflow-y-auto p-6 pt-4 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Material Name *</label>
                <input type="text" required placeholder="e.g. Basmati Rice, Chicken Breast…" value={addMaterialForm.name}
                  onChange={e => setAddMaterialForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] placeholder-[#A89F90] transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Category</label>
                  <select
                    value={addMaterialForm.category}
                    onChange={e => setAddMaterialForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                  >
                    <option value="vegetables">🥦 Vegetables</option>
                    <option value="dairy">🥛 Dairy</option>
                    <option value="meat">🍗 Meat & Seafood</option>
                    <option value="grains">🌾 Grains & Staples</option>
                    <option value="spices">🌶️ Spices & Seasonings</option>
                    <option value="oils">🫙 Oils & Liquids</option>
                    <option value="beverages">🥤 Beverages</option>
                    <option value="packaging">📦 Packaging</option>
                    <option value="frozen">🧊 Frozen Items</option>
                    <option value="bakery">🎂 Bakery</option>
                    <option value="cleaning">🧹 Cleaning & Hygiene</option>
                    <option value="bar">🍷 Bar</option>
                    <option value="kitchen">🔧 Kitchen Supplies</option>
                    <option value="others">📁 Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Unit</label>
                  <select
                    value={isAddCustomUnit ? "custom" : addMaterialForm.unit}
                    onChange={e => {
                      if (e.target.value === "custom") {
                        setIsAddCustomUnit(true);
                        setAddMaterialForm(prev => ({ ...prev, unit: "" }));
                      } else {
                        setIsAddCustomUnit(false);
                        setAddMaterialForm(prev => ({ ...prev, unit: e.target.value }));
                      }
                    }}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g (grams)</option>
                    <option value="Ltr.">Ltr. (Litres)</option>
                    <option value="ml">ml</option>
                    <option value="Btls">Btls (Bottles)</option>
                    <option value="Dish">Dish</option>
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Dozen">Dozen</option>
                    <option value="Bag">Bag</option>
                    <option value="Box">Box</option>
                    <option value="Roll">Roll</option>
                    <option value="Pack">Pack</option>
                    <option value="custom">✍️ Custom Unit...</option>
                  </select>
                  {isAddCustomUnit && (
                    <div className="mt-2 animate-fade-in">
                      <input
                        type="text"
                        required
                        placeholder="Type custom unit..."
                        value={addMaterialForm.unit}
                        onChange={e => setAddMaterialForm(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Opening Stock</label>
                  <input type="number" min="0" placeholder="0" value={addMaterialForm.openingStock || ''}
                    onChange={e => setAddMaterialForm(prev => ({ ...prev, openingStock: Number(e.target.value) }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Current Stock</label>
                  <input type="number" min="0" placeholder="0" value={addMaterialForm.currentStock || ''}
                    onChange={e => setAddMaterialForm(prev => ({ ...prev, currentStock: Number(e.target.value) }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Cost Price (₹ per unit)</label>
                  <input type="number" min="0" placeholder="0" value={addMaterialForm.costPrice || ''}
                    onChange={e => setAddMaterialForm(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Min Stock Alert</label>
                  <input type="number" min="0" placeholder="e.g. 5" value={addMaterialForm.minStockAlert || ''}
                    onChange={e => setAddMaterialForm(prev => ({ ...prev, minStockAlert: Number(e.target.value) }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375]">Supplier</label>
                    {!isAddingAddMaterialSupplier ? (
                      <button
                        type="button"
                        onClick={() => setIsAddingAddMaterialSupplier(true)}
                        className="text-[10px] font-bold text-[#B88A52] hover:text-[#C99E65] transition-colors"
                      >
                        + Add New
                      </button>
                    ) : null}
                  </div>
                  {!isAddingAddMaterialSupplier ? (
                    <select value={addMaterialForm.supplier}
                      onChange={e => setAddMaterialForm(prev => ({ ...prev, supplier: e.target.value }))}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer">
                      <option value="">Select supplier…</option>
                      {suppliers.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newAddMaterialSupplierName}
                        onChange={(e) => setNewAddMaterialSupplierName(e.target.value)}
                        placeholder="Supplier name"
                        className="flex-1 text-xs font-semibold px-2 py-1.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newAddMaterialSupplierName.trim()) {
                            const name = newAddMaterialSupplierName.trim();
                            if (!suppliers.some(s => s.name.toLowerCase() === name.toLowerCase())) {
                              setSuppliers(prev => [...prev, { name }]);
                            }
                            setAddMaterialForm(prev => ({ ...prev, supplier: name }));
                            setNewAddMaterialSupplierName('');
                            setIsAddingAddMaterialSupplier(false);
                          }
                        }}
                        className="px-2 py-1.5 bg-[#B88A52] hover:bg-[#C99E65] text-white text-[10px] font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAddMaterialSupplier(false);
                          setNewAddMaterialSupplierName('');
                        }}
                        className="px-2 py-1.5 border border-[#E6E1DA] text-[#5A5348] text-[10px] font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375]">Storage Location</label>
                    {!isAddingAddMaterialStorage ? (
                      <button
                        type="button"
                        onClick={() => setIsAddingAddMaterialStorage(true)}
                        className="text-[10px] font-bold text-[#B88A52] hover:text-[#C99E65] transition-colors"
                      >
                        + Add New
                      </button>
                    ) : null}
                  </div>
                  {!isAddingAddMaterialStorage ? (
                    <select value={addMaterialForm.storageLocation}
                      onChange={e => setAddMaterialForm(prev => ({ ...prev, storageLocation: e.target.value }))}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer">
                      <option value="">Select location…</option>
                      {storageSections.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newAddMaterialStorageName}
                        onChange={(e) => setNewAddMaterialStorageName(e.target.value)}
                        placeholder="Storage name"
                        className="flex-1 text-xs font-semibold px-2 py-1.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newAddMaterialStorageName.trim()) {
                            const name = newAddMaterialStorageName.trim();
                            if (!storageSections.includes(name)) {
                              setStorageSections(prev => [...prev, name]);
                            }
                            setAddMaterialForm(prev => ({ ...prev, storageLocation: name }));
                            setNewAddMaterialStorageName('');
                            setIsAddingAddMaterialStorage(false);
                          }
                        }}
                        className="px-2 py-1.5 bg-[#B88A52] hover:bg-[#C99E65] text-white text-[10px] font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAddMaterialStorage(false);
                          setNewAddMaterialStorageName('');
                        }}
                        className="px-2 py-1.5 border border-[#E6E1DA] text-[#5A5348] text-[10px] font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Mfg. Date <span className="normal-case font-normal">(optional)</span></label>
                  <input type="date" value={(addMaterialForm as any).mfgDate || ''}
                    onChange={e => setAddMaterialForm(prev => ({ ...prev, mfgDate: e.target.value } as any))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] transition-all cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1.5">Expiry Date <span className="normal-case font-normal">(optional)</span></label>
                  <input type="date" value={addMaterialForm.expiryDate}
                    onChange={e => setAddMaterialForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] transition-all cursor-pointer" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0ECE6]">
                <button type="button" onClick={() => setIsAddMaterialOpen(false)}
                  className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-[#B88A52]/20 cursor-pointer flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-semibold text-[#8C8375]">Loading Inventory...</div>}>
      <InventoryPageContent />
    </Suspense>
  );
}
