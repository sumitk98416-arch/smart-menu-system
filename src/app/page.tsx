import Link from 'next/link';
import { UtensilsCrossed, QrCode, ChefHat, Star, ArrowRight, Smartphone, BarChart3, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-50/80 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-ink-900">TableTap</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost">
              Sign In
            </Link>
            <Link href="/auth/signup" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 badge-gold px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
              Now serving smarter restaurants
            </div>
            <h1 className="font-heading text-5xl md:text-7xl font-bold text-ink-900 leading-tight mb-6">
              Elegant Dining,
              <br />
              <span className="text-gold-500">Effortless</span> Ordering
            </h1>
            <p className="text-lg md:text-xl text-ink-500 max-w-2xl mx-auto mb-10 leading-relaxed font-body">
              Transform your restaurant with QR-powered ordering. Guests scan, browse your beautiful menu, 
              and order — all from their table. No app downloads required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup" className="btn-primary text-base px-8 py-4 rounded-xl">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/order/the-golden-plate/table-1" className="btn-secondary text-base px-8 py-4 rounded-xl">
                <Smartphone className="w-5 h-5" />
                Try Demo Menu
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-cream-100 border border-cream-200 rounded-3xl p-8 md:p-12 max-w-4xl mx-auto shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Cards */}
                {[
                  { label: 'Orders Today', value: '247', icon: '📋', change: '+12%' },
                  { label: 'Revenue', value: '₹48,320', icon: '💰', change: '+8%' },
                  { label: 'Avg Rating', value: '4.8', icon: '⭐', change: '+0.2' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/80 rounded-2xl p-6 text-left border border-cream-200/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className="text-xs font-semibold text-sage-600 bg-sage-400/20 px-2 py-1 rounded-full">
                        {stat.change}
                      </span>
                    </div>
                    <p className="font-heading text-2xl font-bold text-ink-900">{stat.value}</p>
                    <p className="text-sm text-ink-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold-400/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-sage-400/10 rounded-full blur-2xl" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-cream-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink-900 mb-4">
              Everything Your Restaurant Needs
            </h2>
            <p className="text-ink-500 text-lg max-w-xl mx-auto">
              A complete solution from QR generation to kitchen management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {[
              {
                icon: <QrCode className="w-6 h-6" />,
                title: 'QR Code Ordering',
                desc: 'Generate unique QR codes for each table. Customers scan and order instantly — no app needed.',
              },
              {
                icon: <UtensilsCrossed className="w-6 h-6" />,
                title: 'Beautiful Menus',
                desc: 'Showcase your dishes with elegant, mobile-first menu pages that match your brand.',
              },
              {
                icon: <ChefHat className="w-6 h-6" />,
                title: 'Kitchen Display',
                desc: 'Real-time kitchen view with order queue, status updates, and preparation tracking.',
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'Live Dashboard',
                desc: 'Monitor orders, revenue, and table status in real-time from your owner dashboard.',
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: 'Reviews & Feedback',
                desc: 'Collect customer reviews and phone numbers for future marketing campaigns.',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Multi-Tenant SaaS',
                desc: 'Each restaurant gets isolated data, custom settings, and independent management.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="card bg-white/60 hover:bg-white/90 transition-colors duration-300 group"
              >
                <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center text-gold-500 mb-4 group-hover:bg-gold-500 group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-lg font-semibold text-ink-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-ink-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink-900 mb-4">
              How It Works
            </h2>
            <p className="text-ink-500 text-lg max-w-xl mx-auto">
              Get started in minutes, not days
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up and set up your restaurant profile' },
              { step: '02', title: 'Build Your Menu', desc: 'Add categories, items, prices, and descriptions' },
              { step: '03', title: 'Print QR Codes', desc: 'Generate QR codes for each table and place them' },
              { step: '04', title: 'Start Serving', desc: 'Customers scan, order, and you manage from dashboard' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-cream-100 border-2 border-cream-200 rounded-2xl flex items-center justify-center font-heading text-xl font-bold text-gold-500 group-hover:bg-gold-500 group-hover:text-white group-hover:border-gold-500 transition-all duration-300">
                  {item.step}
                </div>
                <h3 className="font-heading text-lg font-semibold text-ink-900 mb-2">{item.title}</h3>
                <p className="text-sm text-ink-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="card-elevated bg-ink-900 text-center p-12 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-transparent" />
            <div className="relative z-10">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-cream-50 mb-4">
                Ready to Elevate Your Restaurant?
              </h2>
              <p className="text-cream-300 text-lg mb-8 max-w-lg mx-auto">
                Join hundreds of restaurants already using TableTap to streamline their ordering.
              </p>
              <Link href="/auth/signup" className="btn-primary bg-gold-400 hover:bg-gold-500 text-ink-900 text-base px-8 py-4 rounded-xl font-bold">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-cream-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gold-500 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-ink-900">TableTap</span>
          </div>
          <p className="text-sm text-ink-400">
            © {new Date().getFullYear()} TableTap. Crafted with care for modern restaurants.
          </p>
        </div>
      </footer>
    </div>
  );
}
