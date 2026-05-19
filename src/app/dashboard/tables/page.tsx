'use client';

import { useState } from 'react';
import { Plus, Download, ExternalLink, Users, X, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { demoTables, demoRestaurant } from '@/lib/demo-data';
import { Table } from '@/lib/types';
import { cn } from '@/lib/utils';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>(demoTables);
  const [showAddTable, setShowAddTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');

  const getQRUrl = (table: Table) =>
    `${APP_URL}/order/${demoRestaurant.slug}/${table.id}`;

  const handleAddTable = () => {
    if (!newTableNumber.trim()) return;
    const newTable: Table = {
      id: `table-new-${Date.now()}`,
      restaurant_id: demoRestaurant.id,
      table_number: newTableNumber.trim(),
      capacity: parseInt(newTableCapacity) || 4,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setTables([...tables, newTable]);
    setNewTableNumber('');
    setNewTableCapacity('4');
    setShowAddTable(false);
  };

  const handleDownloadQR = (table: Table) => {
    const svg = document.getElementById(`qr-${table.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 480;
      if (ctx) {
        ctx.fillStyle = '#faf6f0';
        ctx.fillRect(0, 0, 400, 480);
        ctx.drawImage(img, 50, 30, 300, 300);
        ctx.fillStyle = '#1a1208';
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'center';
        ctx.fillText(demoRestaurant.name, 200, 370);
        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#6b5d4d';
        ctx.fillText(`Table ${table.table_number}`, 200, 400);
        ctx.font = '14px sans-serif';
        ctx.fillText('Scan to Order', 200, 440);
      }
      const a = document.createElement('a');
      a.download = `table-${table.table_number}-qr.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const toggleTableActive = (id: string) => {
    setTables(tables.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-900">Tables & QR Codes</h1>
          <p className="text-ink-500 mt-1">Manage tables and generate QR codes for customers</p>
        </div>
        <button onClick={() => setShowAddTable(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {tables.map((table) => (
          <div key={table.id} className={cn('card hover:shadow-md transition-all cursor-pointer', !table.is_active && 'opacity-50')}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-heading text-lg font-semibold text-ink-900">
                  Table {table.table_number}
                </h3>
                <p className="text-sm text-ink-500 flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5" /> Seats {table.capacity}
                </p>
              </div>
              <span className={cn('badge text-xs', table.is_active ? 'badge-sage' : 'badge-rose')}>
                {table.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* QR Code Preview */}
            <div className="bg-white rounded-xl p-4 flex items-center justify-center border border-cream-200/50 mb-4"
                 onClick={() => setSelectedTable(table)}>
              <QRCodeSVG
                id={`qr-${table.id}`}
                value={getQRUrl(table)}
                size={140}
                fgColor="#1a1208"
                bgColor="#ffffff"
                level="M"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadQR(table)}
                className="btn-primary flex-1 text-sm py-2"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                onClick={() => setSelectedTable(table)}
                className="btn-secondary py-2 px-3 text-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleTableActive(table.id)}
                className="btn-ghost py-2 px-3 text-xs"
              >
                {table.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add table modal */}
      {showAddTable && (
        <>
          <div className="overlay" onClick={() => setShowAddTable(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-xl w-full max-w-sm p-6 animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-semibold text-ink-900">Add Table</h2>
                <button onClick={() => setShowAddTable(false)} className="text-ink-400 hover:text-ink-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Table Number / Name</label>
                  <input type="text" value={newTableNumber} onChange={(e) => setNewTableNumber(e.target.value)} className="input-field" placeholder="e.g. 7 or VIP" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Seating Capacity</label>
                  <input type="number" value={newTableCapacity} onChange={(e) => setNewTableCapacity(e.target.value)} className="input-field" min="1" max="20" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAddTable(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleAddTable} className="btn-primary flex-1">Create Table</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* QR detail modal */}
      {selectedTable && (
        <>
          <div className="overlay" onClick={() => setSelectedTable(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-xl w-full max-w-sm p-8 text-center animate-scale-in">
              <h2 className="font-heading text-xl font-semibold text-ink-900 mb-1">
                Table {selectedTable.table_number}
              </h2>
              <p className="text-sm text-ink-500 mb-6">Scan to view menu & order</p>

              <div className="bg-white rounded-2xl p-6 inline-block border border-cream-200 mb-6">
                <QRCodeSVG
                  value={getQRUrl(selectedTable)}
                  size={200}
                  fgColor="#1a1208"
                  bgColor="#ffffff"
                  level="H"
                />
              </div>

              <p className="text-xs text-ink-400 break-all mb-6 bg-cream-100 rounded-lg p-2">
                {getQRUrl(selectedTable)}
              </p>

              <div className="flex gap-3">
                <button onClick={() => setSelectedTable(null)} className="btn-secondary flex-1">Close</button>
                <button onClick={() => handleDownloadQR(selectedTable)} className="btn-primary flex-1">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
