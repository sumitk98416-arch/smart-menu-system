'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ChefHat } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co' ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key-here';

    let targetChefEmail = 'supportqrestro@gmail.com';
    let targetChefPassword = 'fsilnpkgqklmmdid';
    
    try {
      const saved = localStorage.getItem('qrestro_demo_restaurant');
      if (saved) {
        const parsed = JSON.parse(saved);
        const useAdmin = parsed.chef_use_admin_creds !== undefined ? parsed.chef_use_admin_creds === true : true;
        if (useAdmin) {
          const adminMatch = document.cookie.match(/(?:^|; )qrestro_demo_email=([^;]*)/);
          targetChefEmail = adminMatch ? decodeURIComponent(adminMatch[1]) : 'supportqrestro@gmail.com';
          targetChefPassword = parsed.chef_password || 'fsilnpkgqklmmdid';
        } else {
          targetChefEmail = parsed.chef_email || 'supportqrestro@gmail.com';
          targetChefPassword = parsed.chef_password || 'fsilnpkgqklmmdid';
        }
      }
    } catch {}

    const isKitchenUser = email.toLowerCase().trim() === targetChefEmail.toLowerCase().trim();

    if (isDemoMode) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 900));
        
        // If they enter the chef email but get the password wrong, throw error
        if (isKitchenUser && password !== targetChefPassword) {
          setError('Invalid credentials for Kitchen Display.');
          setLoading(false);
          return;
        }

        // Validate customized Administrator credentials if provided
        const adminEmailMatch = document.cookie.match(/(?:^|; )qrestro_demo_email=([^;]*)/);
        const adminPasswordMatch = document.cookie.match(/(?:^|; )qrestro_demo_password=([^;]*)/);
        const adminNameMatch = document.cookie.match(/(?:^|; )qrestro_demo_name=([^;]*)/);

        const savedAdminEmail = adminEmailMatch ? decodeURIComponent(adminEmailMatch[1]) : 'supportqrestro@gmail.com';
        const savedAdminPassword = adminPasswordMatch ? decodeURIComponent(adminPasswordMatch[1]) : 'fsilnpkgqklmmdid';
        const savedAdminName = adminNameMatch ? decodeURIComponent(adminNameMatch[1]) : 'Sumit Kumar';

        const isAdminAttempt = email.toLowerCase().trim() === savedAdminEmail.toLowerCase().trim();

        if (isAdminAttempt && password !== savedAdminPassword) {
          setError('Invalid administrator email or password.');
          setLoading(false);
          return;
        }

        document.cookie = 'qrestro_demo=true;path=/;max-age=86400';
        const guessedName = email.split('@')[0];
        const formattedName = isKitchenUser 
          ? 'Chef' 
          : (isAdminAttempt ? savedAdminName : (guessedName.charAt(0).toUpperCase() + guessedName.slice(1)));
        
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
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
      } else {
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
    let targetChefEmail = 'supportqrestro@gmail.com';
    let targetChefPassword = 'fsilnpkgqklmmdid';
    try {
      const saved = localStorage.getItem('qrestro_demo_restaurant');
      if (saved) {
        const parsed = JSON.parse(saved);
        const useAdmin = parsed.chef_use_admin_creds !== undefined ? parsed.chef_use_admin_creds === true : true;
        if (useAdmin) {
          const adminMatch = document.cookie.match(/(?:^|; )qrestro_demo_email=([^;]*)/);
          targetChefEmail = adminMatch ? decodeURIComponent(adminMatch[1]) : 'supportqrestro@gmail.com';
          targetChefPassword = parsed.chef_password || 'fsilnpkgqklmmdid';
        } else {
          targetChefEmail = parsed.chef_email || 'supportqrestro@gmail.com';
          targetChefPassword = parsed.chef_password || 'fsilnpkgqklmmdid';
        }
      }
    } catch {}
    setEmail(targetChefEmail);
    setPassword(targetChefPassword);
  };

  const handleGoogleLogin = async () => {
    const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co' ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key-here';

    if (isDemoMode) {
      document.cookie = 'qrestro_demo=true;path=/;max-age=86400';
      document.cookie = `qrestro_demo_name=${encodeURIComponent('Google User')};path=/;max-age=86400`;
      window.location.href = '/dashboard';
      return;
    }

    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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
                  onClick={handleDemoLogin}
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
              <span className="bg-[#070708] px-4 font-semibold">or continue with</span>
            </div>
          </div>

          {/* OAuth + Demo */}
          <div className="space-y-3">
            <button
              id="login-google"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] active:scale-[0.99] rounded-xl font-semibold text-white/70 text-sm flex items-center justify-center gap-2.5 transition-all duration-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

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
        </div>
      </div>
    </div>
  );
}
