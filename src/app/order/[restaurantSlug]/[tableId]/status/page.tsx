'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Clock, ChefHat, Bell, UtensilsCrossed, ArrowRight, RotateCcw, Star } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';

interface OrderData {
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    special_instructions: string;
  }>;
  total: number;
  time: string;
  orderNumber: number;
}

const statusSteps = [
  { key: 'new', label: 'Order Placed', icon: Check, description: 'Your order has been received' },
  { key: 'accepted', label: 'Accepted', icon: Clock, description: 'Restaurant confirmed your order' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Chef is preparing your food' },
  { key: 'ready', label: 'Ready', icon: Bell, description: 'Your order is ready!' },
  { key: 'served', label: 'Served', icon: UtensilsCrossed, description: 'Enjoy your meal!' },
];

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Load order from sessionStorage
    const stored = sessionStorage.getItem('tabletap_last_order');
    if (stored) {
      setOrderData(JSON.parse(stored));
      clearCart();
    }
  }, []);

  // Simulate order status progression
  useEffect(() => {
    if (!orderData) return;
    const intervals = [3000, 6000, 12000, 18000];
    const timers = intervals.map((delay, index) =>
      setTimeout(() => setCurrentStep(index + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [orderData]);

  const handleReorder = () => {
    router.push(`/order/${params.restaurantSlug}/${params.tableId}`);
  };

  const handleReview = () => {
    router.push(`/order/${params.restaurantSlug}/${params.tableId}/review`);
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <p className="text-4xl mb-4">📋</p>
          <h2 className="font-heading text-xl font-bold text-ink-900 mb-2">No Active Order</h2>
          <p className="text-ink-500 text-sm mb-6">Browse the menu and place an order to track it here</p>
          <button onClick={handleReorder} className="btn-primary">
            <UtensilsCrossed className="w-4 h-4" /> View Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-cream-50/90 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-ink-900">Order #{orderData.orderNumber}</h1>
              <p className="text-xs text-ink-400">Table {(params.tableId as string)?.replace('table-', '')}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Status Animation */}
        <div className="card bg-cream-100 p-6 text-center animate-fade-in">
          <div className={cn(
            'w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-500',
            currentStep >= 4 ? 'bg-sage-500/10' : 'bg-gold-500/10 animate-pulse-gold'
          )}>
            <span className="text-4xl">
              {currentStep === 0 && '📋'}
              {currentStep === 1 && '✅'}
              {currentStep === 2 && '👨‍🍳'}
              {currentStep === 3 && '🔔'}
              {currentStep >= 4 && '🍽️'}
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-ink-900 mb-1">
            {statusSteps[currentStep]?.label}
          </h2>
          <p className="text-ink-500">{statusSteps[currentStep]?.description}</p>
        </div>

        {/* Progress Steps */}
        <div className="card p-4">
          <div className="space-y-0">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-start gap-3">
                  {/* Line + Circle */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500',
                      isCompleted
                        ? 'bg-gold-500 text-white'
                        : 'bg-cream-200 text-ink-400'
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={cn(
                        'w-0.5 h-8 transition-all duration-500',
                        index < currentStep ? 'bg-gold-500' : 'bg-cream-200'
                      )} />
                    )}
                  </div>

                  {/* Text */}
                  <div className="pb-6">
                    <p className={cn(
                      'text-sm font-semibold transition-colors',
                      isCompleted ? 'text-ink-900' : 'text-ink-400'
                    )}>
                      {step.label}
                    </p>
                    <p className="text-xs text-ink-400">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="card">
          <h3 className="font-heading text-lg font-semibold text-ink-900 mb-3">Order Summary</h3>
          <div className="space-y-2">
            {orderData.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gold-500/10 rounded-lg flex items-center justify-center text-xs font-bold text-gold-600">
                    {item.quantity}
                  </span>
                  <span className="text-ink-800">{item.name}</span>
                </div>
                <span className="text-ink-600 font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-cream-200 flex items-center justify-between">
            <span className="font-semibold text-ink-900">Total</span>
            <span className="font-heading text-xl font-bold text-gold-500">
              {formatCurrency(orderData.total)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button onClick={handleReorder} className="btn-secondary w-full py-3.5 rounded-xl text-base">
            <RotateCcw className="w-4 h-4" /> Order More Items
          </button>

          {currentStep >= 4 && (
            <button onClick={handleReview} className="btn-primary w-full py-3.5 rounded-xl text-base animate-fade-in-up">
              <Star className="w-4 h-4" /> Leave a Review
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
