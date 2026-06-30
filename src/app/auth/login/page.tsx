'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ChefHat, KeyRound, ShieldCheck } from 'lucide-react';
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
    <path d="M 45 38 C 42 38, 38 35, 41 30 C 44 25, 48 29, 50 32 C 50 29, 54 25, 57 30 Q 50 42 50 44 Z M 50 44 L 50 48" strokeWidth="2.8" fill="none" />
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // forgot-password multi-step state
  const [view, setView] = useState<'login' | 'forgot'>('login');

  useEffect(() => {
    // Push dummy state to handle browser back button redirecting to hero page
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.location.replace('/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'newpass'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpValue, setOtpValue]       = useState('');
  const [otpToken, setOtpToken]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [successMsg, setSuccessMsg]   = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  /* ─── Step 1: Send OTP ─────────────────────────────────────── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/auth/forgot-password/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to send OTP.');
      } else {
        setOtpToken(data.token);
        setForgotStep('otp');
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) { clearInterval(interval); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Step 2: Verify OTP ───────────────────────────────────── */
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpValue.trim().length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    const expiry = parseInt(otpToken.split(':')[0], 10);
    if (Date.now() > expiry) {
      setError('OTP has expired. Please request a new one.');
      setForgotStep('email');
      return;
    }
    setForgotStep('newpass');
  };

  /* ─── Step 3: Reset Password ───────────────────────────────── */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          otp:   otpValue,
          token: otpToken,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to reset password.');
      } else {
        setSuccessMsg('Password reset successfully! You can now sign in.');
        setTimeout(() => { resetForgotFlow(); setView('login'); }, 2500);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Helper: reset forgot flow ────────────────────────────── */
  const resetForgotFlow = () => {
    setForgotStep('email');
    setForgotEmail('');
    setOtpValue('');
    setOtpToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
    setResendCooldown(0);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co' ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key-here';

    // ─── Read kitchen credentials from Settings ────────────────────
    let kitchenEmail = 'kitchen@qrestro.com';
    let kitchenPassword = 'chefpassword';
    try {
      const saved = localStorage.getItem('qrestro_demo_restaurant');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.chef_email)    kitchenEmail    = parsed.chef_email;
        if (parsed.chef_password) kitchenPassword = parsed.chef_password;
      }
    } catch {}

    const isKitchenUser = email.toLowerCase().trim() === kitchenEmail.toLowerCase().trim();

    if (isDemoMode) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 900));

        // Kitchen user: validate password
        if (isKitchenUser && password !== kitchenPassword) {
          setError('Invalid credentials for Kitchen Display.');
          setLoading(false);
          return;
        }

        document.cookie = 'qrestro_demo=true;path=/;max-age=86400';
        const guessedName = email.split('@')[0];
        const formattedName = isKitchenUser
          ? 'Chef'
          : (guessedName.charAt(0).toUpperCase() + guessedName.slice(1));

        document.cookie = `qrestro_demo_name=${encodeURIComponent(formattedName)};path=/;max-age=86400`;

        if (isKitchenUser) {
          window.location.href = '/kitchen-display';
        } else {
          window.location.href = '/dashboard';
        }
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
      } else {
        // Clear all demo cookies for a clean real user session
        document.cookie = 'qrestro_demo=;path=/;max-age=0';
        document.cookie = 'qrestro_demo_name=;path=/;max-age=0';
        document.cookie = 'qrestro_demo_email=;path=/;max-age=0';
        document.cookie = 'qrestro_demo_phone=;path=/;max-age=0';
        document.cookie = 'qrestro_demo_password=;path=/;max-age=0';

        if (data?.user) {
          localStorage.setItem('qrestro_active_user_id', data.user.id);
        }

        if (isKitchenUser) {
          window.location.href = '/kitchen-display';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    document.cookie = 'qrestro_demo=true;path=/;max-age=86400';
    // Clear fresh signup and custom settings to restore default demo presets
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

  const handleKitchenDemoLogin = () => {
    // Read the kitchen credentials set in Settings → Kitchen Screen Credentials
    let kitchenEmail = 'kitchen@qrestro.com';
    let kitchenPassword = 'chefpassword';
    try {
      const saved = localStorage.getItem('qrestro_demo_restaurant');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.chef_email) kitchenEmail = parsed.chef_email;
        if (parsed.chef_password) kitchenPassword = parsed.chef_password;
      }
    } catch {}
    // Pre-fill the form so staff can confirm and sign in
    setEmail(kitchenEmail);
    setPassword(kitchenPassword);
  };

  return (
    <div className="min-h-screen bg-[#070708] flex flex-col lg:flex-row relative overflow-hidden">

      {/* ─── Ambient glows ─── */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#B88A52]/6 rounded-full blur-[150px] pointer-events-none" />

      {/* ════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL — Welcome Back Visual                        */}
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
            <span className="text-[#e2b784] text-xs font-semibold tracking-wider uppercase">Your Dashboard Awaits</span>
          </div>

          <div>
            <h2 className="font-heading text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.05] mb-4">
              Welcome<br />
              <span className="bg-gradient-to-r from-[#B88A52] to-[#e2b784] bg-clip-text text-transparent">
                Back.
              </span>
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-[#B88A52] to-transparent rounded-full mb-5" />
            <p className="text-white/45 text-base leading-relaxed max-w-sm">
              Your live orders, kitchen queue, and revenue insights are all waiting inside.
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

          {view === 'forgot' ? (
            /* ═════════ Forgot Password — 3-step OTP Flow ═════════ */
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6">
                {(['email', 'otp', 'newpass'] as const).map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                      forgotStep === step
                        ? 'bg-[#B88A52] text-white shadow-md shadow-[#B88A52]/30'
                        : (['otp', 'newpass'].indexOf(forgotStep) > i - 1)
                          ? 'bg-[#B88A52]/20 text-[#B88A52]'
                          : 'bg-white/5 text-white/25'
                    }`}>{i + 1}</div>
                    {i < 2 && <div className={`h-[1px] w-8 rounded-full transition-all duration-500 ${
                      (['otp', 'newpass'].indexOf(forgotStep) >= i) ? 'bg-[#B88A52]/50' : 'bg-white/10'
                    }`} />}
                  </div>
                ))}
                <span className="ml-2 text-white/30 text-xs">
                  {forgotStep === 'email' ? 'Enter email' : forgotStep === 'otp' ? 'Verify code' : 'New password'}
                </span>
              </div>

              {/* Header */}
              <div className="mb-7 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  {forgotStep === 'email' && <Mail className="w-4 h-4 text-[#B88A52]" />}
                  {forgotStep === 'otp'   && <KeyRound className="w-4 h-4 text-[#B88A52]" />}
                  {forgotStep === 'newpass' && <ShieldCheck className="w-4 h-4 text-[#B88A52]" />}
                  <span className="text-[#B88A52] text-xs font-bold tracking-widest uppercase">Password Recovery</span>
                </div>
                <h1 className="font-heading text-3xl font-bold text-white mb-2">
                  {forgotStep === 'email'   ? 'Reset Password'   : ''}
                  {forgotStep === 'otp'     ? 'Enter OTP'        : ''}
                  {forgotStep === 'newpass' ? 'New Password'     : ''}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="h-[2px] w-10 bg-gradient-to-r from-[#B88A52] to-transparent rounded-full" />
                  <p className="text-white/40 text-sm">
                    {forgotStep === 'email'   ? 'We\'ll send a 6-digit code to your email'                     : ''}
                    {forgotStep === 'otp'     ? `Code sent to ${forgotEmail}`                                   : ''}
                    {forgotStep === 'newpass' ? 'Choose a strong new password'                                  : ''}
                  </p>
                </div>
              </div>

              {/* Success message */}
              {successMsg && (
                <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-3 animate-scale-in">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{successMsg}</p>
                    <p className="text-white/50 text-xs mt-0.5">Redirecting to sign in…</p>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-sm flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-rose-400 text-xs font-bold">!</span>
                  </div>
                  {error}
                </div>
              )}

              {/* ── Step 1: Email ─────────────────────────────────── */}
              {forgotStep === 'email' && !successMsg && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Email Address</label>
                    <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                      <Mail className="absolute left-4 w-4 h-4 text-white/30" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-transparent py-3.5 pl-11 pr-4 text-white placeholder-white/20 border-none outline-none text-sm font-body"
                        required
                      />
                    </div>
                  </div>
                  <button
                    id="forgot-send-otp"
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-[#B88A52] to-[#a67520] hover:from-[#c59a5c] hover:to-[#b8852c] active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#B88A52]/20 transition-all duration-300 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending code…</>
                    ) : (
                      <>Send OTP Code <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}

              {/* ── Step 2: OTP ───────────────────────────────────── */}
              {forgotStep === 'otp' && !successMsg && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">6-Digit Code</label>
                    <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                      <KeyRound className="absolute left-4 w-4 h-4 text-white/30" />
                      <input
                        id="forgot-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        className="w-full bg-transparent py-3.5 pl-11 pr-4 text-white placeholder-white/20 border-none outline-none text-xl font-mono tracking-[0.4em] text-center"
                        required
                      />
                    </div>
                    <p className="text-white/25 text-xs mt-2 text-center">
                      Check your inbox at <span className="text-white/50">{forgotEmail}</span>
                    </p>
                  </div>
                  <button
                    id="forgot-verify-otp"
                    type="submit"
                    disabled={loading || otpValue.length !== 6}
                    className="w-full py-4 bg-gradient-to-r from-[#B88A52] to-[#a67520] hover:from-[#c59a5c] hover:to-[#b8852c] active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#B88A52]/20 transition-all duration-300 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify Code <ArrowRight className="w-4 h-4" />
                  </button>
                  {/* Resend */}
                  <p className="text-center text-xs text-white/30 mt-1">
                    Didn&apos;t receive it?{' '}
                    {resendCooldown > 0 ? (
                      <span className="text-white/25">Resend in {resendCooldown}s</span>
                    ) : (
                      <button type="button" onClick={handleSendOtp} disabled={loading}
                        className="text-[#B88A52] font-bold hover:text-[#c59a5c] transition-colors cursor-pointer bg-transparent border-none outline-none">
                        Resend OTP
                      </button>
                    )}
                  </p>
                </form>
              )}

              {/* ── Step 3: New Password ──────────────────────────── */}
              {forgotStep === 'newpass' && !successMsg && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">New Password</label>
                    <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                      <Lock className="absolute left-4 w-4 h-4 text-white/30" />
                      <input
                        id="forgot-new-password"
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full bg-transparent py-3.5 pl-11 pr-12 text-white placeholder-white/20 border-none outline-none text-sm font-body"
                        required minLength={6}
                      />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-4 text-white/30 hover:text-[#B88A52] transition-colors cursor-pointer">
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Confirm Password</label>
                    <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                      <Lock className="absolute left-4 w-4 h-4 text-white/30" />
                      <input
                        id="forgot-confirm-password"
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full bg-transparent py-3.5 pl-11 pr-12 text-white placeholder-white/20 border-none outline-none text-sm font-body"
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-4 text-white/30 hover:text-[#B88A52] transition-colors cursor-pointer">
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    id="forgot-reset-password"
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-[#B88A52] to-[#a67520] hover:from-[#c59a5c] hover:to-[#b8852c] active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#B88A52]/20 transition-all duration-300 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting…</>
                    ) : (
                      <><ShieldCheck className="w-4 h-4" />Reset Password</>
                    )}
                  </button>
                </form>
              )}

              <p className="text-center text-sm text-white/30 mt-7">
                Remember your password?{' '}
                <button type="button"
                  onClick={() => { resetForgotFlow(); setView('login'); }}
                  className="text-[#B88A52] font-bold hover:text-[#c59a5c] transition-colors cursor-pointer bg-transparent border-none outline-none">
                  Sign in
                </button>
              </p>
            </>
          ) : (
            /* ═════════ Standard Sign In View ═════════ */
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#B88A52]" />
                  <span className="text-[#B88A52] text-xs font-bold tracking-widest uppercase">Restaurant Portal</span>
                </div>
                <h1 className="font-heading text-4xl font-bold text-white mb-2">Sign In</h1>
                <div className="flex items-center gap-2">
                  <div className="h-[2px] w-12 bg-gradient-to-r from-[#B88A52] to-transparent rounded-full" />
                  <p className="text-white/40 text-sm">Enter your credentials to access your dashboard</p>
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

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                    Email Address
                  </label>
                  <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                    <Mail className="absolute left-4 w-4 h-4 text-white/30" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-transparent py-3.5 pl-11 pr-4 text-white placeholder-white/20 border-none outline-none text-sm font-body"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/40">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-[#B88A52]/70 hover:text-[#B88A52] transition-colors cursor-pointer font-semibold"
                      onClick={() => {
                        resetForgotFlow();
                        setView('forgot');
                        setError('');
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-[#B88A52]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(184,138,82,0.08)] transition-all duration-300">
                    <Lock className="absolute left-4 w-4 h-4 text-white/30" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent py-3.5 pl-11 pr-12 text-white placeholder-white/20 border-none outline-none text-sm font-body"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-white/30 hover:text-[#B88A52] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#B88A52] to-[#a67520] hover:from-[#c59a5c] hover:to-[#b8852c] active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#B88A52]/20 hover:shadow-[#B88A52]/30 transition-all duration-300 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <>
                      Sign In
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
                  id="login-kitchen-demo"
                  type="button"
                  onClick={handleKitchenDemoLogin}
                  className="w-full py-3.5 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] active:scale-[0.99] rounded-xl font-semibold text-white/70 text-sm flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer"
                >
                  <ChefHat className="w-4 h-4 text-white/40" />
                  Explore Kitchen Display
                </button>
              </div>

              <p className="text-center text-sm text-white/30 mt-7">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-[#B88A52] font-bold hover:text-[#c59a5c] transition-colors">
                  Create one
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
