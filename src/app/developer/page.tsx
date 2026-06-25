'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Server, ShieldAlert, Plus, Edit2, Trash2, Mail, Phone, MapPin, 
  Search, X, Check, Eye, Activity, FileText, ToggleLeft, ToggleRight, 
  Sparkles, RefreshCw, Key, ShieldCheck, ExternalLink, Globe, Lock, Clock
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface RegisteredRestaurant {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  phone: string;
  address: string;
  currency: string;
  is_active: boolean;
  created_at: string;
}

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  created_at: string;
}

const DEFAULT_RESTAURANTS: RegisteredRestaurant[] = [
  {
    id: 'rest-1',
    name: 'The Golden Plate',
    slug: 'the-golden-plate',
    owner_email: 'supportqrestro@gmail.com',
    phone: '+91 82523 73767',
    address: '123 Luxury Avenue, Connaught Place, New Delhi',
    currency: '₹',
    is_active: true,
    created_at: '2026-05-10T12:00:00.000Z'
  },
  {
    id: 'rest-2',
    name: 'Tandoori Nights',
    slug: 'tandoori-nights',
    owner_email: 'owner.tandoori@gmail.com',
    phone: '+91 99887 76655',
    address: 'Sector 18, Noida, Uttar Pradesh',
    currency: '₹',
    is_active: true,
    created_at: '2026-05-24T18:30:00.000Z'
  },
  {
    id: 'rest-3',
    name: 'Sushi Samba',
    slug: 'sushi-samba',
    owner_email: 'owner.sushi@gmail.com',
    phone: '+91 88776 65544',
    address: 'Bandra West, Mumbai, Maharashtra',
    currency: '₹',
    is_active: false,
    created_at: '2026-06-02T11:15:00.000Z'
  },
  {
    id: 'rest-4',
    name: 'Bistro Blend',
    slug: 'bistro-blend',
    owner_email: 'owner.bistro@gmail.com',
    phone: '+91 77665 54433',
    address: 'Indiranagar, Bangalore, Karnataka',
    currency: '₹',
    is_active: true,
    created_at: '2026-06-12T09:45:00.000Z'
  }
];

const DEFAULT_INQUIRIES: ContactInquiry[] = [
  {
    id: 'inq-1',
    name: 'Amit Sharma',
    email: 'amit.sharma@example.com',
    subject: 'Pricing for multi-location restaurants',
    message: 'Hi, I run a chain of 3 restaurants in Mumbai. Can we get a custom pricing package for QRestro? I would love to talk to your sales team.',
    status: 'pending',
    created_at: '2026-06-20T10:15:00.000Z'
  },
  {
    id: 'inq-2',
    name: 'Sarah D\'Souza',
    email: 'sarah.dsouza@bistro.com',
    subject: 'Integration with existing POS system',
    message: 'Does QRestro integrate with Petpooja POS? We are currently using it for billing and want to sync our menu items directly.',
    status: 'resolved',
    created_at: '2026-06-19T14:30:00.000Z'
  }
];

