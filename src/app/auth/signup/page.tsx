'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Phone, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* ─── QRestro Logo SVG ─── */
const QRestroLogo = ({ size = 44 }: { size?: number }) => (
  <svg
    style={{ width: size, height: size }}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white"
  >
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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpType, setOtpType] = useState<'email' | 'phone'>('email');
  const [devOtp, setDevOtp] = useState('');

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent', textColor: 'text-white/40' };
    
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    switch (score) {
      case 0:
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-400' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-400' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-400' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
      default:
        return { score: 0, label: '', color: 'bg-transparent', textColor: 'text-white/40' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (strength.score < 50) {
      setError('Please choose a stronger password.');
      setLoading(false);
      return;
    }

    // Fallback to Demo Mode if Supabase is not configured yet
    const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co' ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key-here';

    if (isDemoMode) {
      try {
        // Simulate a brief latency for a highly realistic feel
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        // Log in the user in demo mode
        document.cookie = 'qrestro_demo=true;path=/;max-age=86400';
        if (name) {
          document.cookie = `qrestro_demo_name=${encodeURIComponent(name)};path=/;max-age=86400`;
        }

        // Save simulated credentials so they can log back in
        document.cookie = `qrestro_demo_email=${encodeURIComponent(email)};path=/;max-age=86400`;
        if (phone) {
          const fullPhone = `${countryCode}${phone.trim()}`;
          document.cookie = `qrestro_demo_phone=${encodeURIComponent(fullPhone)};path=/;max-age=86400`;
        }
        document.cookie = `qrestro_demo_password=${encodeURIComponent(password)};path=/;max-age=86400`;

        localStorage.setItem('qrestro_demo_fresh_signup', 'true');
        localStorage.setItem('qrestro_demo_restaurant', JSON.stringify({
          name: `${name}'s Restro`,
          chef_use_admin_creds: true,
          chef_password: 'fsilnpkgqklmmdid'
        }));

        // Clear previous demo customizations to ensure a clean start
        try {
          localStorage.removeItem('qrestro_demo_categories');
          localStorage.removeItem('qrestro_demo_items');
          localStorage.removeItem('qrestro_demo_tables');
          localStorage.removeItem('qrestro_demo_orders');
          localStorage.removeItem('qrestro_demo_subscription');
          localStorage.removeItem('qrestro_reviews');
          localStorage.removeItem('qrestro_staff_list');
          localStorage.removeItem('qrestro_payroll');
          localStorage.removeItem('qrestro_operating_expenses');
          localStorage.removeItem('qrestro_purchase_orders');
          localStorage.removeItem('qrestro_wastage_data');
          localStorage.removeItem('qrestro_recipes');
          localStorage.removeItem('qrestro_raw_materials');
        } catch {}
        
        window.location.href = '/dashboard';
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const fullPhone = phone ? `${countryCode}${phone.trim()}` : '';
      const target = otpType === 'email' ? email : fullPhone;
      if (otpType === 'phone' && !phone) {
        setError('Phone number is required for phone verification.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: otpType, target }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to send verification code.');
      } else {
        setOtpToken(data.token);
        if (data.otp) {
          setDevOtp(data.otp);
        } else {
          setDevOtp('');
        }
        setStep('otp');
      }
    } catch {
      setError('Something went wrong sending verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setError('');

    try {
      const fullPhone = phone ? `${countryCode}${phone.trim()}` : '';
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: fullPhone || undefined,
          otp,
          token: otpToken,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Verification failed. Please check the code.');
        setOtpLoading(false);
        return;
      }

      // Automatically sign in with client-side Supabase client
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setOtpLoading(false);
      } else {
        // Clear all previous demo/local storage keys to start fresh
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('qrestro_') || key.startsWith('tabletap_'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
          console.error('Error resetting local storage on signup:', e);
        }

        // Clear all demo cookies for a clean real user session
        document.cookie = 'qrestro_demo=;path=/;max-age=0';
        document.cookie = 'qrestro_demo_name=;path=/;max-age=0';
        document.cookie = 'qrestro_demo_email=;path=/;max-age=0';
        document.cookie = 'qrestro_demo_phone=;path=/;max-age=0';
        document.cookie = 'qrestro_demo_password=;path=/;max-age=0';

        window.location.href = '/dashboard';
      }
    } catch {
      setError('Something went wrong verifying the code. Please try again.');
      setOtpLoading(false);
    }
  };

  const handleDemoLogin = () => {
    document.cookie = 'qrestro_demo=true;path=/;max-age=86400';
    localStorage.setItem('qrestro_demo_fresh_signup', 'false');
    try {
      localStorage.removeItem('qrestro_demo_restaurant');
      localStorage.removeItem('qrestro_demo_categories');
      localStorage.removeItem('qrestro_demo_items');
      localStorage.removeItem('qrestro_demo_tables');
      localStorage.removeItem('qrestro_demo_orders');
      localStorage.removeItem('qrestro_demo_subscription');
      localStorage.removeItem('qrestro_reviews');
      localStorage.removeItem('qrestro_staff_list');
      localStorage.removeItem('qrestro_payroll');
      localStorage.removeItem('qrestro_operating_expenses');
      localStorage.removeItem('qrestro_purchase_orders');
      localStorage.removeItem('qrestro_wastage_data');
      localStorage.removeItem('qrestro_recipes');
      localStorage.removeItem('qrestro_raw_materials');
    } catch {}
    window.location.href = '/dashboard';
  };



  return (
    <div className="min-h-screen bg-[#070708] flex flex-col lg:flex-row relative overflow-hidden">
      {/* ─── Ambient glows ─── */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#B88A52]/6 rounded-full blur-[150px] pointer-events-none" />

      {/* ════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL — Visual Branding                            */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-14 text-white min-h-screen">
        <div className="absolute inset-0 z-0">
          <img src="/auth-bg.png" alt="Cozy restaurant atmosphere" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/75 to-[#070708]/98" />
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#070708] to-transparent" />
        </div>

        {/* Animated gold ring orbs */}
        <div className="absolute top-24 left-1/3 w-44 h-44 border border-[#B88A52]/12 rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 right-16 w-24 h-24 border border-[#B88A52]/18 rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        <div className="absolute bottom-28 left-16 w-36 h-36 border border-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-2/3 left-8 w-14 h-14 border border-[#B88A52]/10 rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.7s' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-14 h-14 bg-gradient-to-br from-[#B88A52] to-[#8C6028] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-[#B88A52]/20">
              <QRestroLogo size={44} />
            </div>
            <span className="font-heading text-2xl font-bold text-white tracking-wide">QRestro</span>
          </Link>
        </div>

        {/* Middle */}
        <div className="relative z-10 max-w-lg my-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#B88A52]/10 border border-[#B88A52]/25 rounded-full">
            <span className="w-1.5 h-1.5 bg-[#B88A52] rounded-full animate-pulse" />
            <span className="text-[#e2b784] text-xs font-semibold tracking-wider uppercase">Join the Future of Dining</span>
          </div>

          <div>
            <h2 className="font-heading text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.05] mb-4">
              Start Your<br />
              <span className="bg-gradient-to-r from-[#B88A52] to-[#e2b784] bg-clip-text text-transparent">
                Journey.
              </span>
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-[#B88A52] to-transparent rounded-full mb-5" />
            <p className="text-white/45 text-base leading-relaxed max-w-sm">
              Set up your menu, print QR codes, and start receiving orders directly from tables in minutes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/20">
          © {new Date().getFullYear()} QRestro. Elegant dining, effortless ordering.
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL — Dark Glassmorphism Form                  */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[48%] flex items-center justify-center px-6 py-12 lg:py-16 relative min-h-screen bg-[#070708]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#B88A52]/4 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-900/8 rounded-full blur-[90px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-8 hover:opacity-85 transition-opacity">
            <div className="w-12 h-12 bg-gradient-to-br from-[#B88A52] to-[#8C6028] rounded-xl flex items-center justify-center shadow-md">
              <QRestroLogo size={36} />
            </div>
            <span className="font-heading text-2xl font-bold text-white tracking-wide">QRestro</span>
          </Link>

          {step === 'otp' ? (
            /* ═════════ OTP Verification State ═════════ */
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-gradient-to-br from-[#B88A52] to-[#8C6028] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#B88A52]/20 animate-pulse">
                  {otpType === 'email' ? (
                    <Mail className="w-10 h-10 text-white" />
                  ) : (
                    <Phone className="w-10 h-10 text-white" />
                  )}
                </div>
                <h1 className="font-heading text-4xl font-bold text-white">Enter Verification Code</h1>
                <p className="text-white/50 text-sm max-w-sm mx-auto leading-relaxed">
                  We've sent a 6-digit verification code to{' '}
                  <span className="text-[#e2b784] font-semibold">
                    {otpType === 'email' ? email : phone}
                  </span>.
                </p>
              </div>

              {/* Development Helper (Visible only if SMS/SMTP falls back and sends OTP key) */}
              {devOtp && (
                <div className="p-4 bg-[#B88A52]/10 border border-[#B88A52]/20 rounded-2xl text-center animate-scale-in">
                  <p className="text-[#e2b784] text-xs font-semibold uppercase tracking-wider mb-2">
                    Development Helper
                  </p>
                  <p className="text-white/50 text-xs mb-3">
                    Gateway is not active. Use the verification code below:
                  </p>
                  <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-6 inline-block font-mono text-xl font-bold tracking-[0.2em] text-[#e2b784] select-all cursor-pointer" title="Click to select all">
                    {devOtp}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-sm flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-rose-400 text-xs font-bold">!</span>
                  </div>
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 text-center">
                    Verification Code
                  </label>
                  <input
                    id="signup-otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-[#B88A52]/60 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] rounded-xl py-4 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder-white/10 outline-none transition-all duration-300"
                    required
                  />
                </div>

                <button
                  id="otp-submit"
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-4 bg-gradient-to-r from-[#B88A52] to-[#a67520] hover:from-[#c59a5c] hover:to-[#b8852c] active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#B88A52]/20 hover:shadow-[#B88A52]/30 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <>
                      Verify & Register
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError('');
                  }}
                  className="text-white/45 hover:text-white font-medium transition-colors"
                >
                  ← Edit Details
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setError('');
                    setOtpLoading(true);
                    try {
                      const target = otpType === 'email' ? email : phone;
                      const res = await fetch('/api/auth/otp/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: otpType, target }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setOtpToken(data.token);
                        alert('A new verification code has been sent!');
                      } else {
                        setError(data.error || 'Failed to resend code.');
                      }
                    } catch {
                      setError('Failed to resend code. Please try again.');
                    } finally {
                      setOtpLoading(false);
                    }
                  }}
                  className="text-[#B88A52] font-bold hover:text-[#c59a5c] transition-colors"
                >
                  Resend Code
                </button>
              </div>
            </div>
          ) : (
            /* ═════════ Sign Up Form State ═════════ */
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#B88A52]" />
                  <span className="text-[#B88A52] text-xs font-bold tracking-widest uppercase">Start Free Trial</span>
                </div>
                <h1 className="font-heading text-4xl font-bold text-white mb-2">Create Account</h1>
                <div className="flex items-center gap-2">
                  <div className="h-[2px] w-12 bg-gradient-to-r from-[#B88A52] to-transparent rounded-full" />
                  <p className="text-white/40 text-sm">No credit card required to get started</p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-sm flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-rose-400 text-xs font-bold">!</span>
                  </div>
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                    Full Name
                  </label>
                  <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                    <User className="absolute left-4 w-4 h-4 text-white/30" />
                    <input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Virat Kohli"
                      className="w-full bg-transparent py-3.5 pl-11 pr-4 text-white placeholder-white/20 border-none outline-none text-sm font-body"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                    Email Address
                  </label>
                  <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                    <Mail className="absolute left-4 w-4 h-4 text-white/30" />
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-transparent py-3.5 pl-11 pr-4 text-white placeholder-white/20 border-none outline-none text-sm font-body"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                    Phone Number
                  </label>
                  <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                    <Phone className="absolute left-4 w-4 h-4 text-white/30" />
                    
                    {/* Country Code Dropdown */}
                    <div className="absolute left-10 w-24 h-full flex items-center">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full bg-transparent text-white/70 border-r border-white/10 pr-7 pl-1 h-full outline-none text-xs font-semibold cursor-pointer appearance-none"
                      >
                        <option value="+91" className="bg-[#070708] text-white">+91 (IN)</option>
                        <option value="+1" className="bg-[#070708] text-white">+1 (US)</option>
                        <option value="+44" className="bg-[#070708] text-white">+44 (UK)</option>
                        <option value="+61" className="bg-[#070708] text-white">+61 (AU)</option>
                        <option value="+971" className="bg-[#070708] text-white">+971 (AE)</option>
                        <option value="+65" className="bg-[#070708] text-white">+65 (SG)</option>
                        <option value="+33" className="bg-[#070708] text-white">+33 (FR)</option>
                        <option value="+49" className="bg-[#070708] text-white">+49 (DE)</option>
                        <option value="+81" className="bg-[#070708] text-white">+81 (JP)</option>
                      </select>
                      <ChevronDown className="absolute right-2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                    </div>

                    <input
                      id="signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full bg-transparent py-3.5 pl-36 pr-4 text-white placeholder-white/20 border-none outline-none text-sm font-body"
                    />
                  </div>
                </div>


                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                    Password
                  </label>
                  <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                    <Lock className="absolute left-4 w-4 h-4 text-white/30" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent py-3.5 pl-11 pr-12 text-white placeholder-white/20 border-none outline-none text-sm font-body"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-white/30 hover:text-[#B88A52] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/40">Password strength</span>
                        <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
                      </div>
                      <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-white/30">
                        Include uppercase, lowercase, numbers, and special characters.
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                    <Lock className="absolute left-4 w-4 h-4 text-white/30" />
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent py-3.5 pl-11 pr-12 text-white placeholder-white/20 border-none outline-none text-sm font-body"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 text-white/30 hover:text-[#B88A52] transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="signup-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#B88A52] to-[#a67520] hover:from-[#c59a5c] hover:to-[#b8852c] active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#B88A52]/20 hover:shadow-[#B88A52]/30 transition-all duration-300 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending code...
                    </span>
                  ) : (
                    <>
                      Verify Email & Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider text-white/25">
                  <span className="bg-[#070708] px-4 font-semibold">or explore demo</span>
                </div>
              </div>

              {/* Demo Actions */}
              <div className="space-y-3">
                <button
                  id="signup-demo"
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-3.5 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] active:scale-[0.99] rounded-xl font-semibold text-white/70 text-sm flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer"
                >
                  🍽️ Explore with Demo Account
                </button>
              </div>

              <p className="text-center text-sm text-white/30 mt-7">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-[#B88A52] font-bold hover:text-[#c59a5c] transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
