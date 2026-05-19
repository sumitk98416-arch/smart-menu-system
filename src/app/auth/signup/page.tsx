'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  // Trigger layout styling hot-reload
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
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
        document.cookie = 'tabletap_demo=true;path=/;max-age=86400';
        if (name) {
          document.cookie = `tabletap_demo_name=${encodeURIComponent(name)};path=/;max-age=86400`;
        }
        
        router.push('/dashboard');
        router.refresh();
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    document.cookie = 'tabletap_demo=true;path=/;max-age=86400';
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Left side — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-500/15 via-transparent to-gold-500/15" />
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 bg-gold-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UtensilsCrossed className="w-9 h-9 text-white" />
          </div>
          <h2 className="font-heading text-4xl font-bold text-cream-50 mb-4">
            Join TableTap
          </h2>
          <p className="text-cream-300 text-lg max-w-sm mx-auto leading-relaxed">
            Set up your restaurant in minutes. Generate QR codes, manage menus, and start receiving orders today.
          </p>
          {/* Features list */}
          <div className="mt-10 space-y-4 text-left max-w-xs mx-auto">
            {['QR code ordering', 'Live kitchen display', 'Customer reviews', 'Revenue analytics'].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-cream-200">
                <div className="w-6 h-6 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-400 text-xs">✓</span>
                </div>
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-16 left-16 w-32 h-32 border border-gold-500/10 rounded-full" />
        <div className="absolute bottom-20 right-20 w-20 h-20 border border-cream-300/10 rounded-full" />
      </div>

      {/* Right side — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-ink-900">TableTap</span>
          </div>

          <h1 className="font-heading text-3xl font-bold text-ink-900 mb-2">Create Account</h1>
          <p className="text-ink-500 mb-8">Start your free trial — no credit card required</p>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="input-field pl-11"
                  style={{ paddingLeft: '2.75rem' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@restaurant.com"
                  className="input-field pl-11"
                  style={{ paddingLeft: '2.75rem' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="input-field pl-11 pr-11"
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-cream-50 px-4 text-sm text-ink-400">or</span>
            </div>
          </div>

          <button onClick={handleDemoLogin} className="btn-secondary w-full py-3.5 text-base">
            🍽️ Explore with Demo Account
          </button>

          <p className="text-center text-sm text-ink-500 mt-8">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-gold-500 font-semibold hover:text-gold-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