export default function DeveloperConsolePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPasskey, setLoginPasskey] = useState('');
  const [authError, setAuthError] = useState('');

  // OTP Login States
  const [loginMode, setLoginMode] = useState<'passkey' | 'otp'>('passkey');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  // OTP Cooldown Timer Effect
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Data lists
  const [restaurants, setRestaurants] = useState<RegisteredRestaurant[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);

  // Search & Filtering
  const [activeTab, setActiveTab] = useState<'restaurants' | 'inquiries'>('restaurants');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modals & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RegisteredRestaurant | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    slug: '',
    owner_email: '',
    phone: '',
    address: '',
    currency: '₹',
    is_active: true
  });

  // Seeding and Initial Loading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Restaurants seeding
      const storedRests = localStorage.getItem('qrestro_registered_restaurants');
      if (storedRests) {
        try {
          setRestaurants(JSON.parse(storedRests));
        } catch {
          setRestaurants(DEFAULT_RESTAURANTS);
        }
      } else {
        localStorage.setItem('qrestro_registered_restaurants', JSON.stringify(DEFAULT_RESTAURANTS));
        setRestaurants(DEFAULT_RESTAURANTS);
      }

      // 2. Inquiries seeding
      const storedInqs = localStorage.getItem('qrestro_contact_inquiries');
      if (storedInqs) {
        try {
          setInquiries(JSON.parse(storedInqs));
        } catch {
          setInquiries(DEFAULT_INQUIRIES);
        }
      } else {
        localStorage.setItem('qrestro_contact_inquiries', JSON.stringify(DEFAULT_INQUIRIES));
        setInquiries(DEFAULT_INQUIRIES);
      }

      // 3. Auto-login check (if already verified in session)
      const isAuth = sessionStorage.getItem('qrestro_dev_authenticated') === 'true';
      if (isAuth) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Save actions
  const saveRestaurantsList = (list: RegisteredRestaurant[]) => {
    setRestaurants(list);
    localStorage.setItem('qrestro_registered_restaurants', JSON.stringify(list));
  };

  const saveInquiriesList = (list: ContactInquiry[]) => {
    setInquiries(list);
    localStorage.setItem('qrestro_contact_inquiries', JSON.stringify(list));
  };

  // OTP Send Handler
  const handleSendOtp = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail) {
      setAuthError('Please enter your administrator email first.');
      return;
    }

    setAuthError('');
    setOtpSuccessMsg('');
    setIsSendingOtp(true);

    try {
      const response = await fetch('/api/developer/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setOtpSent(true);
        setOtpToken(result.token);
        setOtpCountdown(60); // 60-second cooldown
        
        let successText = 'A verification code has been sent to your administrator email.';
        if (result.warning) {
          successText += ` (${result.warning})`;
        }
        setOtpSuccessMsg(successText);
      } else {
        setAuthError(result.error || 'Failed to send verification code. Please check your email and try again.');
      }
    } catch {
      setAuthError('Unable to connect to the authentication server.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Auth Submit Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setOtpSuccessMsg('');

    try {
      const bodyPayload = loginMode === 'otp'
        ? { email: loginEmail, loginMode: 'otp', otp: otpCode, token: otpToken }
        : { email: loginEmail, loginMode: 'passkey', passkey: loginPasskey };

      const response = await fetch('/api/developer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('qrestro_dev_authenticated', 'true');
      } else {
        setAuthError(result.error || (loginMode === 'otp' ? 'Invalid or expired verification code.' : 'Invalid administrator email or passkey.'));
      }
    } catch {
      setAuthError('Unable to connect to authentication server.');
    }
  };



  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('qrestro_dev_authenticated');
  };

  // Toggle restaurant active status
  const handleToggleActive = (id: string) => {
    const updated = restaurants.map(r => 
      r.id === id ? { ...r, is_active: !r.is_active } : r
    );
    saveRestaurantsList(updated);
  };

  // Save Restaurant (Create or Edit)
  const handleSaveRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.slug.trim() || !formState.owner_email.trim()) return;

    // Check slug uniqueness
    const slugExists = restaurants.some(r => 
      r.slug === formState.slug && (!editingRestaurant || editingRestaurant.id !== r.id)
    );
    if (slugExists) {
      alert('This restaurant slug is already registered.');
      return;
    }

    if (editingRestaurant) {
      const updated = restaurants.map(r => 
        r.id === editingRestaurant.id 
          ? { 
              ...r, 
              name: formState.name,
              slug: formState.slug,
              owner_email: formState.owner_email,
              phone: formState.phone,
              address: formState.address,
              currency: formState.currency,
              is_active: formState.is_active
            }
          : r
      );
      saveRestaurantsList(updated);
    } else {
      const newRest: RegisteredRestaurant = {
        id: `rest-${Date.now()}`,
        name: formState.name,
        slug: formState.slug,
        owner_email: formState.owner_email,
        phone: formState.phone,
        address: formState.address,
        currency: formState.currency,
        is_active: formState.is_active,
        created_at: new Date().toISOString()
      };
      saveRestaurantsList([...restaurants, newRest]);
    }

    setIsModalOpen(false);
    setEditingRestaurant(null);
  };

  // Open edit modal
  const handleEditClick = (rest: RegisteredRestaurant) => {
    setEditingRestaurant(rest);
    setFormState({
      name: rest.name,
      slug: rest.slug,
      owner_email: rest.owner_email,
      phone: rest.phone,
      address: rest.address,
      currency: rest.currency,
      is_active: rest.is_active
    });
    setIsModalOpen(true);
  };

  // Delete restaurant
  const handleDeleteRestaurant = (id: string) => {
    if (confirm('Are you sure you want to delete this restaurant from the platform? This cannot be undone.')) {
      const updated = restaurants.filter(r => r.id !== id);
      saveRestaurantsList(updated);
    }
  };

  // Toggle Inquiry Status
  const handleToggleInquiryStatus = (id: string) => {
    const updated = inquiries.map(i => 
      i.id === id ? { ...i, status: (i.status === 'pending' ? 'resolved' : 'pending') as any } : i
    );
    saveInquiriesList(updated);
  };

  // Delete Inquiry
  const handleDeleteInquiry = (id: string) => {
    if (confirm('Delete this user message from logs?')) {
      const updated = inquiries.filter(i => i.id !== id);
      saveInquiriesList(updated);
    }
  };

  // Filtering lists
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        r.name.toLowerCase().includes(query) ||
        r.slug.toLowerCase().includes(query) ||
        r.owner_email.toLowerCase().includes(query);
      
      const matchesFilter = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && r.is_active) ||
        (statusFilter === 'suspended' && !r.is_active);

      return matchesSearch && matchesFilter;
    });
  }, [restaurants, searchQuery, statusFilter]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter(i => {
      const query = searchQuery.toLowerCase();
      return (
        i.name.toLowerCase().includes(query) ||
        i.email.toLowerCase().includes(query) ||
        i.subject.toLowerCase().includes(query) ||
        i.message.toLowerCase().includes(query)
      );
    });
  }, [inquiries, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      totalRestaurants: restaurants.length,
      activeRestaurants: restaurants.filter(r => r.is_active).length,
      suspendedRestaurants: restaurants.filter(r => !r.is_active).length,
      pendingInquiries: inquiries.filter(i => i.status === 'pending').length
    };
  }, [restaurants, inquiries]);

  // Render Login gateway if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden font-body">
        {/* Futuristic glowing backdrop */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c8913a]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#121215] border border-white/[0.06] rounded-3xl p-8 shadow-2xl relative z-10 animate-scale-in">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-[#B88A52] to-[#8C6028] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-500/10">
              <Server className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-2xl font-black text-white">QRestro Developer Console</h1>
            <p className="text-xs text-zinc-400 mt-2">Access platform analytics & tenant management</p>
          </div>

          {/* Login Mode Tabs */}
          <div className="flex border border-white/[0.05] mb-6 p-1 bg-white/[0.01] rounded-xl">
            <button
              onClick={() => {
                setLoginMode('passkey');
                setAuthError('');
                setOtpSuccessMsg('');
              }}
              type="button"
              className={cn(
                "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                loginMode === 'passkey'
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Key className="w-3.5 h-3.5" /> Passkey
            </button>
            <button
              onClick={() => {
                setLoginMode('otp');
                setAuthError('');
                setOtpSuccessMsg('');
              }}
              type="button"
              className={cn(
                "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                loginMode === 'otp'
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Mail className="w-3.5 h-3.5" /> Email OTP
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Admin Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@qrestro.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={loginMode === 'otp' && otpSent}
                className="w-full text-xs px-3.5 py-3 border border-white/[0.08] focus:border-[#c8913a] focus:ring-1 focus:ring-[#c8913a] rounded-xl outline-none text-white placeholder-zinc-500 bg-white/[0.02] font-semibold disabled:opacity-50"
              />
            </div>

            {loginMode === 'passkey' ? (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Passkey
                </label>
                <input
                  type="password"
                  required
                  placeholder="•••• •••• •••• ••••"
                  value={loginPasskey}
                  onChange={(e) => setLoginPasskey(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 border border-white/[0.08] focus:border-[#c8913a] focus:ring-1 focus:ring-[#c8913a] rounded-xl outline-none text-white placeholder-zinc-500 bg-white/[0.02] font-semibold tracking-widest"
                />
              </div>
            ) : (
              otpSent && (
                <div className="animate-fade-in">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Verification Code
                    </label>
                    <button
                      type="button"
                      disabled={otpCountdown > 0 || isSendingOtp}
                      onClick={() => handleSendOtp()}
                      className="text-[10px] text-[#c8913a] hover:text-[#b07e2c] font-bold uppercase disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                    >
                      {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend Code'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-lg tracking-[0.5em] font-mono px-3.5 py-2.5 border border-white/[0.08] focus:border-[#c8913a] focus:ring-1 focus:ring-[#c8913a] rounded-xl outline-none text-white placeholder-zinc-500 bg-white/[0.02] font-bold"
                  />
                </div>
              )
            )}

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {otpSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{otpSuccessMsg}</span>
              </div>
            )}

            {loginMode === 'otp' && !otpSent ? (
              <button
                type="button"
                disabled={isSendingOtp}
                onClick={() => handleSendOtp()}
                className="w-full py-3 bg-[#c8913a] hover:bg-[#b07e2c] text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-gold-500/10 mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSendingOtp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            ) : (
              <button
                type="submit"
                className="w-full py-3 bg-[#c8913a] hover:bg-[#b07e2c] text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-gold-500/10 mt-6"
              >
                {loginMode === 'otp' ? 'Verify & Sign In' : 'Sign In to Console'}
              </button>
            )}
          </form>

          <p className="text-center text-[10px] text-zinc-500 font-semibold mt-8 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Platform-encrypted Super Admin Gateway
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-body">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0c0c0e]/80 backdrop-blur-md border-b border-white/[0.06] py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#B88A52] to-[#8C6028] rounded-xl flex items-center justify-center">
            <Server className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-black text-white flex items-center gap-2">
              QRestro Developer Console <span className="text-[10px] bg-gold-500/20 text-[#c8913a] font-extrabold px-1.5 py-0.5 rounded border border-[#c8913a]/30 uppercase tracking-widest">Console</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium">Global platform node & tenant management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-[#c8913a] font-bold transition-colors flex items-center gap-1.5">
            <Globe className="w-4 h-4" /> Go to Restaurant App
          </Link>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/30 text-xs font-bold rounded-lg transition-colors cursor-pointer text-zinc-300 hover:text-rose-400"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        
        {/* Metrics Section */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Registered Restaurants', val: stats.totalRestaurants, desc: 'Registered restaurant accounts', color: 'border-gold-500/20 bg-gold-500/[0.01]' },
            { label: 'Active Restaurants', val: stats.activeRestaurants, desc: 'Diners can scan & order', color: 'border-emerald-500/20 bg-emerald-500/[0.01]' },
            { label: 'Suspended Tenancies', val: stats.suspendedRestaurants, desc: 'Temporarily disabled', color: 'border-rose-500/20 bg-rose-500/[0.01]' },
            { label: 'Unresolved Inquiries', val: stats.pendingInquiries, desc: 'Landing contact form logs', color: 'border-sky-500/20 bg-sky-500/[0.01]' }
          ].map((m, idx) => (
            <div key={idx} className={cn("border rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[6.5rem] bg-[#121215]/50 backdrop-blur-md relative overflow-hidden group hover:border-[#c8913a]/30 transition-colors", m.color)}>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{m.label}</span>
                <span className="text-3xl font-black text-white font-mono mt-2 block">{m.val}</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium leading-none mt-3">{m.desc}</span>
            </div>
          ))}
        </section>

        {/* Action Controls & Navigation */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121215]/80 border border-white/[0.06] rounded-2xl p-4">
          {/* Menu tab selection */}
          <div className="flex bg-[#09090b] border border-white/[0.06] rounded-xl p-1 w-full sm:w-auto">
            {[
              { id: 'restaurants', label: 'Registered Restaurants', icon: Server },
              { id: 'inquiries', label: 'User Inquiries', icon: FileText }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSearchQuery('');
                  }}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-initial",
                    activeTab === tab.id
                      ? "bg-[#c8913a] text-white shadow-md shadow-gold-500/10 scale-102"
                      : "text-zinc-400 hover:bg-white/[0.02]"
                  )}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder={activeTab === 'restaurants' ? "Search restaurants..." : "Search inquiries..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-white/[0.08] focus:border-[#c8913a] focus:ring-1 focus:ring-[#c8913a] rounded-xl outline-none text-xs text-white font-semibold bg-[#09090b]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-rose-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Render add restaurant button only in restaurant tab */}
            {activeTab === 'restaurants' && (
              <button
                onClick={() => {
                  setEditingRestaurant(null);
                  setFormState({
                    name: '',
                    slug: '',
                    owner_email: '',
                    phone: '',
                    address: '',
                    currency: '₹',
                    is_active: true
                  });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#c8913a] hover:bg-[#b07e2c] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-gold-500/10 cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Register Restaurant</span>
              </button>
            )}
          </div>
        </section>

        {/* RESTAURANTS DIRECTORY TAB VIEW */}
        {activeTab === 'restaurants' && (
          <section className="bg-[#121215]/50 border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
            {filteredRestaurants.length === 0 ? (
              <div className="p-16 text-center">
                <ShieldAlert className="w-12 h-12 text-[#c8913a] mx-auto opacity-40 mb-3" />
                <h3 className="text-sm font-bold text-white">No Restaurants Registered</h3>
                <p className="text-xs text-zinc-500 mt-1.5 max-w-xs mx-auto">
                  There are no restaurant accounts corresponding to your filter or search query. Click register to add one.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold text-zinc-300">
                  <thead>
                    <tr className="bg-[#0c0c0e]/60 border-b border-white/[0.06] text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                      <th className="p-4 pl-6">Restaurant Profile</th>
                      <th className="p-4">Owner Account</th>
                      <th className="p-4">Telephone</th>
                      <th className="p-4">Date Registered</th>
                      <th className="p-4 text-center">Service Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredRestaurants.map(rest => (
                      <tr key={rest.id} className="hover:bg-white/[0.01] transition-colors">
                        {/* Name & Slug */}
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center text-xs font-black font-heading text-[#c8913a] border border-[#c8913a]/20">
                              {rest.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-white truncate max-w-[150px]">{rest.name}</h4>
                              <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                                slug: <strong className="text-zinc-400 font-bold">{rest.slug}</strong>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Owner Email */}
                        <td className="p-4 font-mono text-[11px] text-zinc-400">
                          {rest.owner_email}
                        </td>

                        {/* Phone */}
                        <td className="p-4 text-zinc-400 font-mono">
                          {rest.phone || '—'}
                        </td>

                        {/* Date Created */}
                        <td className="p-4 text-zinc-400 font-mono">
                          {new Date(rest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        {/* Toggle Status Switch */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleActive(rest.id)}
                            className="cursor-pointer transition-colors p-1"
                            title={rest.is_active ? 'Click to Suspend Tenancy' : 'Click to Activate Tenancy'}
                          >
                            {rest.is_active ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> ACTIVE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" /> SUSPENDED
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Customer Menu */}
                            <Link
                              href={`/order/${rest.slug}/table-1`}
                              target="_blank"
                              className="p-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Open Customer digital menu view"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            {/* Edit */}
                            <button
                              onClick={() => handleEditClick(rest)}
                              className="p-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-zinc-400 hover:text-[#c8913a] transition-colors cursor-pointer"
                              title="Edit Restaurant Properties"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete (Golden plate demo restaurant cannot be deleted) */}
                            <button
                              onClick={() => handleDeleteRestaurant(rest.id)}
                              disabled={rest.slug === 'the-golden-plate'}
                              className={cn(
                                "p-2 bg-white/[0.02] hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/30 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer",
                                rest.slug === 'the-golden-plate' && "opacity-20 cursor-not-allowed hover:bg-transparent hover:border-transparent hover:text-zinc-400"
                              )}
                              title={rest.slug === 'the-golden-plate' ? 'Demo restaurant cannot be deleted' : 'Delete Restaurant'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* INQUIRIES LIST VIEW */}
        {activeTab === 'inquiries' && (
          <section className="bg-[#121215]/50 border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
            {filteredInquiries.length === 0 ? (
              <div className="p-16 text-center">
                <Mail className="w-12 h-12 text-[#c8913a] mx-auto opacity-40 mb-3" />
                <h3 className="text-sm font-bold text-white">No Contact Inquiries</h3>
                <p className="text-xs text-zinc-500 mt-1.5 max-w-xs mx-auto">
                  There are no logs matching your search terms. Submit a new message via the landing page Contact Form to test.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] p-2">
                {filteredInquiries.map(inq => (
                  <div key={inq.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-white/[0.01] transition-colors rounded-xl border border-transparent hover:border-white/[0.04]">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{inq.name}</span>
                        <a href={`mailto:${inq.email}`} className="text-xs text-[#c8913a] hover:underline font-mono">{inq.email}</a>
                        <span className="text-[10px] text-zinc-500 font-mono ml-auto md:ml-0">
                          {new Date(inq.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wide">Subject: {inq.subject}</h5>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed bg-[#0c0c0e] border border-white/[0.04] p-3 rounded-xl whitespace-pre-wrap font-medium italic">
                          "{inq.message}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center md:flex-col items-end gap-3 shrink-0 self-end md:self-start">
                      {/* Status toggle */}
                      <button
                        onClick={() => handleToggleInquiryStatus(inq.id)}
                        className="cursor-pointer"
                      >
                        {inq.status === 'resolved' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            RESOLVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            PENDING
                          </span>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        {/* Reply via email */}
                        <a
                          href={`mailto:${inq.email}?subject=Re: ${inq.subject}&body=Hi ${inq.name},%0D%0A%0D%0AThank you for reaching out...`}
                          className="p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Draft a response"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-rose-500/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete message log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>

      {/* CREATE & EDIT RESTAURANT DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#121215] border border-white/[0.06] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="bg-[#0c0c0e] border-b border-white/[0.06] p-5 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-black text-white">
                  {editingRestaurant ? 'Modify Restaurant Profile' : 'Register New Restaurant'}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                  {editingRestaurant ? 'Adjust global properties and currency values' : 'Provision a new customer tenancy'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRestaurant} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Restaurant Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Restaurant Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tandoori Nights"
                    value={formState.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormState(prev => ({ 
                        ...prev, 
                        name: val,
                        // auto slug generation for convenience
                        slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
                          ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                          : prev.slug
                      }));
                    }}
                    className="w-full text-xs px-3.5 py-2.5 border border-white/[0.08] focus:border-[#c8913a] focus:ring-1 focus:ring-[#c8913a] rounded-xl outline-none text-white placeholder-zinc-600 bg-white/[0.02] font-semibold"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Unique Slug *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. tandoori-nights"
                    value={formState.slug}
                    onChange={(e) => setFormState(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }))}
                    className="w-full text-xs px-3.5 py-2.5 border border-white/[0.08] focus:border-[#c8913a] focus:ring-1 focus:ring-[#c8913a] rounded-xl outline-none text-white placeholder-zinc-600 bg-white/[0.02] font-semibold font-mono"
                  />
                </div>
              </div>

              {/* Owner Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Owner Account Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. owner.tandoori@gmail.com"
                  value={formState.owner_email}
                  onChange={(e) => setFormState(prev => ({ ...prev, owner_email: e.target.value }))}
                  className="w-full text-xs px-3.5 py-2.5 border border-white/[0.08] focus:border-[#c8913a] focus:ring-1 focus:ring-[#c8913a] rounded-xl outline-none text-white placeholder-zinc-600 bg-white/[0.02] font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Telephone */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Telephone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 99887 76655"
                    value={formState.phone}
                    onChange={(e) => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 border border-white/[0.08] focus:border-[#c8913a] focus:ring-1 focus:ring-[#c8913a] rounded-xl outline-none text-white placeholder-zinc-600 bg-white/[0.02] font-semibold"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Currency Symbol</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹ or $"
                    value={formState.currency}
                    onChange={(e) => setFormState(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 border border-white/[0.08] focus:border-[#c8913a] focus:ring-1 focus:ring-[#c8913a] rounded-xl outline-none text-white placeholder-zinc-600 bg-white/[0.02] font-semibold text-center"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Physical Address</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Connaught Place, New Delhi"
                  value={formState.address}
                  onChange={(e) => setFormState(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full text-xs px-3.5 py-2 border border-white/[0.08] focus:border-[#c8913a] focus:ring-1 focus:ring-[#c8913a] rounded-xl outline-none text-white placeholder-zinc-600 bg-white/[0.02] font-semibold resize-none"
                />
              </div>

              {/* Is Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-white">Enable Tenant Service</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Toggle restaurant activation status</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormState(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className="text-[#c8913a] transition-all hover:scale-105"
                >
                  {formState.is_active ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 cursor-pointer">
                      <Check className="w-4 h-4" /> ENABLED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 cursor-pointer">
                      <X className="w-4 h-4" /> SUSPENDED
                    </span>
                  )}
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/[0.08] hover:bg-white/5 text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#c8913a] hover:bg-[#b07e2c] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
