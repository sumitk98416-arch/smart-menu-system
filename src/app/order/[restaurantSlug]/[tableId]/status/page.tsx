'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Clock, ChefHat, Bell, UtensilsCrossed, ArrowRight, RotateCcw, Star, Crown, Soup, CupSoda, QrCode, ArrowUpRight, CheckCircle, CreditCard, Lock } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { QRCodeSVG } from 'qrcode.react';
import { Order } from '@/lib/types';

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
  
  const [restaurantLogo, setRestaurantLogo] = useState('default');
  const [restaurantName, setRestaurantName] = useState('The Golden Plate');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [upiId, setUpiId] = useState('');
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [cgstRate, setCgstRate] = useState(2.5);
  const [sgstRate, setSgstRate] = useState(2.5);
  const [serviceChargeRate, setServiceChargeRate] = useState(0);
  const [serviceChargeType, setServiceChargeType] = useState<'percent' | 'fixed'>('percent');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'pending' | 'paid'>('unpaid');
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (grandTotal: number) => {
    try {
      setRazorpayLoading(true);

      // 1. Create order on the backend (api/payment/order)
      const orderResponse = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal, orderNumber: orderData?.orderNumber }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to initiate secure checkout session');
      }

      const orderJson = await orderResponse.json();

      // 2. Load the external Razorpay Checkout SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay Checkout SDK failed to load. Please verify your internet connection.');
        setRazorpayLoading(false);
        return;
      }

      // 3. Open the Razorpay Overlay
      const options = {
        key: orderJson.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy',
        amount: orderJson.amount,
        currency: orderJson.currency,
        name: restaurantName,
        description: `Bill Settlement - Order #${orderData?.orderNumber}`,
        order_id: orderJson.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment signature on the backend (api/payment/verify)
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyJson = await verifyResponse.json();
            if (verifyJson.verified) {
              setPaymentStatus('paid');

              // Update the order list in localStorage so the kitchen/admin sees it instantly
              const storedOrdersRaw = localStorage.getItem('tabletap_demo_orders');
              if (storedOrdersRaw) {
                const currentOrders = JSON.parse(storedOrdersRaw);
                const updatedOrders = currentOrders.map((o: any) => {
                  if (o.order_number === orderData?.orderNumber) {
                    return {
                      ...o,
                      payment_status: 'paid' as const,
                      status: 'served' as const,
                    };
                  }
                  return o;
                });
                localStorage.setItem('tabletap_demo_orders', JSON.stringify(updatedOrders));

                // Dispatch storage event to trigger dashboard layout reload across tabs
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'tabletap_demo_orders',
                  newValue: JSON.stringify(updatedOrders),
                }));
              }
            } else {
              alert(`Payment verification signature mismatch: ${verifyJson.error}`);
            }
          } catch (err: any) {
            console.error(err);
            alert(`Payment verification connection failed: ${err.message}`);
          } finally {
            setRazorpayLoading(false);
          }
        },
        prefill: {
          name: 'Dining Guest',
        },
        theme: {
          color: '#c8913a',
        },
        modal: {
          ondismiss: function () {
            setRazorpayLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Payment initiation failed');
      setRazorpayLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        let custom: any = null;
        const saved = localStorage.getItem('qrestro_demo_restaurant');
        if (saved) {
          custom = JSON.parse(saved);
        } else {
          const sessionSaved = sessionStorage.getItem('qrestro_last_restaurant');
          if (sessionSaved) {
            custom = JSON.parse(sessionSaved);
          }
        }

        if (custom) {
          setTimeout(() => {
            if (custom.logo_url) setRestaurantLogo(custom.logo_url);
            if (custom.name) setRestaurantName(custom.name);
            if (custom.currency) setCurrencySymbol(custom.currency);
            
            const upi = custom.upi_id || custom.settings?.upi_id || '';
            const payQr = custom.payment_qr_url || custom.settings?.payment_qr_url || '';
            const cgst = custom.cgst_rate !== undefined ? Number(custom.cgst_rate) : (custom.settings?.cgst_rate !== undefined ? Number(custom.settings.cgst_rate) : 2.5);
            const sgst = custom.sgst_rate !== undefined ? Number(custom.sgst_rate) : (custom.settings?.sgst_rate !== undefined ? Number(custom.settings.sgst_rate) : 2.5);
            const svcRate = custom.service_charge_rate !== undefined ? Number(custom.service_charge_rate) : (custom.settings?.service_charge_rate !== undefined ? Number(custom.settings.service_charge_rate) : 0);
            const svcType = custom.service_charge_type || custom.settings?.service_charge_type || 'percent';

            setUpiId(upi);
            setPaymentQrUrl(payQr);
            setCgstRate(cgst);
            setSgstRate(sgst);
            setServiceChargeRate(svcRate);
            setServiceChargeType(svcType);
          }, 0);
        }
      } catch {}
    }
  }, []);



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
        <path d="M 12 76 A 38 38 0 0 1 88 76 Z" strokeWidth="4" />
        <path d="M 20 70 A 30 30 0 0 1 36 49" strokeWidth="2.5" opacity="0.6" />
        <rect x="5" y="76" width="90" height="5" rx="2.5" fill="currentColor" stroke="none" />
        <path d="M 12 83 Q 50 86 88 83" strokeWidth="3" />
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

  const [orderData, setOrderData] = useState<OrderData | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('qrestro_last_order');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  useEffect(() => {
    if (!orderData) return;
    if (typeof window !== 'undefined') {
      try {
        const storedOrdersRaw = localStorage.getItem('qrestro_demo_orders');
        if (storedOrdersRaw) {
          const currentOrders: Order[] = JSON.parse(storedOrdersRaw);
          const currentOrder = currentOrders.find((o) => o.order_number === orderData.orderNumber);
          if (currentOrder && currentOrder.payment_status && currentOrder.payment_status !== paymentStatus) {
            const nextStatus = currentOrder.payment_status;
            setTimeout(() => {
              setPaymentStatus(nextStatus);
            }, 0);
          }
        }
      } catch (err) {
        console.error('Error fetching order payment status:', err);
      }
    }
  }, [orderData, paymentStatus]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'qrestro_demo_orders' && e.newValue && orderData) {
        try {
          const currentOrders: Order[] = JSON.parse(e.newValue);
          const currentOrder = currentOrders.find((o) => o.order_number === orderData.orderNumber);
          if (currentOrder && currentOrder.payment_status && currentOrder.payment_status !== paymentStatus) {
            const nextStatus = currentOrder.payment_status;
            setPaymentStatus(nextStatus);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [orderData, paymentStatus]);

  const handleNotifyPayment = () => {
    if (!orderData) return;
    setPaymentStatus('pending');
    
    if (typeof window !== 'undefined') {
      try {
        const storedOrdersRaw = localStorage.getItem('qrestro_demo_orders');
        if (storedOrdersRaw) {
          const currentOrders: Order[] = JSON.parse(storedOrdersRaw);
          const updatedOrders = currentOrders.map((o) => {
            if (o.order_number === orderData.orderNumber) {
              return {
                ...o,
                payment_status: 'pending' as const,
                notes: o.notes ? `${o.notes}, [UPI PAY REQUESTED]` : '[UPI PAY REQUESTED]'
              };
            }
            return o;
          });
          localStorage.setItem('qrestro_demo_orders', JSON.stringify(updatedOrders));
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'qrestro_demo_orders',
            newValue: JSON.stringify(updatedOrders)
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Load order from sessionStorage and clear cart
    const stored = sessionStorage.getItem('qrestro_last_order');
    if (stored) {
      clearCart();
    }
  }, [clearCart]);

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
            <div className="w-11 h-11 bg-gold-500 rounded-xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
              {renderLogo()}
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
        {(() => {
          const subtotal = orderData.total;
          const serviceChargeAmount = serviceChargeType === 'percent'
            ? subtotal * (serviceChargeRate / 100)
            : serviceChargeRate;
          const cgstAmount = subtotal * (cgstRate / 100);
          const sgstAmount = subtotal * (sgstRate / 100);
          const totalWithTax = subtotal + cgstAmount + sgstAmount + serviceChargeAmount;
          const grandTotal = Math.round(totalWithTax);

          return (
            <>
              <div className="card">
                <h3 className="font-heading text-lg font-semibold text-ink-900 mb-3 font-sans">Order Summary</h3>
                <div className="space-y-2">
                  {orderData.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-gold-500/10 rounded-lg flex items-center justify-center text-xs font-bold text-gold-600 font-sans">
                          {item.quantity}
                        </span>
                        <span className="text-ink-800 font-sans">{item.name}</span>
                      </div>
                      <span className="text-ink-600 font-medium font-sans">{formatCurrency(item.subtotal, currencySymbol)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t border-cream-200 space-y-2 text-xs text-ink-600 font-sans">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currencySymbol)}</span>
                  </div>
                  {serviceChargeRate > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge {serviceChargeType === 'percent' ? `(${serviceChargeRate}%)` : '(Fixed)'}</span>
                      <span>{formatCurrency(serviceChargeAmount, currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>CGST ({cgstRate}%)</span>
                    <span>{formatCurrency(cgstAmount, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({sgstRate}%)</span>
                    <span>{formatCurrency(sgstAmount, currencySymbol)}</span>
                  </div>
                  {(grandTotal - totalWithTax) !== 0 && (
                    <div className="flex justify-between text-ink-400">
                      <span>Round Off</span>
                      <span>{(grandTotal - totalWithTax) > 0 ? '+' : ''}{(grandTotal - totalWithTax).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-dashed border-cream-200 text-sm font-bold text-ink-950">
                    <span>Grand Total</span>
                    <span className="font-heading text-lg font-bold text-gold-500">
                      {formatCurrency(grandTotal, currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              {/* UPI & Digital Payment Section */}
              {(upiId || paymentQrUrl) && (
                <div className="card p-5 space-y-5 animate-scale-in border border-gold-200 bg-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-cream-100">
                    <QrCode className="w-5 h-5 text-gold-500" />
                    <div>
                      <h3 className="font-heading text-sm font-bold text-ink-900 font-sans">Pay Bill Directly</h3>
                      <p className="text-[10px] text-ink-400 font-sans">Scan QR or use a mobile UPI app to settle your bill</p>
                    </div>
                  </div>

                  {paymentStatus === 'paid' ? (
                    <div className="text-center py-6 space-y-2.5 animate-scale-in">
                      <CheckCircle className="w-12 h-12 text-sage-500 mx-auto" />
                      <h4 className="font-bold text-ink-900 text-sm font-sans">Payment Confirmed!</h4>
                      <p className="text-xs text-ink-500 font-sans">Thank you for dining with us! Have a wonderful day.</p>
                    </div>
                  ) : paymentStatus === 'pending' ? (
                    <div className="text-center py-6 space-y-2.5 animate-scale-in">
                      <Clock className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
                      <h4 className="font-bold text-ink-900 text-sm font-sans">Verification Pending</h4>
                      <p className="text-xs text-ink-500 px-4 font-sans">Staff has been notified. Please wait while we verify your payment.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full">
                        {/* Static Payment QR takes precedence as requested */}
                        {paymentQrUrl ? (
                          <div className="flex flex-col items-center space-y-2 bg-cream-50/50 p-3 rounded-xl border border-cream-200">
                            <div className="w-[146px] h-[146px] p-2 bg-white rounded-lg border border-cream-150 shadow-sm flex items-center justify-center">
                              <img
                                src={paymentQrUrl}
                                className="max-w-full max-h-full object-contain"
                                alt="Restaurant Payment QR"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest font-sans">Scan to Pay</span>
                          </div>
                        ) : (
                          /* Dynamic UPI QR Code Fallback */
                          upiId && (
                            <div className="flex flex-col items-center space-y-2 bg-cream-50/50 p-3 rounded-xl border border-cream-200">
                              <div className="p-2 bg-white rounded-lg border border-cream-150 shadow-sm">
                                <QRCodeSVG
                                  value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(restaurantName)}&am=${grandTotal}&cu=INR&tn=Order%20${orderData.orderNumber}`}
                                  size={130}
                                  fgColor="#1a1208"
                                  bgColor="#ffffff"
                                  level="M"
                                />
                              </div>
                              <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest font-sans">Payment QR Code</span>
                            </div>
                          )
                        )}
                      </div>

                      <div className="w-full text-center space-y-3">
                        <p className="text-xs text-ink-600 font-medium font-sans">
                          Total Payable: <strong className="text-ink-900 font-bold text-sm">{formatCurrency(grandTotal, currencySymbol)}</strong>
                        </p>

                        {/* Razorpay Gateway Button */}
                        <button
                          onClick={() => handleRazorpayPayment(grandTotal)}
                          disabled={razorpayLoading}
                          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#c8913a] hover:bg-[#a67520] disabled:bg-gray-400 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer font-sans active:scale-98"
                        >
                          {razorpayLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CreditCard className="w-4.5 h-4.5" />
                          )}
                          <span>Pay via Card/UPI (Razorpay)</span>
                        </button>

                        {/* Mobile Deep Link */}
                        {upiId && (
                          <a
                            href={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(restaurantName)}&am=${grandTotal}&cu=INR&tn=Order%20${orderData.orderNumber}`}
                            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-gold-500 hover:bg-gold-600 active:scale-98 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg md:hidden font-sans"
                          >
                            Pay via UPI App <ArrowUpRight className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={handleNotifyPayment}
                          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-gold-300 text-[#B88A52] hover:bg-[#B88A52]/5 font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer font-sans"
                        >
                          <Check className="w-4 h-4" /> I have Paid / Notify Staff
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}

        {/* Action buttons */}
        <div className="space-y-3">
          <button onClick={handleReorder} className="btn-secondary w-full py-3.5 rounded-xl text-base font-sans">
            <RotateCcw className="w-4 h-4" /> Order More Items
          </button>

          {currentStep >= 4 && (
            <button onClick={handleReview} className="btn-primary w-full py-3.5 rounded-xl text-base animate-fade-in-up font-sans">
              <Star className="w-4 h-4" /> Leave a Review
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
