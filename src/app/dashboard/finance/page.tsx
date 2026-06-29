'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, FileText, 
  ArrowUpRight, ArrowDownRight, Users, Trash2, Package, Landmark, 
  Coins, Download, RefreshCw, Layers, ChevronRight, ChevronDown, 
  Plus, Pencil, X, Home, Zap, Wrench, Megaphone, MoreHorizontal, Sparkles
} from 'lucide-react';
import { formatCurrency, cn, getLocalDateString } from '@/lib/utils';
import { loadDemoOrders, demoRestaurant, demoMenuItems } from '@/lib/demo-data';
import { Order, OrderItem } from '@/lib/types';
import { jsPDF } from 'jspdf';

// Interfaces matching database structures
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
  deliveredQty?: number;
  purchasePrice?: number;
}

interface StaffMember {
  id: string;
  name: string;
  role: 'chef' | 'waiter' | 'manager' | 'cashier' | 'cleaner' | 'others';
  hourlyRate: number; // monthly base salary
}

interface PayrollRecord {
  monthKey: string;
  staffId: string;
  bonus: number;
  deductions: number;
  status: 'Paid' | 'Pending' | 'On Hold';
}

interface OperatingExpense {
  id: string;
  category: 'rent' | 'utilities' | 'maintenance' | 'marketing' | 'other';
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
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

interface RawMaterial {
  id: string;
  name: string;
  costPrice?: number;
}

export default function FinancePage() {
  const [activeRange, setActiveRange] = useState<'7days' | '30days' | '6months'>('30days');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'expenses' | 'menu_performance'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Modal forms
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OperatingExpense | null>(null);
  const [expenseForm, setExpenseForm] = useState<{
    id?: string;
    category: OperatingExpense['category'];
    amount: number;
    date: string;
    description: string;
  }>({
    category: 'utilities',
    amount: 0,
    date: getLocalDateString(),
    description: ''
  });

  // Sorting for Menu Performance
  const [menuSortField, setMenuSortField] = useState<'units' | 'revenue' | 'margin'>('revenue');
  const [menuSortOrder, setMenuSortOrder] = useState<'asc' | 'desc'>('desc');

  // Core persistence states loaded from localStorage
  const [restaurantName, setRestaurantName] = useState('The Golden Plate');
  const [isFresh, setIsFresh] = useState(false);
  const [cgstRate, setCgstRate] = useState(2.5);
  const [sgstRate, setSgstRate] = useState(2.5);
  const [serviceChargeRate, setServiceChargeRate] = useState(0);

  const [orders, setOrders] = useState<Order[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [wastageData, setWastageData] = useState<WastageItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [payrollList, setPayrollList] = useState<PayrollRecord[]>([]);
  const [operatingExpenses, setOperatingExpenses] = useState<OperatingExpense[]>([]);
  
  // Recipes and inventory loaded to compute dish portion cost dynamically
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  // Load persistence states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fresh = localStorage.getItem('qrestro_demo_fresh_signup') === 'true';
      setIsFresh(fresh);

      // Restaurant Details
      const savedRestaurant = localStorage.getItem('qrestro_demo_restaurant');
      if (savedRestaurant) {
        try {
          const parsed = JSON.parse(savedRestaurant);
          if (parsed.name) setRestaurantName(parsed.name);
          if (parsed.cgst_rate !== undefined) setCgstRate(Number(parsed.cgst_rate));
          if (parsed.sgst_rate !== undefined) setSgstRate(Number(parsed.sgst_rate));
          if (parsed.service_charge_rate !== undefined) setSgstRate(Number(parsed.service_charge_rate));
        } catch {}
      }

      // Orders (Unified Key 'qrestro_demo_orders')
      if (fresh) {
        setOrders([]);
      } else {
        setOrders(loadDemoOrders());
      }

      // Purchase Orders
      const storedPOs = localStorage.getItem('qrestro_purchase_orders');
      if (storedPOs) {
        try { setPurchaseOrders(JSON.parse(storedPOs)); } catch {}
      } else {
        const defaultPOs: PurchaseOrder[] = fresh ? [] : [
          { id: 'po-1', itemName: 'Chicken (Boneless)', quantity: 30, unit: 'kg', orderDate: '2026-05-25', supplier: 'Prime Meats Ltd', status: 'completed', totalCost: 8400, purchasePrice: 280 },
          { id: 'po-2', itemName: 'Paneer', quantity: 20, unit: 'kg', orderDate: '2026-05-26', supplier: 'Dairyland Foods', status: 'completed', totalCost: 7000, purchasePrice: 350 },
          { id: 'po-3', itemName: 'Milk', quantity: 50, unit: 'Ltr.', orderDate: '2026-05-28', supplier: 'Dairyland Foods', status: 'completed', totalCost: 2750, purchasePrice: 55 },
          { id: 'po-4', itemName: 'Tomato', quantity: 15, unit: 'kg', orderDate: '2026-05-29', supplier: 'Fresh Farm Pvt Ltd', status: 'completed', totalCost: 600, purchasePrice: 40 },
          { id: 'po-5', itemName: 'Onion', quantity: 40, unit: 'kg', orderDate: '2026-05-30', supplier: 'Fresh Farm Pvt Ltd', status: 'completed', totalCost: 1000, purchasePrice: 25 },
        ];
        setPurchaseOrders(defaultPOs);
        localStorage.setItem('qrestro_purchase_orders', JSON.stringify(defaultPOs));
      }

      // Wastage Data
      const storedWastage = localStorage.getItem('qrestro_wastage_data');
      if (storedWastage) {
        try { setWastageData(JSON.parse(storedWastage)); } catch {}
      } else {
        const defaultWastage: WastageItem[] = fresh ? [] : [
          { id: 'w-1', name: 'Tomato', date: '2026-05-26', quantity: 3, unit: 'kg', reason: 'Spoilage', cost: 120 },
          { id: 'w-2', name: 'Milk', date: '2026-05-27', quantity: 5, unit: 'Ltr.', reason: 'Expired', cost: 275 },
          { id: 'w-3', name: 'Lettuce', date: '2026-05-28', quantity: 2, unit: 'kg', reason: 'Spoilage', cost: 300 },
        ];
        setWastageData(defaultWastage);
        localStorage.setItem('qrestro_wastage_data', JSON.stringify(defaultWastage));
      }

      // Staff Salaries
      const storedStaff = localStorage.getItem('qrestro_staff_list') || localStorage.getItem('qrestro_staff');
      if (storedStaff) {
        try { setStaffList(JSON.parse(storedStaff)); } catch {}
      } else {
        const defaultStaff: StaffMember[] = fresh ? [] : [
          { id: 'emp-1', name: 'Ramesh Kumar', role: 'chef', hourlyRate: 35000 },
          { id: 'emp-2', name: 'Jenny Doe', role: 'waiter', hourlyRate: 20000 },
          { id: 'emp-3', name: 'Vicky Singh', role: 'manager', hourlyRate: 50000 },
          { id: 'emp-4', name: 'Priya Patel', role: 'cashier', hourlyRate: 22000 },
          { id: 'emp-5', name: 'David Smith', role: 'waiter', hourlyRate: 19000 },
          { id: 'emp-6', name: 'Rahul Verma', role: 'chef', hourlyRate: 33000 },
          { id: 'emp-7', name: 'Sneha Reddy', role: 'waiter', hourlyRate: 21000 }
        ];
        setStaffList(defaultStaff);
        localStorage.setItem('qrestro_staff_list', JSON.stringify(defaultStaff));
      }

      // Payroll Records
      const storedPayroll = localStorage.getItem('qrestro_payroll');
      if (storedPayroll) {
        try { setPayrollList(JSON.parse(storedPayroll)); } catch {}
      } else {
        const defaultPayroll: PayrollRecord[] = fresh ? [] : [
          { monthKey: '2026-05', staffId: 'emp-1', bonus: 2000, deductions: 500, status: 'Paid' },
          { monthKey: '2026-05', staffId: 'emp-2', bonus: 1000, deductions: 0, status: 'Paid' },
          { monthKey: '2026-05', staffId: 'emp-3', bonus: 3000, deductions: 1000, status: 'Paid' },
          { monthKey: '2026-05', staffId: 'emp-4', bonus: 1500, deductions: 500, status: 'Paid' },
          { monthKey: '2026-05', staffId: 'emp-5', bonus: 500, deductions: 0, status: 'Paid' },
          { monthKey: '2026-05', staffId: 'emp-6', bonus: 0, deductions: 1500, status: 'Paid' },
          { monthKey: '2026-05', staffId: 'emp-7', bonus: 1200, deductions: 0, status: 'Paid' },
        ];
        setPayrollList(defaultPayroll);
        localStorage.setItem('qrestro_payroll', JSON.stringify(defaultPayroll));
      }

      // Operating Expenses (Rent, Utilities, Maintenance, Marketing, Other)
      const storedExpenses = localStorage.getItem('qrestro_operating_expenses');
      if (storedExpenses) {
        try { setOperatingExpenses(JSON.parse(storedExpenses)); } catch {}
      } else {
        const defaultExpenses: OperatingExpense[] = fresh ? [] : [
          { id: 'oe-1', category: 'rent', amount: 45000, date: '2026-05-01', description: 'Monthly commercial restaurant shop rent' },
          { id: 'oe-2', category: 'utilities', amount: 12500, date: '2026-05-05', description: 'Commercial kitchen electricity charges' },
          { id: 'oe-3', category: 'utilities', amount: 2500, date: '2026-05-06', description: 'High-speed internet & water bills' },
          { id: 'oe-4', category: 'maintenance', amount: 6800, date: '2026-05-12', description: 'Tandoor clay repairs & chimney duct cleaning' },
          { id: 'oe-5', category: 'marketing', amount: 8000, date: '2026-05-18', description: 'Social media ads & flyers distribution' },
        ];
        setOperatingExpenses(defaultExpenses);
        localStorage.setItem('qrestro_operating_expenses', JSON.stringify(defaultExpenses));
      }

      // Load Recipes & Raw Materials
      const storedRecipes = localStorage.getItem('qrestro_recipes');
      if (storedRecipes) {
        try { setRecipes(JSON.parse(storedRecipes)); } catch {}
      }
      
      const storedMaterials = localStorage.getItem('qrestro_raw_materials');
      if (storedMaterials) {
        try { setRawMaterials(JSON.parse(storedMaterials)); } catch {}
      }
    }
  }, []);

  // Sync operating expenses to localStorage
  useEffect(() => {
    if (operatingExpenses.length > 0) {
      localStorage.setItem('qrestro_operating_expenses', JSON.stringify(operatingExpenses));
    }
  }, [operatingExpenses]);

  // Sync orders if updated
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('qrestro_demo_orders', JSON.stringify(orders));
    }
  }, [orders]);

  const handleRefreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const storedOrders = localStorage.getItem('qrestro_demo_orders');
        if (storedOrders) setOrders(JSON.parse(storedOrders));
        const storedPOs = localStorage.getItem('qrestro_purchase_orders');
        if (storedPOs) setPurchaseOrders(JSON.parse(storedPOs));
        const storedWastage = localStorage.getItem('qrestro_wastage_data');
        if (storedWastage) setWastageData(JSON.parse(storedWastage));
        const storedStaff = localStorage.getItem('qrestro_staff_list');
        if (storedStaff) setStaffList(JSON.parse(storedStaff));
        const storedPayroll = localStorage.getItem('qrestro_payroll');
        if (storedPayroll) setPayrollList(JSON.parse(storedPayroll));
        const storedExpenses = localStorage.getItem('qrestro_operating_expenses');
        if (storedExpenses) setOperatingExpenses(JSON.parse(storedExpenses));
        const storedRecipes = localStorage.getItem('qrestro_recipes');
        if (storedRecipes) setRecipes(JSON.parse(storedRecipes));
        const storedMaterials = localStorage.getItem('qrestro_raw_materials');
        if (storedMaterials) setRawMaterials(JSON.parse(storedMaterials));
      }
      setIsLoading(false);
    }, 600);
  };

  // Save/Edit Expense Form
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.amount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    if (expenseForm.id) {
      // Edit mode
      setOperatingExpenses(prev => prev.map(oe => oe.id === expenseForm.id ? {
        id: oe.id,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        description: expenseForm.description || 'Operating Expense claim'
      } : oe));
    } else {
      // Add mode
      const newExpense: OperatingExpense = {
        id: `oe-${Date.now()}`,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        description: expenseForm.description || 'Operating Expense claim'
      };
      setOperatingExpenses(prev => [newExpense, ...prev]);
    }

    setIsExpenseModalOpen(false);
    setEditingExpense(null);
    setExpenseForm({
      category: 'utilities',
      amount: 0,
      date: getLocalDateString(),
      description: ''
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      setOperatingExpenses(prev => prev.filter(oe => oe.id !== expenseId));
    }
  };

  // 3. Financial Computations
  const financialSummary = useMemo(() => {
    // 3.1 Calculate Revenue
    const servedOrders = orders.filter(o => o.status === 'served');
    let netSales = servedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Scaling fallbacks for empty demo setups
    if (netSales === 0 && !isFresh) {
      netSales = 224500;
    } else if (activeRange === '6months') {
      netSales *= 5.6;
    } else if (activeRange === '7days') {
      netSales *= 0.32;
    }

    const taxFactor = (cgstRate + sgstRate) / 100;
    const taxesCollected = netSales * taxFactor;
    const serviceChargeCollected = netSales * (serviceChargeRate / 100);
    const grossRevenue = netSales + taxesCollected + serviceChargeCollected;

    // 3.2 COGS
    const wastageLoss = wastageData.reduce((sum, w) => sum + w.cost, 0);
    const ingredientCostVal = netSales * 0.28; // standard target cost
    const totalCOGS = ingredientCostVal + wastageLoss;

    // 3.3 Operating Expenses (OpEx)
    // Payroll costs
    let payrollExpense = staffList.reduce((sum, emp) => sum + emp.hourlyRate, 0);
    if (payrollExpense === 0 && !isFresh) payrollExpense = 200000;
    const totalBonuses = payrollList.reduce((sum, r) => sum + (r.monthKey === '2026-05' ? r.bonus : 0), 0);
    const totalDeductions = payrollList.reduce((sum, r) => sum + (r.monthKey === '2026-05' ? r.deductions : 0), 0);
    payrollExpense += (totalBonuses - totalDeductions);

    // Completed Purchase Orders Cost
    const purchaseCost = purchaseOrders
      .filter(po => po.status === 'completed')
      .reduce((sum, po) => sum + (po.totalCost || 0), 0);

    // Logged expenses (Rent, Utilities, Maintenance, Marketing, Other)
    const rentExpenses = operatingExpenses.filter(oe => oe.category === 'rent').reduce((sum, oe) => sum + oe.amount, 0);
    const utilitiesExpenses = operatingExpenses.filter(oe => oe.category === 'utilities').reduce((sum, oe) => sum + oe.amount, 0);
    const maintenanceExpenses = operatingExpenses.filter(oe => oe.category === 'maintenance').reduce((sum, oe) => sum + oe.amount, 0);
    const marketingExpenses = operatingExpenses.filter(oe => oe.category === 'marketing').reduce((sum, oe) => sum + oe.amount, 0);
    const otherExpenses = operatingExpenses.filter(oe => oe.category === 'other').reduce((sum, oe) => sum + oe.amount, 0);

    let loggedOverheadsTotal = rentExpenses + utilitiesExpenses + maintenanceExpenses + marketingExpenses + otherExpenses;
    if (loggedOverheadsTotal === 0 && !isFresh) {
      loggedOverheadsTotal = 74800; // default overheads if empty
    }

    // Scale overheads for charts
    let scaledOverheads = loggedOverheadsTotal;
    if (activeRange === '6months') {
      scaledOverheads *= 6;
    } else if (activeRange === '7days') {
      scaledOverheads *= 0.23;
    }

    const opexTotal = payrollExpense + scaledOverheads + purchaseCost;
    const totalCosts = totalCOGS + opexTotal;
    const netProfit = grossRevenue - totalCosts;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return {
      netSales,
      taxesCollected,
      serviceChargeCollected,
      grossRevenue,
      wastageLoss,
      ingredientCost: ingredientCostVal,
      totalCOGS,
      payrollExpense,
      purchaseCost,
      overheads: scaledOverheads,
      opexTotal,
      totalCosts,
      netProfit,
      profitMargin,
      breakdown: {
        rent: rentExpenses,
        utilities: utilitiesExpenses,
        maintenance: maintenanceExpenses,
        marketing: marketingExpenses,
        other: otherExpenses,
        total: loggedOverheadsTotal
      }
    };
  }, [orders, purchaseOrders, wastageData, staffList, payrollList, operatingExpenses, cgstRate, sgstRate, serviceChargeRate, activeRange]);

  // 4. Menu Item Performance Calculations
  const menuPerformanceList = useMemo(() => {
    const servedOrders = orders.filter(o => o.status === 'served');

    const list = demoMenuItems.map(item => {
      // Units sold
      let unitsSold = servedOrders.reduce((sum, o) => {
        const matched = o.order_items?.filter(oi => oi.name === item.name || oi.menu_item_id === item.id) || [];
        return sum + matched.reduce((qtySum, oi) => qtySum + oi.quantity, 0);
      }, 0);

      // Add default sales seeding for demonstration if empty
      if (unitsSold === 0 && !isFresh) {
        const seedId = Number(item.id.replace('item-', '')) || 1;
        unitsSold = (seedId * 7 + 13) % 24; // realistic mock units
      }

      // Cost price calculation from recipe ingredients
      const recipe = recipes.find(r => r.menuItemName === item.name);
      let portionCost = 0;

      if (recipe && recipe.ingredients.length > 0) {
        portionCost = recipe.ingredients.reduce((sum, ing) => {
          const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
          return sum + (ing.quantity * (material?.costPrice || 25));
        }, 0);
      } else {
        // Fallback portion cost estimation (32% average ingredient cost)
        portionCost = item.price * 0.32;
      }

      const portionProfit = item.price - portionCost;
      const margin = item.price > 0 ? (portionProfit / item.price) * 100 : 0;
      const totalRevenue = unitsSold * item.price;
      const totalCostOfSales = unitsSold * portionCost;
      const totalNetProfit = unitsSold * portionProfit;

      // Classify Popularity & Profitability Tiers
      const isPopular = unitsSold >= 12; // units sold threshold
      const isHighMargin = margin >= 68; // margin percentage threshold
      
      let tier: 'Star' | 'Cash Cow' | 'Question Mark' | 'Underperformer' = 'Underperformer';
      if (isPopular && isHighMargin) tier = 'Star';
      else if (isPopular && !isHighMargin) tier = 'Cash Cow';
      else if (!isPopular && isHighMargin) tier = 'Question Mark';

      return {
        ...item,
        unitsSold,
        portionCost,
        portionProfit,
        margin,
        totalRevenue,
        totalCostOfSales,
        totalNetProfit,
        tier
      };
    });

    // Sorting logic
    return list.sort((a, b) => {
      let comparison = 0;
      if (menuSortField === 'units') {
        comparison = a.unitsSold - b.unitsSold;
      } else if (menuSortField === 'revenue') {
        comparison = a.totalRevenue - b.totalRevenue;
      } else if (menuSortField === 'margin') {
        comparison = a.margin - b.margin;
      }

      return menuSortOrder === 'desc' ? -comparison : comparison;
    });

  }, [orders, recipes, rawMaterials, menuSortField, menuSortOrder]);

  // SVG Performance charts data
  const monthlyPerformanceData = useMemo(() => {
    const baseRev = financialSummary.grossRevenue;
    const baseExp = financialSummary.totalCosts;

    return [
      { month: 'Dec 2025', revenue: baseRev * 0.85, expenses: baseExp * 0.83 },
      { month: 'Jan 2026', revenue: baseRev * 0.92, expenses: baseExp * 0.90 },
      { month: 'Feb 2026', revenue: baseRev * 0.88, expenses: baseExp * 0.87 },
      { month: 'Mar 2026', revenue: baseRev * 0.96, expenses: baseExp * 0.92 },
      { month: 'Apr 2026', revenue: baseRev * 1.04, expenses: baseExp * 0.98 },
      { month: 'May 2026', revenue: baseRev, expenses: baseExp }
    ];
  }, [financialSummary]);

  // Combined transactions for general audit feed
  const unifiedTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'revenue' | 'purchase' | 'wastage' | 'payroll' | 'expense';
      title: string;
      subtitle: string;
      amount: number;
      date: string;
      status: string;
    }> = [];

    // Guest bill revenues
    orders.filter(o => o.status === 'served').forEach(o => {
      list.push({
        id: o.id,
        type: 'revenue',
        title: `Guest payment: Order #${o.order_number}`,
        subtitle: `Table ${o.session_id ? o.session_id.substring(0,4) : '?' } • UPI/Card`,
        amount: o.total_amount,
        date: o.created_at ? getLocalDateString(new Date(o.created_at)) : '2026-05-27',
        status: 'received'
      });
    });

    // Supplier restocking bills
    purchaseOrders.forEach(po => {
      list.push({
        id: po.id,
        type: 'purchase',
        title: `Restock item: ${po.itemName}`,
        subtitle: `Supplier: ${po.supplier}`,
        amount: po.totalCost,
        date: po.orderDate,
        status: po.status
      });
    });

    // Spoilage losses
    wastageData.forEach(w => {
      list.push({
        id: w.id,
        type: 'wastage',
        title: `Wastage claim: ${w.name}`,
        subtitle: `Category: ${w.reason}`,
        amount: w.cost,
        date: w.date,
        status: 'loss'
      });
    });

    // Payroll disbursements
    staffList.forEach(emp => {
      const rec = payrollList.find(p => p.staffId === emp.id && p.monthKey === '2026-05');
      const bonus = rec?.bonus || 0;
      const deduction = rec?.deductions || 0;
      const netPay = emp.hourlyRate + bonus - deduction;

      list.push({
        id: `pay-${emp.id}`,
        type: 'payroll',
        title: `Salary payout: ${emp.name}`,
        subtitle: `Designation: ${emp.role}`,
        amount: netPay,
        date: '2026-05-30',
        status: rec?.status === 'Paid' ? 'completed' : 'pending'
      });
    });

    // Custom logged overhead operating expenses
    operatingExpenses.forEach(oe => {
      list.push({
        id: oe.id,
        type: 'expense',
        title: `OPEX: ${oe.description}`,
        subtitle: `Category: ${oe.category.toUpperCase()}`,
        amount: oe.amount,
        date: oe.date,
        status: 'completed'
      });
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, purchaseOrders, wastageData, staffList, payrollList, operatingExpenses]);


  // 6. jsPDF statement generator
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const PW = 297;
      const generatedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      // ── 1. HEADER BANNER ──
      doc.setFillColor(44, 38, 31);
      doc.rect(0, 0, PW, 30, 'F');
      
      // Gold stripe
      doc.setFillColor(184, 138, 82);
      doc.rect(0, 30, PW, 2.5, 'F');
      
      // Title text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(restaurantName.toUpperCase(), 14, 13);
      
      // Subtitle
      doc.setFontSize(9);
      doc.setTextColor(184, 138, 82);
      doc.text('FINANCIAL REPORT & P&L SHEET', 14, 22);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(180, 165, 140);
      doc.text('Report Date: ' + generatedDate, PW - 14, 13, { align: 'right' });
      doc.text('Reporting Range: Last 30 Days (May 2026)', PW - 14, 22, { align: 'right' });

      // ── 2. KPI SUMMARY CARDS ──
      const cards = [
        { label: 'GROSS REVENUE', value: 'Rs.' + Math.round(financialSummary.grossRevenue).toLocaleString('en-IN'), sub: 'Sales + Taxes + Charges' },
        { label: 'COST OF GOODS SOLD', value: 'Rs.' + Math.round(financialSummary.totalCOGS).toLocaleString('en-IN'), sub: 'Ingredients + wastage costs' },
        { label: 'OPERATING EXPENSES (OpEx)', value: 'Rs.' + Math.round(financialSummary.opexTotal).toLocaleString('en-IN'), sub: 'Payroll + POs + Logged Overheads' },
        { label: 'NET PROFIT & MARGIN', value: 'Rs.' + Math.round(financialSummary.netProfit).toLocaleString('en-IN') + ' (' + financialSummary.profitMargin.toFixed(1) + '%)', sub: 'Calculated margins' },
      ];
      
      const cardW = (PW - 28 - 9) / 4;
      let cardX = 14;
      const cardY = 38;
      
      cards.forEach((card) => {
        doc.setFillColor(250, 247, 242);
        doc.setDrawColor(220, 215, 208);
        doc.roundedRect(cardX, cardY, cardW, 20, 2, 2, 'FD');
        doc.setFillColor(184, 138, 82);
        doc.rect(cardX, cardY, 2.5, 20, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(130, 118, 106);
        doc.text(card.label, cardX + 5, cardY + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(44, 38, 31);
        doc.text(card.value, cardX + 5, cardY + 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(150, 140, 125);
        doc.text(card.sub, cardX + 5, cardY + 18);
        cardX += cardW + 3;
      });

      // ── 3. INCOME STATEMENT SHEET ──
      let y = 65;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(184, 138, 82);
      doc.text('INCOME STATEMENT (P&L BREAKDOWN)', 14, y);
      doc.line(14, y + 1.5, 90, y + 1.5);
      y += 6;

      const pnlData = [
        { label: 'OPERATING REVENUES', val: '' },
        { label: '  • Food & Beverage Sales (Net Billing)', val: 'Rs.' + Math.round(financialSummary.netSales).toLocaleString('en-IN') },
        { label: '  • Taxes Collected (CGST + SGST)', val: 'Rs.' + Math.round(financialSummary.taxesCollected).toLocaleString('en-IN') },
        { label: '  • Service Charges Collected', val: 'Rs.' + Math.round(financialSummary.serviceChargeCollected).toLocaleString('en-IN') },
        { label: 'TOTAL GROSS REVENUE (A)', val: 'Rs.' + Math.round(financialSummary.grossRevenue).toLocaleString('en-IN'), highlight: true },
        
        { label: 'COST OF GOODS SOLD (COGS)', val: '' },
        { label: '  • Raw Ingredients Consumption Cost (Est. 28%)', val: 'Rs.' + Math.round(financialSummary.ingredientCost).toLocaleString('en-IN') },
        { label: '  • Logged Stock Spoilage & Wastage Losses', val: 'Rs.' + Math.round(financialSummary.wastageLoss).toLocaleString('en-IN') },
        { label: 'TOTAL COST OF GOODS SOLD (B)', val: 'Rs.' + Math.round(financialSummary.totalCOGS).toLocaleString('en-IN'), highlight: true },
        
        { label: 'OPERATING EXPENSES (OpEx)', val: '' },
        { label: '  • Staff Salaries & Payroll', val: 'Rs.' + Math.round(financialSummary.payrollExpense).toLocaleString('en-IN') },
        { label: '  • Completed Supplier PO Purchases', val: 'Rs.' + Math.round(financialSummary.purchaseCost).toLocaleString('en-IN') },
        { label: '  • Custom Logged Overheads (Rent, Utilities, Maintenance, Marketing)', val: 'Rs.' + Math.round(financialSummary.overheads).toLocaleString('en-IN') },
        { label: 'TOTAL OPERATING EXPENSES (C)', val: 'Rs.' + Math.round(financialSummary.opexTotal).toLocaleString('en-IN'), highlight: true },
        
        { label: 'NET PROFIT & MARGIN STATEMENT', val: '' },
        { label: '  • Gross Operating Earnings (A - B)', val: 'Rs.' + Math.round(financialSummary.grossRevenue - financialSummary.totalCOGS).toLocaleString('en-IN') },
        { label: '  • Net Business Profit (A - B - C)', val: 'Rs.' + Math.round(financialSummary.netProfit).toLocaleString('en-IN'), highlight: true, gold: true }
      ];

      doc.setFontSize(7.5);
      pnlData.forEach((row) => {
        if (row.val === '') {
          doc.setFillColor(235, 230, 222);
          doc.rect(14, y, PW - 28, 6.5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(44, 38, 31);
          doc.text(row.label, 16, y + 4.5);
        } else if (row.highlight) {
          doc.setFillColor(row.gold ? 245 : 44, row.gold ? 238 : 38, row.gold ? 225 : 31);
          doc.rect(14, y, PW - 28, 7.5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(row.gold ? 184 : 255, row.gold ? 138 : 255, row.gold ? 82 : 255);
          doc.text(row.label, 16, y + 5.2);
          doc.text(row.val, PW - 18, y + 5.2, { align: 'right' });
          y += 1;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 75, 68);
          doc.text(row.label, 16, y + 4.5);
          doc.text(row.val, PW - 18, y + 4.5, { align: 'right' });
          doc.setDrawColor(230, 225, 218);
          doc.setLineWidth(0.2);
          doc.line(14, y + 6.5, PW - 14, y + 6.5);
        }
        y += 6.5;
      });

      // Footer Banner
      doc.setFillColor(44, 38, 31);
      doc.rect(0, 203, PW, 8, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 165, 140);
      doc.text(restaurantName + '  |  Confidential Business Performance Report  |  Live Ledger Synchronization', PW / 2, 208, { align: 'center' });

      doc.save('Restaurant_PL_Financial_Statement.pdf');
    } catch (e) {
      console.error('PDF generation error', e);
      alert('PDF statement export failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#2C261F] flex items-center gap-2">
            <Landmark className="w-8 h-8 text-[#B88A52]" />
            <span>Finance & Business Analytics</span>
          </h1>
          <p className="text-[#8C8375] text-sm mt-1">Audit guest billing revenues, log custom operating expenses, track menu profitability margins and export reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-white border border-[#E6E1DA] rounded-xl p-1 shadow-sm">
            {[
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: '6months', label: '6 Months' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setActiveRange(range.id as any)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                  activeRange === range.id 
                    ? "bg-[#B88A52] text-white shadow-sm"
                    : "text-[#5A5348] hover:bg-[#FAF7F2]"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefreshData}
            className="p-2.5 bg-white hover:bg-[#FAF7F2] border border-[#E6E1DA] hover:border-[#B88A52]/25 rounded-xl transition-all cursor-pointer shadow-sm text-[#5A5348]"
            title="Reload Data"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-[#B88A52]/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export P&L Report</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        <div className="bg-white border border-[#E6E1DA] rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-28 h-auto hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-[#8C8375] tracking-wider">Gross Revenue</span>
            <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-[#2C261F] mt-1.5 flex items-baseline gap-1.5">
              <span>₹{Math.round(financialSummary.grossRevenue).toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.4%
              </span>
            </h3>
            <p className="text-[10px] font-medium text-[#8C8375] mt-1">Includes CGST/SGST & service charges</p>
          </div>
        </div>

        <div className="bg-white border border-[#E6E1DA] rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-28 h-auto hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-[#8C8375] tracking-wider">Cost of Goods Sold (COGS)</span>
            <div className="w-7 h-7 bg-[#FAF4EB] text-[#B88A52] rounded-lg flex items-center justify-center border border-[#FAF0E2]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-[#2C261F] mt-1.5 flex items-baseline gap-1.5">
              <span>₹{Math.round(financialSummary.totalCOGS).toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-[#B88A52] font-semibold">
                ~{(financialSummary.totalCOGS / (financialSummary.grossRevenue || 1) * 100).toFixed(0)}%
              </span>
            </h3>
            <p className="text-[10px] font-medium text-[#8C8375] mt-1">Ingredients (₹{Math.round(financialSummary.ingredientCost).toLocaleString('en-IN')}) + Spoilage (₹{Math.round(financialSummary.wastageLoss).toLocaleString('en-IN')})</p>
          </div>
        </div>

        <div className="bg-white border border-[#E6E1DA] rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-28 h-auto hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-[#8C8375] tracking-wider">Operating Expenses (OpEx)</span>
            <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-[#2C261F] mt-1.5 flex items-baseline gap-1.5">
              <span>₹{Math.round(financialSummary.opexTotal).toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" /> +4.2%
              </span>
            </h3>
            <p className="text-[10px] font-medium text-[#8C8375] mt-1">Salaries + Purchases + Overheads (₹{Math.round(financialSummary.overheads).toLocaleString('en-IN')})</p>
          </div>
        </div>

        <div className="bg-white border border-[#E6E1DA] rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-28 h-auto hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-[10px] uppercase font-bold text-[#8C8375] tracking-wider">Net profit margin</span>
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center border",
              financialSummary.netProfit >= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
            )}>
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-[#2C261F] mt-1.5 flex items-baseline gap-2">
              <span className={cn(financialSummary.netProfit < 0 && "text-rose-600")}>
                ₹{Math.round(financialSummary.netProfit).toLocaleString('en-IN')}
              </span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                financialSummary.netProfit >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              )}>
                {financialSummary.profitMargin.toFixed(1)}% margin
              </span>
            </h3>
            <p className="text-[10px] font-medium text-[#8C8375] mt-1">Net profit targets: &gt; 15%</p>
          </div>
        </div>
      </div>

      {/* SUB-TAB BAR */}
      <div className="flex items-center gap-1.5 border-b border-[#E6E1DA] pb-px">
        {[
          { id: 'overview', label: 'Financial Overview & Charts', icon: Landmark },
          { id: 'expenses', label: 'Overhead & Expense Management', icon: Coins },
          { id: 'menu_performance', label: 'Menu Profitability & Performance', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                isActive 
                  ? "border-[#B88A52] text-[#B88A52]"
                  : "border-transparent text-[#8C8375] hover:text-[#5A5348] hover:border-[#E6E1DA]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ────────────────── SUB-TAB CONTENTS ────────────────── */}

      {/* 1. OVERVIEW & CHARTS TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Grouped SVG Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-[#E6E1DA] rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#2C261F] flex items-center gap-1.5">
                  <TrendingUp className="w-4.5 h-4.5 text-[#B88A52]" />
                  <span>Monthly Business Performance</span>
                </h3>
                <p className="text-[10px] text-[#8C8375] mt-0.5">Historical comparison of gross monthly revenues vs expenses</p>
              </div>

              <div className="w-full h-64 bg-[#FCFAF7]/50 border border-[#F0ECE6] rounded-xl relative p-4 flex flex-col justify-between">
                <div className="absolute inset-x-0 inset-y-12 flex flex-col justify-between pointer-events-none px-6">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="border-t border-dashed border-[#FAF0E2] w-full" />
                  ))}
                </div>

                <svg viewBox="0 0 540 200" className="w-full h-44 z-10">
                  {monthlyPerformanceData.map((data, idx) => {
                    const maxVal = Math.max(...monthlyPerformanceData.map(d => Math.max(d.revenue, d.expenses)));
                    const scaleY = 150 / (maxVal || 1);
                    
                    const colW = 16;
                    const gap = 44;
                    const startX = 40 + idx * (colW * 2 + gap);
                    const revH = data.revenue * scaleY;
                    const expH = data.expenses * scaleY;

                    return (
                      <g key={idx} className="group">
                        <rect
                          x={startX}
                          y={160 - revH}
                          width={colW}
                          height={revH}
                          rx="3"
                          fill="#B88A52"
                          className="transition-all duration-300 hover:fill-[#C99E65] cursor-pointer"
                        />
                        <rect
                          x={startX + colW + 4}
                          y={160 - expH}
                          width={colW}
                          height={expH}
                          rx="3"
                          fill="#2C261F"
                          className="transition-all duration-300 hover:fill-[#473E35] cursor-pointer"
                        />
                        <text
                          x={startX + colW}
                          y={160 - Math.max(revH, expH) - 10}
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                          fill="#2C261F"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white"
                        >
                          ₹{Math.round(data.revenue/1000)}k / ₹{Math.round(data.expenses/1000)}k
                        </text>
                        <text
                          x={startX + colW}
                          y="180"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#8C8375"
                          textAnchor="middle"
                        >
                          {data.month.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                  <line x1="20" y1="162" x2="520" y2="162" stroke="#E6E1DA" strokeWidth="1.5" />
                </svg>

                <div className="flex items-center gap-4 text-[10px] font-bold text-[#5A5348] border-t border-[#F0ECE6] pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#B88A52] rounded-sm"></span>
                    <span>Gross Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#2C261F] rounded-sm"></span>
                    <span>Total Expenses</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Donut Allocation Split */}
            <div className="bg-white border border-[#E6E1DA] rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#2C261F] flex items-center gap-1.5">
                  <Coins className="w-4.5 h-4.5 text-[#B88A52]" />
                  <span>Cost Allocation</span>
                </h3>
                <p className="text-[10px] text-[#8C8375] mt-0.5">Distribution of expenses across core categories</p>
              </div>

              <div className="h-64 bg-[#FCFAF7]/50 border border-[#F0ECE6] rounded-xl p-4 flex flex-col items-center justify-center gap-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(() => {
                      const items = [
                        { value: financialSummary.payrollExpense, stroke: '#5F8575' }, 
                        { value: financialSummary.ingredientCost + financialSummary.purchaseCost, stroke: '#B88A52' }, 
                        { value: financialSummary.overheads, stroke: '#6B8EAE' }, 
                        { value: financialSummary.wastageLoss, stroke: '#C87A7A' }, 
                      ];
                      
                      const total = items.reduce((sum, item) => sum + item.value, 0);
                      let accumulatedPercent = 0;

                      return items.map((item, idx) => {
                        const percent = total > 0 ? (item.value / total) * 100 : 0;
                        const r = 36;
                        const circumference = 2 * Math.PI * r;
                        const strokeDasharray = `${circumference}`;
                        const strokeDashoffsetAccumulated = circumference - (accumulatedPercent / 100) * circumference;
                        
                        accumulatedPercent += percent;

                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r={r}
                            fill="transparent"
                            stroke={item.stroke}
                            strokeWidth="12"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffsetAccumulated}
                            className="transition-all duration-300 hover:stroke-black/5 cursor-pointer"
                            style={{ transformOrigin: '50% 50%' }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-bold text-[#8C8375] uppercase tracking-wider">Total Claims</span>
                    <span className="text-xs font-black text-[#2C261F] font-mono mt-0.5">
                      ₹{Math.round(financialSummary.totalCosts/1000)}k
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-[9px] font-bold text-[#5A5348]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#5F8575] rounded-full shrink-0"></span>
                    <span className="truncate">Staff Payroll (₹{Math.round(financialSummary.payrollExpense/1000)}k)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#B88A52] rounded-full shrink-0"></span>
                    <span className="truncate">Purchases & COGS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#6B8EAE] rounded-full shrink-0"></span>
                    <span className="truncate">Custom Overheads (₹{Math.round(financialSummary.overheads/1000)}k)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#C87A7A] rounded-full shrink-0"></span>
                    <span className="truncate">Wastage (₹{Math.round(financialSummary.wastageLoss/1000)}k)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
            {/* LEFT COLUMN: INCOME STATEMENT */}
            <div className="lg:col-span-7 bg-white border border-[#E6E1DA] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#F0ECE6] bg-[#FCFAF7] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#2C261F] flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-[#B88A52]" />
                    <span>Income Statement (P&L Breakdown)</span>
                  </h3>
                  <p className="text-[10px] text-[#8C8375] mt-0.5">Itemized financial audit ledger sheet</p>
                </div>
                <span className="text-[9px] bg-[#FAF4EB] border border-[#FAF0E2] text-[#B88A52] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">INR (₹)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-[#F0ECE6] text-[9px] uppercase tracking-wider font-extrabold text-[#8C8375]">
                      <th className="py-2.5 px-4">Ledger Item</th>
                      <th className="py-2.5 px-4 text-right">Debit (Expense)</th>
                      <th className="py-2.5 px-4 text-right">Credit (Sales)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFEA] text-[11px] font-semibold text-[#5A5348]">
                    <tr className="bg-[#FCFAF7]/60 font-bold text-[#2C261F]">
                      <td className="py-2.5 px-4" colSpan={3}>Operating Revenues</td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6]/30">
                      <td className="py-2 px-4 font-medium pl-6">Guest Billing Net Sales (Subtotal)</td>
                      <td className="py-2 px-4 text-right text-gray-400">—</td>
                      <td className="py-2 px-4 text-right font-mono text-emerald-600">₹{Math.round(financialSummary.netSales).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6]/30">
                      <td className="py-2 px-4 font-medium pl-6">CGST & SGST Collected ({cgstRate + sgstRate}%)</td>
                      <td className="py-2 px-4 text-right text-gray-400">—</td>
                      <td className="py-2 px-4 text-right font-mono text-emerald-600">₹{Math.round(financialSummary.taxesCollected).toLocaleString('en-IN')}</td>
                    </tr>
                    {serviceChargeRate > 0 && (
                      <tr className="hover:bg-[#FAF9F6]/30">
                        <td className="py-2 px-4 font-medium pl-6">Service Charge ({serviceChargeRate}%)</td>
                        <td className="py-2 px-4 text-right text-gray-400">—</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-600">₹{Math.round(financialSummary.serviceChargeCollected).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    
                    <tr className="bg-[#FCFAF7]/60 font-bold text-[#2C261F]">
                      <td className="py-2.5 px-4" colSpan={3}>Cost of Goods Sold (COGS)</td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6]/30">
                      <td className="py-2 px-4 font-medium pl-6">Food Ingredients Usage (Est. 28%)</td>
                      <td className="py-2 px-4 text-right font-mono text-[#2C261F]">₹{Math.round(financialSummary.ingredientCost).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-4 text-right text-gray-400">—</td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6]/30">
                      <td className="py-2 px-4 font-medium pl-6 text-rose-600">Logged Stock Wastage & Spoilage Claims</td>
                      <td className="py-2 px-4 text-right font-mono text-[#2C261F]">₹{Math.round(financialSummary.wastageLoss).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-4 text-right text-gray-400">—</td>
                    </tr>

                    <tr className="bg-[#FCFAF7]/60 font-bold text-[#2C261F]">
                      <td className="py-2.5 px-4" colSpan={3}>Operating Expenses (OpEx)</td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6]/30">
                      <td className="py-2 px-4 font-medium pl-6">Staff Roster Payroll Expense</td>
                      <td className="py-2 px-4 text-right font-mono text-[#2C261F]">₹{Math.round(financialSummary.payrollExpense).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-4 text-right text-gray-400">—</td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6]/30">
                      <td className="py-2 px-4 font-medium pl-6">Completed Supplier Stock Receipts (POs)</td>
                      <td className="py-2 px-4 text-right font-mono text-[#2C261F]">₹{Math.round(financialSummary.purchaseCost).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-4 text-right text-gray-400">—</td>
                    </tr>
                    <tr className="hover:bg-[#FAF9F6]/30">
                      <td className="py-2 px-4 font-medium pl-6">Fixed Overhead Logs (Rent, Utilities, Maintenance, Marketing)</td>
                      <td className="py-2 px-4 text-right font-mono text-[#2C261F]">₹{Math.round(financialSummary.overheads).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-4 text-right text-gray-400">—</td>
                    </tr>

                    <tr className="bg-[#FAF4EB] font-black text-[#2C261F] border-t-2 border-[#E6E1DA]">
                      <td className="py-3 px-4 uppercase tracking-wider">Operating Totals</td>
                      <td className="py-3 px-4 text-right font-mono text-[#2C261F]">₹{Math.round(financialSummary.totalCosts).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">₹{Math.round(financialSummary.grossRevenue).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-[#2C261F] text-white font-black text-[12px]">
                      <td className="py-3 px-4 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#B88A52]"></span>
                        <span>Net Operating Profit</span>
                      </td>
                      <td className="py-3 px-4 text-right" colSpan={2}>
                        <span className="font-mono text-[#B88A52] text-sm">
                          ₹{Math.round(financialSummary.netProfit).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] font-bold text-gray-300 ml-1.5 font-sans tracking-widest bg-white/10 px-2 py-0.5 rounded">
                          {financialSummary.profitMargin.toFixed(1)}% MARGIN
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN: LEDGER FEED */}
            <div className="lg:col-span-5 bg-white border border-[#E6E1DA] rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-[#2C261F] flex items-center gap-1.5">
                    <Landmark className="w-4.5 h-4.5 text-[#B88A52]" />
                    <span>Recent Transactions Feed</span>
                  </h3>
                  <p className="text-[10px] text-[#8C8375] mt-0.5">Real-time ledger audit history</p>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {unifiedTransactions.slice(0, 10).map((tx) => {
                  let iconColor = 'text-gray-600 bg-gray-50';
                  let badgeText = '';
                  let badgeColor = '';
                  
                  if (tx.type === 'revenue') {
                    iconColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
                    badgeText = '+ CREDIT';
                    badgeColor = 'bg-emerald-50 text-emerald-700';
                  } else if (tx.type === 'purchase') {
                    iconColor = 'text-amber-600 bg-[#FAF4EB] border-[#FAF0E2]';
                    badgeText = '- DEBIT';
                    badgeColor = 'bg-amber-50 text-amber-700';
                  } else if (tx.type === 'wastage') {
                    iconColor = 'text-rose-600 bg-rose-50 border-rose-100';
                    badgeText = '- LOSS';
                    badgeColor = 'bg-rose-50 text-rose-700';
                  } else if (tx.type === 'payroll') {
                    iconColor = 'text-blue-600 bg-blue-50 border-blue-100';
                    badgeText = '- PAYOUT';
                    badgeColor = 'bg-blue-50 text-blue-700';
                  } else if (tx.type === 'expense') {
                    iconColor = 'text-orange-600 bg-orange-50 border-orange-100';
                    badgeText = '- OPEX';
                    badgeColor = 'bg-orange-50 text-orange-700';
                  }

                  return (
                    <div key={tx.id} className="border border-[#E6E1DA]/60 hover:border-[#B88A52]/20 rounded-xl p-3 bg-[#FCFAF7]/20 hover:bg-white transition-all flex items-center justify-between gap-3 relative overflow-hidden">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border text-xs shrink-0 font-bold", iconColor)}>
                          {tx.type === 'revenue' ? '+' : tx.type === 'wastage' ? '×' : '—'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#2C261F] truncate">{tx.title}</h4>
                          <p className="text-[10px] text-[#8C8375] font-semibold flex items-center gap-1.5 mt-0.5 truncate">
                            <span>{tx.subtitle}</span>
                            <span>•</span>
                            <span>{new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className={cn("text-xs font-extrabold font-mono", tx.type === 'revenue' ? 'text-emerald-600' : 'text-[#2C261F]')}>
                          {tx.type === 'revenue' ? '+' : '-'}₹{Math.round(tx.amount).toLocaleString('en-IN')}
                        </span>
                        <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider", badgeColor)}>
                          {badgeText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. OPERATING EXPENSES (OVERHEADS) MANAGEMENT */}
      {activeSubTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in items-start">
          {/* Expenses List */}
          <div className="lg:col-span-2 bg-white border border-[#E6E1DA] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#F0ECE6] flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FCFAF7]">
              <div>
                <h3 className="text-sm font-bold text-[#2C261F] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#B88A52]" />
                  <span>Logged Operating Expenses</span>
                </h3>
                <p className="text-[11px] text-[#8C8375] mt-0.5 font-medium">Log rent, utility bills, maintenance charges, and advertising claims.</p>
              </div>
              <button
                onClick={() => {
                  setExpenseForm({
                    category: 'utilities',
                    amount: 0,
                    date: getLocalDateString(),
                    description: ''
                  });
                  setEditingExpense(null);
                  setIsExpenseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer shadow-[#B88A52]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Expense</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#F0ECE6] text-[9px] uppercase tracking-wider font-extrabold text-[#8C8375]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFEA] text-[11px] font-semibold text-[#5A5348] bg-white">
                  {operatingExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#8C8375] font-semibold">
                        No expenses logged for this month.
                      </td>
                    </tr>
                  ) : (
                    operatingExpenses.map((expense) => {
                      let CategoryIcon = MoreHorizontal;
                      let categoryColor = 'bg-gray-50 text-gray-700 border-gray-150';
                      
                      if (expense.category === 'rent') {
                        CategoryIcon = Home;
                        categoryColor = 'bg-rose-50 text-rose-700 border-rose-100';
                      } else if (expense.category === 'utilities') {
                        CategoryIcon = Zap;
                        categoryColor = 'bg-amber-50 text-amber-700 border-amber-100';
                      } else if (expense.category === 'maintenance') {
                        CategoryIcon = Wrench;
                        categoryColor = 'bg-blue-50 text-blue-700 border-blue-100';
                      } else if (expense.category === 'marketing') {
                        CategoryIcon = Megaphone;
                        categoryColor = 'bg-purple-50 text-purple-700 border-purple-100';
                      }

                      return (
                        <tr key={expense.id} className="hover:bg-[#FAF9F6]/20 transition-all">
                          <td className="py-3.5 px-4 text-[#8C8375] font-medium font-mono">
                            {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wide", categoryColor)}>
                              <CategoryIcon className="w-3 h-3 shrink-0" />
                              <span>{expense.category}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#2C261F] max-w-[200px] truncate" title={expense.description}>
                            {expense.description}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-[#2C261F] font-mono">
                            ₹{expense.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingExpense(expense);
                                  setExpenseForm({
                                    id: expense.id,
                                    category: expense.category,
                                    amount: expense.amount,
                                    date: expense.date,
                                    description: expense.description
                                  });
                                  setIsExpenseModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-[#E6E1DA] hover:bg-[#FAF7F2] text-[#8C8375] hover:text-[#B88A52] transition-colors cursor-pointer"
                                title="Edit Expense"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Overhead Split Card */}
          <div className="bg-white border border-[#E6E1DA] rounded-2xl shadow-sm p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-[#2C261F] flex items-center gap-1.5">
                <Layers className="w-4.5 h-4.5 text-[#B88A52]" />
                <span>Overhead Breakdown</span>
              </h3>
              <p className="text-[10px] text-[#8C8375] mt-0.5">Summary of custom logged overhead liabilities</p>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { name: 'Rent Expense', val: financialSummary.breakdown.rent, color: 'bg-rose-500', icon: Home, type: 'rent' },
                { name: 'Utilities & Bills', val: financialSummary.breakdown.utilities, color: 'bg-amber-500', icon: Zap, type: 'utilities' },
                { name: 'Equipment Maintenance', val: financialSummary.breakdown.maintenance, color: 'bg-blue-500', icon: Wrench, type: 'maintenance' },
                { name: 'Marketing & Ads', val: financialSummary.breakdown.marketing, color: 'bg-purple-500', icon: Megaphone, type: 'marketing' },
                { name: 'Other Expenses', val: financialSummary.breakdown.other, color: 'bg-gray-500', icon: MoreHorizontal, type: 'other' },
              ].map((item, idx) => {
                const total = financialSummary.breakdown.total || 1;
                const pct = (item.val / total) * 100;
                const Icon = item.icon;

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-[#5A5348] flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-[#8C8375] shrink-0" />
                        <span>{item.name}</span>
                      </span>
                      <span className="text-[#2C261F] font-mono">
                        ₹{item.val.toLocaleString('en-IN')} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    {/* custom SVG/HTML progress bar */}
                    <div className="h-1.5 w-full bg-[#FCFAF7] border border-[#F0ECE6] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", item.color)} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-[#F0ECE6] pt-3.5 mt-2 flex items-center justify-between">
                <span className="text-xs font-black text-[#2C261F] uppercase">Total Logged Overheads</span>
                <span className="text-sm font-black text-[#B88A52] font-mono">
                  ₹{financialSummary.breakdown.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MENU PROFITABILITY & PERFORMANCE LEADERBOARD */}
      {activeSubTab === 'menu_performance' && (
        <div className="bg-white border border-[#E6E1DA] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#F0ECE6] flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FCFAF7]">
            <div>
              <h3 className="text-sm font-bold text-[#2C261F] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#B88A52]" />
                <span>Menu Item Profitability Ledger</span>
              </h3>
              <p className="text-[11px] text-[#8C8375] mt-0.5 font-medium">Evaluate sold item counts, dynamic ingredient portion costs (linked to Recipes), and raw margins.</p>
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] text-[#8C8375] font-bold uppercase tracking-wider">Sort By:</span>
              <div className="flex items-center bg-white border border-[#E6E1DA] rounded-xl p-1 shadow-sm">
                {[
                  { field: 'units', label: 'Units Sold' },
                  { field: 'revenue', label: 'Revenue' },
                  { field: 'margin', label: 'Margin %' }
                ].map(sortOpt => (
                  <button
                    key={sortOpt.field}
                    onClick={() => {
                      if (menuSortField === sortOpt.field) {
                        setMenuSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setMenuSortField(sortOpt.field as any);
                        setMenuSortOrder('desc');
                      }
                    }}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                      menuSortField === sortOpt.field 
                        ? "bg-[#2C261F] text-white"
                        : "text-[#5A5348] hover:bg-[#FAF7F2]"
                    )}
                  >
                    <span>{sortOpt.label}</span>
                    {menuSortField === sortOpt.field && (
                      <span className="text-[8px] font-extrabold">{menuSortOrder === 'desc' ? '▼' : '▲'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#F0ECE6] text-[9px] uppercase tracking-wider font-extrabold text-[#8C8375]">
                  <th className="py-3 px-4">Menu Dish</th>
                  <th className="py-3 px-3 text-right">Selling Price (₹)</th>
                  <th className="py-3 px-3 text-right">Recipe Port. Cost (₹)</th>
                  <th className="py-3 px-3 text-right">Portion Profit (₹)</th>
                  <th className="py-3 px-4 text-center">Profit Margin</th>
                  <th className="py-3 px-3 text-right">Units Sold</th>
                  <th className="py-3 px-3 text-right">Total Net Profit (₹)</th>
                  <th className="py-3 px-4 text-center">Performance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA] text-[11px] font-semibold text-[#5A5348] bg-white">
                {menuPerformanceList.map((dish) => {
                  let badgeClass = 'bg-gray-50 text-gray-600 border-gray-150';
                  if (dish.tier === 'Star') {
                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  } else if (dish.tier === 'Cash Cow') {
                    badgeClass = 'bg-blue-50 text-blue-700 border-blue-100';
                  } else if (dish.tier === 'Question Mark') {
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
                  } else if (dish.tier === 'Underperformer') {
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-100';
                  }

                  return (
                    <tr key={dish.id} className="hover:bg-[#FAF9F6]/20 transition-all">
                      <td className="py-3 px-4 font-bold text-[#2C261F]">{dish.name}</td>
                      <td className="py-3 px-3 text-right font-mono text-[#8C8375]">₹{dish.price}</td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600/80">₹{Math.round(dish.portionCost)}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600/80">₹{Math.round(dish.portionProfit)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-extrabold",
                          dish.margin >= 70 ? "text-emerald-600 bg-emerald-50" : dish.margin >= 60 ? "text-[#B88A52] bg-[#FAF4EB]" : "text-rose-600 bg-rose-50"
                        )}>
                          {dish.margin.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#2C261F]">{dish.unitsSold} pcs</td>
                      <td className="py-3 px-3 text-right font-black text-[#2C261F] font-mono">
                        ₹{Math.round(dish.totalNetProfit).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider", badgeClass)}>
                          {dish.tier === 'Question Mark' ? 'Low Vol / High Marg' : dish.tier === 'Cash Cow' ? 'High Vol / Low Marg' : dish.tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OPERATING EXPENSES LOG MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#23201D]/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#F0ECE6]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FAF4EB] rounded-lg text-[#B88A52] border border-[#FAF0E2]">
                  <Coins className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C261F]">
                    {editingExpense ? 'Edit Overhead Expense' : 'Log Operating Expense'}
                  </h3>
                  <p className="text-[10px] text-[#8C8375]">Record rent, utility bills, or kitchen maintenance</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsExpenseModalOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Expense Category *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                  required
                >
                  <option value="rent">Rent (Premises / Shop)</option>
                  <option value="utilities">Utilities (Electricity, Water, SaaS, Net)</option>
                  <option value="maintenance">Equipment Maintenance (Chimney, HVAC, Oven)</option>
                  <option value="marketing">Marketing (Advertisements, SEO, Printing)</option>
                  <option value="other">Other Expenses (Taxes, Incidentals)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Amount in ₹"
                    value={expenseForm.amount || ''}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full text-xs font-bold px-3 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Billing Date *</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full text-xs font-bold px-3 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Expense Description *</label>
                <textarea
                  placeholder="e.g. High pressure gas cylinder refill / May electricity bill"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-xs font-semibold p-3 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] min-h-[80px]"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#F0ECE6]">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-[#B88A52]/20 cursor-pointer"
                >
                  {editingExpense ? 'Apply Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
