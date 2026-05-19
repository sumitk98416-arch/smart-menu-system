'use client';

import { useState } from 'react';
import { Save, Store, Phone, MapPin, DollarSign } from 'lucide-react';
import { demoRestaurant, saveDemoRestaurantSettings } from '@/lib/demo-data';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    name: demoRestaurant.name,
    description: demoRestaurant.description,
    phone: demoRestaurant.phone,
    address: demoRestaurant.address,
    currency: demoRestaurant.currency,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveDemoRestaurantSettings(settings);
    setSaved(true);
    // Reload the page to ensure all dynamic elements across the layout update instantly
    setTimeout(() => {
      setSaved(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-ink-900">Settings</h1>
        <p className="text-ink-500 mt-1">Manage your restaurant profile and preferences</p>
      </div>

      {saved && (
        <div className="p-4 bg-sage-400/10 border border-sage-400/20 rounded-xl text-sage-700 text-sm animate-fade-in flex items-center gap-2">
          ✅ Settings saved successfully!
        </div>
      )}

      <div className="card space-y-6">
        <h2 className="font-heading text-xl font-semibold text-ink-900 flex items-center gap-2">
          <Store className="w-5 h-5 text-gold-500" /> Restaurant Profile
        </h2>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Restaurant Name</label>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            className="input-field"
          />
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
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Phone
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Currency Symbol
            </label>
            <input
              type="text"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="input-field"
              maxLength={3}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Address
          </label>
          <textarea
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="input-field resize-none h-16"
          />
        </div>

        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      {/* Environment info */}
      <div className="card bg-cream-50 border-dashed">
        <h3 className="text-sm font-semibold text-ink-700 mb-3">Environment</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Mode</span>
            <span className="badge badge-gold">Demo Mode</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Supabase</span>
            <span className="text-ink-400">Not connected</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-500">Restaurant Slug</span>
            <span className="font-mono text-xs text-ink-600 bg-cream-200 px-2 py-1 rounded">{demoRestaurant.slug}</span>
          </div>
        </div>
        <p className="text-xs text-ink-400 mt-4">
          Connect to Supabase by adding your credentials to <code className="bg-cream-200 px-1 rounded">.env.local</code> file.
        </p>
      </div>
    </div>
  );
}
