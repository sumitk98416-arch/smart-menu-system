'use client';

import { useState, useEffect } from 'react';
import { Save, Store, Phone, MapPin, Mail, User, Crown, ChefHat, Soup, CupSoda, Star, Image as ImageIcon, Upload, X, Percent, Lock, Key, QrCode, CreditCard, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { demoRestaurant, saveDemoRestaurantSettings } from '@/lib/demo-data';
import { cn } from '@/lib/utils';
import jsQR from 'jsqr';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    name: demoRestaurant.name,
    description: demoRestaurant.description,
    phone: demoRestaurant.phone,
    address: demoRestaurant.address,
    currency: demoRestaurant.currency,
    email: demoRestaurant.email || 'contact@thegoldenplate.com',
    logo_url: demoRestaurant.logo_url || 'default',
    cgst_rate: demoRestaurant.settings?.cgst_rate !== undefined ? Number(demoRestaurant.settings.cgst_rate) : 2.5,
    sgst_rate: demoRestaurant.settings?.sgst_rate !== undefined ? Number(demoRestaurant.settings.sgst_rate) : 2.5,
    service_charge_rate: demoRestaurant.settings?.service_charge_rate !== undefined ? Number(demoRestaurant.settings.service_charge_rate) : 0,
    service_charge_type: (demoRestaurant.settings?.service_charge_type as 'percent' | 'fixed') || 'percent',
    chef_email: (demoRestaurant.settings?.chef_email as string) || 'supportqrestro@gmail.com',
    chef_password: (demoRestaurant.settings?.chef_password as string) || 'fsilnpkgqklmmdid',
    chef_use_admin_creds: demoRestaurant.settings?.chef_use_admin_creds !== undefined ? demoRestaurant.settings.chef_use_admin_creds === true : true,
    upi_id: (demoRestaurant.settings?.upi_id as string) || '',
    payment_qr_url: (demoRestaurant.settings?.payment_qr_url as string) || '',
  });

  const [qrScanResult, setQrScanResult] = useState<{ success: boolean; message: string } | null>(null);

  const [adminName, setAdminName] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )qrestro_demo_name=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : 'Virat Kohli';
    }
    return 'Virat Kohli';
  });

  const [adminEmail, setAdminEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )qrestro_demo_email=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : 'supportqrestro@gmail.com';
    }
    return 'supportqrestro@gmail.com';
  });

  const [adminPhone, setAdminPhone] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )qrestro_demo_phone=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : '+91 98765 43210';
    }
    return '+91 98765 43210';
  });

  const [adminPassword, setAdminPassword] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )qrestro_demo_password=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : 'fsilnpkgqklmmdid';
    }
    return 'fsilnpkgqklmmdid';
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'security' | 'subscription'>('profile');
  const [saved, setSaved] = useState(false);

  // Subscription licensing states
  const [subscription, setSubscription] = useState<{
    plan: 'trial' | 'premium';
    trialStartDate: string;
    daysRemaining: number;
    subscribedDate: string | null;
  }>({
    plan: 'trial',
    trialStartDate: '',
    daysRemaining: 7,
    subscribedDate: null,
  });

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [checkoutCardName, setCheckoutCardName] = useState('');
  const [checkoutCardNumber, setCheckoutCardNumber] = useState('');
  const [checkoutCardExpiry, setCheckoutCardExpiry] = useState('');
  const [checkoutCardCvv, setCheckoutCardCvv] = useState('');
  const [paymentStep, setPaymentStep] = useState<'idle' | 'initiating' | 'verifying' | 'authorizing' | 'activating' | 'success'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Load real user details on mount if in cloud database mode
  useEffect(() => {
    const fetchUser = async () => {
      const isSupabaseConfigured = 
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co' &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key-here';

      const isDemo = document.cookie.includes('qrestro_demo=true');

      if (isSupabaseConfigured && !isDemo) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setAdminEmail(user.email || '');
            if (user.user_metadata?.name) {
              setAdminName(user.user_metadata.name);
            }
            if (user.user_metadata?.phone) {
              setAdminPhone(user.user_metadata.phone);
            }
          }
        } catch (err) {
          console.error('Error fetching Supabase user in settings:', err);
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    // Check if subscription tab is selected via URL query parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'subscription') {
        setActiveTab('subscription');
      }
    }

    const loadSubscription = () => {
      const stored = localStorage.getItem('qrestro_demo_subscription');
      let sub: any = null;
      if (stored) {
        try {
          sub = JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing subscription:', e);
        }
      }

      const getLocalDateString = (d = new Date()) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const todayStr = getLocalDateString();
      if (!sub || !sub.trialStartDate) {
        sub = {
          plan: 'trial',
          trialStartDate: todayStr,
          subscribedDate: null,
        };
        localStorage.setItem('qrestro_demo_subscription', JSON.stringify(sub));
      }

      if (sub.plan === 'trial') {
        const start = new Date(sub.trialStartDate);
        start.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffTime = now.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        sub.daysRemaining = Math.max(0, 7 - diffDays);
      } else {
        sub.daysRemaining = 0;
      }

      setSubscription(sub);
    };

    loadSubscription();

    const handleSubChanged = () => {
      loadSubscription();
    };
    window.addEventListener('qrestro_subscription_changed', handleSubChanged);
    return () => {
      window.removeEventListener('qrestro_subscription_changed', handleSubChanged);
    };
  }, []);

  const handleCardNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    setCheckoutCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setCheckoutCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCheckoutCardExpiry(cleaned);
    }
  };

  const handleCvvChange = (val: string) => {
    setCheckoutCardCvv(val.replace(/\D/g, '').slice(0, 3));
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    
    if (!checkoutCardName.trim()) {
      setCheckoutError("Cardholder name is required.");
      return;
    }
    if (checkoutCardNumber.replace(/\s/g, '').length !== 16) {
      setCheckoutError("Please enter a valid 16-digit card number.");
      return;
    }
    const expiryPattern = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    if (!expiryPattern.test(checkoutCardExpiry)) {
      setCheckoutError("Please enter expiry date in MM/YY format.");
      return;
    }
    if (checkoutCardCvv.length !== 3) {
      setCheckoutError("CVV must be 3 digits.");
      return;
    }

    setPaymentStep('initiating');
    
    setTimeout(() => {
      setPaymentStep('verifying');
    }, 500);

    setTimeout(() => {
      setPaymentStep('authorizing');
    }, 1000);

    setTimeout(() => {
      setPaymentStep('activating');
    }, 1500);

    setTimeout(() => {
      setPaymentStep('success');
      const getLocalDateString = (d = new Date()) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const todayStr = getLocalDateString();
      const updated = {
        plan: 'premium',
        trialStartDate: subscription.trialStartDate || todayStr,
        subscribedDate: todayStr,
      };
      localStorage.setItem('qrestro_demo_subscription', JSON.stringify(updated));
      
      window.dispatchEvent(new CustomEvent('qrestro_subscription_changed'));
    }, 2000);

    setTimeout(() => {
      setIsUpgradeModalOpen(false);
      setPaymentStep('idle');
      setCheckoutCardName('');
      setCheckoutCardNumber('');
      setCheckoutCardExpiry('');
      setCheckoutCardCvv('');
    }, 3500);
  };

  const handleCancelSubscription = () => {
    if (confirm("Are you sure you want to cancel your Premium Plan and revert to the Free Trial?")) {
      const getLocalDateString = (d = new Date()) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const todayStr = getLocalDateString();
      const updated = {
        plan: 'trial',
        trialStartDate: subscription.trialStartDate || todayStr,
        subscribedDate: null,
      };
      localStorage.setItem('qrestro_demo_subscription', JSON.stringify(updated));
      
      window.dispatchEvent(new CustomEvent('qrestro_subscription_changed'));
    }
  };

  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(() => {
    const rawPhone = demoRestaurant.phone || '';
    const split = rawPhone.split(',').map(p => p.trim()).filter(Boolean);
    return split.length > 0 ? split : [''];
  });

  const handlePhoneChange = (index: number, val: string) => {
    const newPhones = [...phoneNumbers];
    newPhones[index] = val;
    setPhoneNumbers(newPhones);
    
    // Sync with settings.phone
    const joined = newPhones.map(p => p.trim()).filter(Boolean).join(', ');
    setSettings(prev => ({ ...prev, phone: joined }));
  };

  const addPhoneNumber = () => {
    const newPhones = [...phoneNumbers, ''];
    setPhoneNumbers(newPhones);
  };

  const removePhoneNumber = (index: number) => {
    const newPhones = phoneNumbers.filter((_, i) => i !== index);
    const finalPhones = newPhones.length > 0 ? newPhones : [''];
    setPhoneNumbers(finalPhones);
    
    // Sync with settings.phone
    const joined = finalPhones.map(p => p.trim()).filter(Boolean).join(', ');
    setSettings(prev => ({ ...prev, phone: joined }));
  };

  const handleQrUpload = (file: File) => {
    setQrScanResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;

        // Use canvas to read pixel data for jsQR
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              setSettings(prev => ({ ...prev, payment_qr_url: dataUrl }));
              setQrScanResult({
                success: false,
                message: "Canvas rendering context not available."
              });
              return;
            }
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const decoded = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (decoded && decoded.data && decoded.location) {
              const qrText = decoded.data;
              const loc = decoded.location;

              // Calculate bounding box corners
              const xs = [loc.topLeftCorner.x, loc.topRightCorner.x, loc.bottomLeftCorner.x, loc.bottomRightCorner.x];
              const ys = [loc.topLeftCorner.y, loc.topRightCorner.y, loc.bottomLeftCorner.y, loc.bottomRightCorner.y];
              
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              
              const qrWidth = maxX - minX;
              const qrHeight = maxY - minY;

              // Add 15% padding around the QR code
              const padding = Math.round(Math.min(qrWidth, qrHeight) * 0.15);
              const cropX = Math.max(0, minX - padding);
              const cropY = Math.max(0, minY - padding);
              const cropWidth = Math.min(img.width - cropX, qrWidth + padding * 2);
              const cropHeight = Math.min(img.height - cropY, qrHeight + padding * 2);

              // Crop the image using a second canvas
              const cropCanvas = document.createElement('canvas');
              const cropCtx = cropCanvas.getContext('2d');
              if (cropCtx) {
                cropCanvas.width = cropWidth;
                cropCanvas.height = cropHeight;
                cropCtx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
                const croppedDataUrl = cropCanvas.toDataURL('image/png');

                let extractedUpi = '';
                if (qrText.startsWith('upi://pay')) {
                  const urlParams = new URLSearchParams(qrText.split('?')[1]);
                  const pa = urlParams.get('pa');
                  if (pa) extractedUpi = pa;
                } else if (qrText.includes('@')) {
                  const match = qrText.match(/[\w\.\-_]+@[\w\.\-_]+/);
                  if (match) extractedUpi = match[0];
                }

                setSettings(prev => ({
                  ...prev,
                  upi_id: extractedUpi || prev.upi_id,
                  payment_qr_url: croppedDataUrl
                }));

                setQrScanResult({
                  success: true,
                  message: extractedUpi
                    ? `Successfully zoomed QR code & extracted UPI ID: ${extractedUpi}`
                    : "Successfully zoomed and cropped QR code image."
                });
              } else {
                // Fallback to original if crop context fails
                setSettings(prev => ({ ...prev, payment_qr_url: dataUrl }));
              }
            } else {
              // No QR code detected, save original as static fallback
              setSettings(prev => ({ ...prev, payment_qr_url: dataUrl }));
              setQrScanResult({
                success: false,
                message: "No QR code could be scanned from this image. Saved as static fallback."
              });
            }
          } catch (err) {
            console.error("Error decoding QR code:", err);
            setSettings(prev => ({ ...prev, payment_qr_url: dataUrl }));
            setQrScanResult({
              success: false,
              message: "Failed to decode the image. Saved as static fallback."
            });
          }
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Save restaurant settings
    saveDemoRestaurantSettings(settings);

    // Save admin settings to cookies
    document.cookie = `qrestro_demo_name=${encodeURIComponent(adminName)};path=/;max-age=31536000`;
    document.cookie = `qrestro_demo_email=${encodeURIComponent(adminEmail)};path=/;max-age=31536000`;
    document.cookie = `qrestro_demo_phone=${encodeURIComponent(adminPhone)};path=/;max-age=31536000`;
    document.cookie = `qrestro_demo_password=${encodeURIComponent(adminPassword)};path=/;max-age=31536000`;

    // Save profile details to Supabase if in real database mode
    const isSupabaseConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co' &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key-here';

    const isDemo = document.cookie.includes('qrestro_demo=true');

    if (isSupabaseConfigured && !isDemo) {
      try {
        const supabase = createClient();
        const updateData: any = {
          email: adminEmail,
          data: {
            name: adminName,
            phone: adminPhone
          }
        };

        // Only update password in Supabase if it was changed from default/preset
        if (adminPassword && adminPassword !== 'fsilnpkgqklmmdid' && adminPassword.trim() !== '') {
          updateData.password = adminPassword;
        }

        const { error } = await supabase.auth.updateUser(updateData);
        if (error) {
          alert(`Failed to update profile: ${error.message}`);
          return;
        }
      } catch (err) {
        console.error('Error updating Supabase user:', err);
        alert('An error occurred while saving your profile to the database.');
        return;
      }
    }

    setSaved(true);
    // Reload the page to ensure all dynamic elements across the layout update instantly
    setTimeout(() => {
      setSaved(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-simple-fade max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-ink-900">Settings</h1>
        <p className="text-ink-500 mt-1">Manage your restaurant profile and administrator preferences</p>
      </div>

      {saved && (
        <div className="p-4 bg-sage-400/10 border border-sage-400/20 rounded-xl text-sage-700 text-sm animate-fade-in flex items-center gap-2">
          ✅ Settings saved successfully!
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sleek Side Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-row lg:flex-col gap-1.5 border-b lg:border-b-0 lg:border-r border-cream-200 pb-4 lg:pb-0 lg:pr-6 overflow-x-auto lg:overflow-x-visible flex-nowrap lg:flex-wrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-auto lg:w-full select-none justify-center lg:justify-start cursor-pointer border border-transparent shrink-0 whitespace-nowrap",
              activeTab === 'profile'
                ? "bg-[#B88A52]/10 text-[#B88A52] shadow-sm font-bold border-[#B88A52]/10"
                : "text-ink-500 hover:bg-cream-50 hover:text-ink-900"
            )}
          >
            <Store className="w-4 h-4 shrink-0" />
            <span>Restaurant Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-auto lg:w-full select-none justify-center lg:justify-start cursor-pointer border border-transparent shrink-0 whitespace-nowrap",
              activeTab === 'billing'
                ? "bg-[#B88A52]/10 text-[#B88A52] shadow-sm font-bold border-[#B88A52]/10"
                : "text-ink-500 hover:bg-cream-50 hover:text-ink-900"
            )}
          >
            <Percent className="w-4 h-4 shrink-0" />
            <span>Taxation & Payments</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-auto lg:w-full select-none justify-center lg:justify-start cursor-pointer border border-transparent shrink-0 whitespace-nowrap",
              activeTab === 'security'
                ? "bg-[#B88A52]/10 text-[#B88A52] shadow-sm font-bold border-[#B88A52]/10"
                : "text-ink-500 hover:bg-cream-50 hover:text-ink-900"
            )}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>Login & Security</span>
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-auto lg:w-full select-none justify-center lg:justify-start cursor-pointer border border-transparent shrink-0 whitespace-nowrap",
              activeTab === 'subscription'
                ? "bg-[#B88A52]/10 text-[#B88A52] shadow-sm font-bold border-[#B88A52]/10"
                : "text-ink-500 hover:bg-cream-50 hover:text-ink-900"
            )}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Subscription</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {activeTab === 'profile' && (
            /* Restaurant Profile Card */
            <div className="card space-y-6">
              <h2 className="font-heading text-xl font-semibold text-ink-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-gold-500" /> Restaurant Profile
              </h2>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setSettings({ ...settings, name: newName });
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('qrestro_name_changed', { detail: newName }));
                    }
                  }}
                  className="input-field"
                />
              </div>

              {/* Restaurant Logo Selector */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Restaurant Logo</label>
                
                {/* Preset Picker */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                  {[
                    { id: 'default', label: 'Crown (Default)', icon: Crown },
                    { id: 'chef', label: 'Chef Hat', icon: ChefHat },
                    { id: 'soup', label: 'Gourmet Bowl', icon: Soup },
                    { id: 'cup', label: 'Cozy Cup', icon: CupSoda },
                    { id: 'star', label: 'Royal Star', icon: Star },
                  ].map((preset) => {
                    const PresetIcon = preset.icon;
                    const isSelected = 
                      settings.logo_url === preset.id || 
                      (!settings.logo_url && preset.id === 'default') ||
                      (settings.logo_url === 'crown' && preset.id === 'default');
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSettings({ ...settings, logo_url: preset.id });
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('qrestro_logo_changed', { detail: preset.id }));
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer select-none h-20 ${
                          isSelected
                            ? 'border-gold-500 bg-amber-50/30 text-gold-600 ring-2 ring-gold-400 shadow-sm font-semibold'
                            : 'border-cream-200 bg-white text-ink-500 hover:border-cream-300 hover:text-ink-700'
                        }`}
                      >
                        <PresetIcon className="w-5 h-5 mb-1.5" />
                        <span className="text-[10px] tracking-tight">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Image Upload Option */}
                <div className="bg-cream-50/50 p-5 rounded-xl border border-cream-200/60 space-y-4">
                  <div className="flex items-center justify-between border-b border-cream-100 pb-3">
                    <span className="text-xs font-bold text-ink-750 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-gold-600" />
                      Custom Branding Logo
                    </span>
                    {settings.logo_url && !['default', 'crown', 'chef', 'soup', 'cup', 'star'].includes(settings.logo_url) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSettings({ ...settings, logo_url: 'default' });
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('qrestro_logo_changed', { detail: 'default' }));
                          }
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" /> Clear Custom
                      </button>
                    )}
                  </div>

                  {/* Upload Area */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              const base64Url = reader.result;
                              setSettings({ ...settings, logo_url: base64Url });
                              if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('qrestro_logo_changed', { detail: base64Url }));
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="restaurant-logo-upload"
                    />

                    {settings.logo_url && !['default', 'crown', 'chef', 'soup', 'cup', 'star'].includes(settings.logo_url) ? (
                      /* Custom Image uploaded preview */
                      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-cream-200 shadow-sm animate-scale-in">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-cream-200 flex-shrink-0 bg-stone-50 flex items-center justify-center">
                          <img
                            src={settings.logo_url}
                            className="w-full h-full object-cover"
                            alt="Uploaded Logo Preview"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-ink-900 truncate">Custom logo loaded</p>
                          <p className="text-[10px] text-ink-450 mt-1">Stored as dynamic local asset</p>
                          <label
                            htmlFor="restaurant-logo-upload"
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gold-600 hover:text-gold-700 mt-2 cursor-pointer transition-colors"
                          >
                            <Upload className="w-3 h-3" /> Upload New Image
                          </label>
                        </div>
                      </div>
                    ) : (
                      /* Drag-and-drop placeholder visual card */
                      <label
                        htmlFor="restaurant-logo-upload"
                        className="flex flex-col items-center justify-center p-6 bg-white hover:bg-cream-50/20 border-2 border-dashed border-cream-250 hover:border-gold-400 rounded-xl cursor-pointer transition-all duration-300 group text-center"
                      >
                        <div className="w-10 h-10 rounded-full bg-cream-50 group-hover:bg-gold-500/10 flex items-center justify-center text-ink-400 group-hover:text-gold-600 transition-colors duration-300 mb-3 shadow-inner">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-ink-800">Upload your own logo image</p>
                        <p className="text-[10px] text-ink-450 mt-1 leading-normal">Drag and drop file, or browse from device<br />(Supports PNG, JPG, WebP)</p>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Description</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  className="input-field resize-none h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gold-500" /> Phone Numbers
                    </span>
                    <button
                      type="button"
                      onClick={addPhoneNumber}
                      className="text-[11px] font-bold text-gold-600 hover:text-gold-700 flex items-center gap-0.5 transition-colors cursor-pointer focus:outline-none"
                    >
                      + Add Phone
                    </button>
                  </label>
                  <div className="space-y-2">
                    {phoneNumbers.map((phone, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 animate-scale-in">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => handlePhoneChange(idx, e.target.value)}
                          className="input-field flex-1"
                          placeholder={`Phone number ${idx + 1}`}
                        />
                        {phoneNumbers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhoneNumber(idx)}
                            className="p-2.5 rounded-xl border border-cream-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-ink-400 hover:text-rose-500 transition-all cursor-pointer focus:outline-none flex-shrink-0"
                            title="Remove phone number"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gold-500" /> Restaurant Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="input-field"
                    placeholder="contact@thegoldenplate.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gold-500" /> Address
                </label>
                <textarea
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="input-field resize-none h-16"
                />
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <>
              {/* Taxation & Billing Card */}
              <div className="card space-y-6 animate-scale-in">
              <h2 className="font-heading text-xl font-semibold text-ink-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-gold-500" /> Taxation & Billing
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="input-field"
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">CGST Rate (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="50"
                    value={settings.cgst_rate === 0 ? '' : settings.cgst_rate}
                    onChange={(e) => setSettings({ ...settings, cgst_rate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">SGST Rate (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="50"
                    value={settings.sgst_rate === 0 ? '' : settings.sgst_rate}
                    onChange={(e) => setSettings({ ...settings, sgst_rate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Service Charge Type</label>
                  <select
                    value={settings.service_charge_type}
                    onChange={(e) => setSettings({ ...settings, service_charge_type: e.target.value as 'percent' | 'fixed' })}
                    className="input-field"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ({settings.currency || '₹'})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Service Charge {settings.service_charge_type === 'percent' ? '(%)' : `(${settings.currency || '₹'})`}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={settings.service_charge_rate === 0 ? '' : settings.service_charge_rate}
                    onChange={(e) => setSettings({ ...settings, service_charge_rate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>

            {/* UPI & Digital Payments Card */}
            <div className="card space-y-6 animate-scale-in mt-6">
              <h2 className="font-heading text-xl font-semibold text-ink-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-gold-500" /> UPI & QR Payments
              </h2>
              <p className="text-xs text-ink-400 -mt-3">Configure your restaurant&apos;s UPI ID and static payment QR code for digital billing.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={settings.upi_id}
                    onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                    className="input-field font-mono"
                    placeholder="e.g. merchant@upi or restaurantname@okaxis"
                  />
                  <p className="text-[10px] text-ink-400 mt-1">
                    Enables dynamic QR code generation with exact bill amounts and mobile deep-linking.
                  </p>
                </div>

                {/* Payment QR Code Uploader */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-cream-100 pb-2">
                    <span className="text-xs font-bold text-ink-750 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-gold-600" />
                      Static QR Code Image
                    </span>
                    {settings.payment_qr_url && (
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, payment_qr_url: '' })}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" /> Clear Image
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleQrUpload(file);
                        }
                      }}
                      className="hidden"
                      id="restaurant-payment-qr-upload"
                    />

                    {settings.payment_qr_url ? (
                      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-cream-200 shadow-sm animate-scale-in">
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-cream-200 flex-shrink-0 bg-stone-50 flex items-center justify-center">
                          <img
                            src={settings.payment_qr_url}
                            className="w-full h-full object-contain"
                            alt="Uploaded Payment QR Preview"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-ink-900 font-sans">Custom payment QR loaded</p>
                          <p className="text-[10px] text-ink-450 mt-1 font-sans">This will display as a checkout option for your guests.</p>
                          <label
                            htmlFor="restaurant-payment-qr-upload"
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gold-600 hover:text-gold-700 mt-2 cursor-pointer transition-colors"
                          >
                            <Upload className="w-3 h-3" /> Upload New QR
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="restaurant-payment-qr-upload"
                        className="flex flex-col items-center justify-center p-6 bg-white hover:bg-cream-50/20 border-2 border-dashed border-cream-250 hover:border-gold-400 rounded-xl cursor-pointer transition-all duration-300 group text-center"
                      >
                        <div className="w-10 h-10 rounded-full bg-cream-50 group-hover:bg-gold-500/10 flex items-center justify-center text-ink-400 group-hover:text-gold-600 transition-colors duration-300 mb-3 shadow-inner">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-ink-800">Upload static payment QR code</p>
                        <p className="text-[10px] text-ink-450 mt-1 leading-normal">Drag and drop file, or browse from device<br />(Supports PNG, JPG, WebP)</p>
                      </label>
                    )}

                    {qrScanResult && (
                      <div className={cn(
                        "mt-3 p-3 rounded-xl border text-[11px] font-semibold flex items-center gap-2 animate-fade-in",
                        qrScanResult.success 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        <span className="text-sm">{qrScanResult.success ? "✨" : "⚠️"}</span>
                        <span>{qrScanResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

          {activeTab === 'security' && (
            <>
              {/* Admin Profile Card */}
              <div className="card space-y-6 animate-scale-in">
                <h2 className="font-heading text-xl font-semibold text-ink-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-gold-500" /> Admin / Manager Profile
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Admin/Manager Name</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="input-field"
                      placeholder="Owner / Manager Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      className="input-field"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* Login Credentials Card */}
              <div className="card space-y-6 animate-scale-in">
                <h2 className="font-heading text-xl font-semibold text-ink-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-gold-500" /> Login Credentials
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Login Email / ID</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAdminEmail(val);
                        if (settings.chef_use_admin_creds) {
                          setSettings(prev => ({ ...prev, chef_email: val }));
                        }
                      }}
                      className="input-field"
                      placeholder="admin@qrestro.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Login Password</label>
                    <input
                      type="text"
                      value={adminPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAdminPassword(val);
                        if (settings.chef_use_admin_creds) {
                          setSettings(prev => ({ ...prev, chef_password: val }));
                        }
                      }}
                      className="input-field font-mono"
                      placeholder="adminpassword"
                    />
                  </div>
                </div>
              </div>

              {/* Kitchen Screen Access Settings */}
              <div className="card space-y-6 animate-scale-in">
                <h2 className="font-heading text-xl font-semibold text-ink-900 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-gold-500" /> Kitchen Screen Credentials
                </h2>

                <div className="flex items-center gap-3 p-3 bg-cream-100/40 border border-cream-200/50 rounded-xl">
                  <input
                    type="checkbox"
                    id="chef_use_admin_creds"
                    checked={settings.chef_use_admin_creds}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSettings({
                        ...settings,
                        chef_use_admin_creds: checked,
                        chef_email: checked ? adminEmail : settings.chef_email,
                        chef_password: checked ? adminPassword : settings.chef_password
                      });
                    }}
                    className="w-4 h-4 rounded text-gold-600 focus:ring-gold-500 border-cream-300 cursor-pointer"
                  />
                  <label htmlFor="chef_use_admin_creds" className="text-sm font-medium text-ink-700 cursor-pointer select-none">
                    Use the same email ID & password as your restaurant dashboard
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Kitchen login Email / ID</label>
                    <input
                      type="email"
                      value={settings.chef_use_admin_creds ? adminEmail : settings.chef_email}
                      onChange={(e) => !settings.chef_use_admin_creds && setSettings({ ...settings, chef_email: e.target.value })}
                      className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="chef@qrestro.com"
                      disabled={settings.chef_use_admin_creds}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-ink-700">Kitchen password</label>
                      {!settings.chef_use_admin_creds && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Are you sure you want to reset the Kitchen Screen password to default ("chefpassword")?')) {
                              setSettings({ ...settings, chef_password: 'chefpassword' });
                            }
                          }}
                          className="text-xs font-bold text-gold-600 hover:text-gold-700 underline cursor-pointer no-print focus:outline-none"
                        >
                          Reset Password
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={settings.chef_use_admin_creds ? adminPassword : settings.chef_password}
                      onChange={(e) => !settings.chef_use_admin_creds && setSettings({ ...settings, chef_password: e.target.value })}
                      className="input-field font-mono text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="chefpassword"
                      disabled={settings.chef_use_admin_creds}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Plan Overview Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plan Status Card */}
                <div className="md:col-span-2 card space-y-6 animate-scale-in">
                  <h2 className="font-heading text-xl font-semibold text-ink-900 flex items-center gap-2">
                    {subscription.plan === 'premium' ? (
                      <>
                        <Crown className="w-5 h-5 text-gold-500" /> Premium Active
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-gold-500" /> Free Trial Active
                      </>
                    )}
                  </h2>

                  {subscription.plan === 'trial' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink-700">Days Remaining</p>
                          <p className="text-xs text-ink-450 mt-0.5">Your trial ends 7 days after signup</p>
                        </div>
                        <span className="text-2xl font-extrabold text-[#B88A52] font-heading">
                          {subscription.daysRemaining} / 7
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-cream-100 h-2.5 rounded-full overflow-hidden border border-cream-200">
                        <div 
                          className="bg-[#B88A52] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(subscription.daysRemaining / 7) * 100}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-cream-50/50 p-4 rounded-xl border border-cream-200/50 text-xs">
                        <div>
                          <span className="text-ink-450 block">Trial Started On</span>
                          <span className="font-bold text-ink-800 mt-0.5 block">{subscription.trialStartDate || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-ink-450 block">Monthly Price After Trial</span>
                          <span className="font-bold text-ink-800 mt-0.5 block">₹200.00 / month</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => setIsUpgradeModalOpen(true)}
                          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                        >
                          <Sparkles className="w-4 h-4" /> Subscribe to Premium Plan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-[#1C1A17] to-[#2E2923] border border-[#B88A52]/20 rounded-2xl p-5 text-white flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88A52] bg-[#B88A52]/10 border border-[#B88A52]/20 px-2 py-0.5 rounded-md">
                            Pro License
                          </span>
                          <h3 className="font-heading text-lg font-bold text-white mt-1">₹200.00 / month</h3>
                          <p className="text-xs text-[#A69B8E]">Automatically renews every month</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-[#B88A52]/10 border border-[#B88A52]/30 flex items-center justify-center text-[#EAD0A8] animate-pulse">
                          <Crown className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-cream-50/50 p-4 rounded-xl border border-cream-200/50 text-xs">
                        <div>
                          <span className="text-ink-450 block">Last Payment Date</span>
                          <span className="font-bold text-ink-800 mt-0.5 block">{subscription.subscribedDate || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-ink-450 block">Next Invoice Date</span>
                          <span className="font-bold text-ink-800 mt-0.5 block">
                            {subscription.subscribedDate ? (
                              (() => {
                                const d = new Date(subscription.subscribedDate);
                                d.setDate(d.getDate() + 30);
                                return d.toISOString().split('T')[0];
                              })()
                            ) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 flex-1 sm:flex-none">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Billing active & secure</span>
                        </div>
                        <button
                          onClick={handleCancelSubscription}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors py-2 px-3 rounded-xl border border-rose-100 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center gap-1 cursor-pointer focus:outline-none"
                        >
                          Cancel Subscription
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Benefits / FAQ Card */}
                <div className="card space-y-4 animate-scale-in">
                  <h3 className="font-heading text-base font-bold text-ink-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-gold-500" /> Premium Benefits
                  </h3>
                  <p className="text-xs text-ink-500 leading-normal">
                    Subscribe to QRestro Premium for ₹200/month to get professional tools for your restaurant:
                  </p>
                  
                  <ul className="space-y-3 pt-2">
                    {[
                      "Dynamic QR codes with exact bill amounts",
                      "Full digital billing & instant checkout link",
                      "Kitchen Cook Screen credentials access",
                      "Complete table order history",
                      "Comprehensive finance & order analytics",
                      "Unlimited PDF menu & receipts export"
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-ink-700">
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        </div>
                        <span className="leading-snug">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Checkout Modal */}
          {isUpgradeModalOpen && (
            <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in no-print">
              <div className="bg-white border border-[#EAE6DF] shadow-2xl rounded-2xl max-w-md w-full p-6 space-y-6 animate-scale-in">
                {paymentStep === 'idle' ? (
                  <>
                    <div className="flex items-center justify-between border-b border-cream-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#B88A52]/10 border border-[#B88A52]/20 flex items-center justify-center text-[#B88A52]">
                          <CreditCard className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-ink-900 text-base">Subscribe to Premium</h3>
                          <p className="text-[10px] text-ink-450 mt-0.5">₹200.00 billed monthly</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setIsUpgradeModalOpen(false);
                          setCheckoutError(null);
                        }} 
                        className="p-1 rounded-lg hover:bg-cream-50 text-ink-400 hover:text-ink-600 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {checkoutError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2 animate-shake">
                        <span>⚠️</span>
                        <span>{checkoutError}</span>
                      </div>
                    )}

                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-ink-700 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={checkoutCardName}
                          onChange={(e) => setCheckoutCardName(e.target.value)}
                          placeholder="e.g. Virat Kohli"
                          className="input-field text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink-700 mb-1">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={checkoutCardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            placeholder="0000 0000 0000 0000"
                            className="input-field text-sm font-mono tracking-wider pl-10"
                          />
                          <CreditCard className="w-4.5 h-4.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-ink-700 mb-1">Expiry Date</label>
                          <input
                            type="text"
                            required
                            value={checkoutCardExpiry}
                            onChange={(e) => handleExpiryChange(e.target.value)}
                            placeholder="MM/YY"
                            className="input-field text-sm font-mono tracking-wider text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-ink-700 mb-1">CVV / CVC</label>
                          <input
                            type="password"
                            required
                            value={checkoutCardCvv}
                            onChange={(e) => handleCvvChange(e.target.value)}
                            placeholder="•••"
                            className="input-field text-sm font-mono tracking-widest text-center"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3 bg-cream-50 rounded-xl border border-cream-100 text-[10px] text-ink-450">
                        <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                        <span>Secure checkout. QRestro simulates bank-level encryption & sandbox authorizations for demo purposes.</span>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUpgradeModalOpen(false);
                            setCheckoutError(null);
                          }}
                          className="btn-secondary flex-1 py-2.5 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-4.5 h-4.5" />
                          <span>Pay ₹200.00</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                    {paymentStep === 'success' ? (
                      <div className="flex flex-col items-center space-y-4 animate-scale-in">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shadow-md">
                          <Check className="w-8 h-8 stroke-[3.5]" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-ink-900 text-lg">Payment Successful!</h3>
                          <p className="text-xs text-emerald-600 font-bold mt-1">Premium plan activated successfully</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 border-3 border-cream-200 border-t-[#B88A52] rounded-full animate-spin" />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-ink-800">
                            {paymentStep === 'initiating' && "Initiating secure transaction..."}
                            {paymentStep === 'verifying' && "Verifying card credentials..."}
                            {paymentStep === 'authorizing' && "Authorizing payment (₹200.00)..."}
                            {paymentStep === 'activating' && "Activating Premium access..."}
                          </p>
                          <p className="text-[10px] text-ink-440">Please do not refresh or close the page</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unified Save Action */}
          {activeTab !== 'subscription' && (
            <div className="flex justify-end pt-4 border-t border-cream-100">
              <button onClick={handleSave} className="btn-primary w-full md:w-auto">
                <Save className="w-4 h-4" /> Save All Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
