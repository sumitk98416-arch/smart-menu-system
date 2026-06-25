'use client';

import { useState, useEffect } from 'react';
import { Plus, Download, ExternalLink, Users, X, QrCode, Crown, Sparkles, Trash2, Edit2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { demoTables, demoRestaurant, saveDemoTables } from '@/lib/demo-data';
import { Table } from '@/lib/types';
import { cn } from '@/lib/utils';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>(demoTables);

  // Sync to localStorage
  useEffect(() => {
    saveDemoTables(tables);
  }, [tables]);

  const [showAddTable, setShowAddTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  
  // Single table addition states
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [newTableIsVip, setNewTableIsVip] = useState(false);

  // Bulk generator states
  const [bulkCount, setBulkCount] = useState('5');
  const [bulkCapacity, setBulkCapacity] = useState('4');
  const [bulkIsVip, setBulkIsVip] = useState(false);

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
      is_vip: newTableIsVip,
      created_at: new Date().toISOString(),
    };
    setTables([...tables, newTable]);
    setNewTableNumber('');
    setNewTableCapacity('4');
    setNewTableIsVip(false);
    setShowAddTable(false);
  };

  const handleBulkGenerate = () => {
    const count = parseInt(bulkCount);
    const capacity = parseInt(bulkCapacity) || 4;
    if (isNaN(count) || count <= 0) return;

    // Find current highest numeric table number to continue counting from
    let maxNum = 0;
    tables.forEach(t => {
      const num = parseInt(t.table_number);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    });

    const newGeneratedTables: Table[] = [];
    for (let i = 1; i <= count; i++) {
      const nextNum = maxNum + i;
      newGeneratedTables.push({
        id: `table-bulk-${Date.now()}-${nextNum}`,
        restaurant_id: demoRestaurant.id,
        table_number: nextNum.toString(),
        capacity: capacity,
        is_active: true,
        is_vip: bulkIsVip,
        created_at: new Date().toISOString(),
      });
    }

    setTables([...tables, ...newGeneratedTables]);
    setBulkCount('5');
    setBulkIsVip(false);
  };

  const handleSaveChanges = () => {
    if (!editingTable) return;
    setTables(tables.map(t => t.id === editingTable.id ? editingTable : t));
    setEditingTable(null);
  };

  const handleDeleteTable = (id: string) => {
    if (confirm('Are you sure you want to delete this table?')) {
      setTables(tables.filter(t => t.id !== id));
    }
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
        ctx.fillText(`Table ${table.table_number}${table.is_vip ? ' (Reserved)' : ''}`, 200, 400);
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
    <div className="space-y-6 animate-simple-fade">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-900">Tables & QR Codes</h1>
          <p className="text-ink-500 mt-1">Manage seating capacity, reservation status, and generate QR codes</p>
        </div>
        <button onClick={() => setShowAddTable(true)} className="btn-primary self-start sm:self-center">
          <Plus className="w-4 h-4" /> Add Single Table
        </button>
      </div>

      {/* Bulk Generator Card */}
      <div className="card bg-gradient-to-br from-cream-50 to-amber-50/20 border border-cream-200/60 p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2.5 bg-gold-500/10 rounded-xl text-gold-600">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-ink-900">Instant Bulk QR Generator</h2>
            <p className="text-sm text-ink-500">Generate multiple new tables with pre-configured capacity and reserved status.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Number of Tables</label>
            <input
              type="number"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              className="input-field"
              min="1"
              max="50"
              placeholder="e.g. 5"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Seating Capacity</label>
            <input
              type="number"
              value={bulkCapacity}
              onChange={(e) => setBulkCapacity(e.target.value)}
              className="input-field"
              min="1"
              max="20"
              placeholder="e.g. 4"
            />
          </div>
          <div className="flex items-center gap-3 h-11 px-3 bg-white rounded-xl border border-cream-200/80">
            <input
              type="checkbox"
              id="bulkIsVip"
              checked={bulkIsVip}
              onChange={(e) => setBulkIsVip(e.target.checked)}
              className="w-4 h-4 rounded text-gold-600 focus:ring-gold-500 border-cream-300"
            />
            <label htmlFor="bulkIsVip" className="text-sm font-medium text-ink-700 cursor-pointer flex items-center gap-1.5 select-none">
              <Crown className="w-4 h-4 text-gold-600" /> Reserved Table
            </label>
          </div>
          <button
            onClick={handleBulkGenerate}
            className="btn-primary h-11 flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" /> Generate QR Codes
          </button>
        </div>
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {tables.map((table) => (
          <div
            key={table.id}
            className={cn(
              'card hover:shadow-md transition-all border p-5 relative overflow-hidden flex flex-col justify-between',
              table.is_vip 
                ? 'border-gold-300/80 bg-gradient-to-br from-cream-50/70 to-gold-50/10 shadow-sm' 
                : 'border-cream-200/60 bg-white',
              !table.is_active && 'opacity-60'
            )}
          >
            <div>
              {/* Card Header Info */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg font-bold text-ink-900">
                      Table {table.table_number}
                    </h3>
                    {table.is_vip && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-gold-600 text-white rounded-full text-[10px] font-bold shadow-sm">
                        <Crown className="w-2.5 h-2.5" /> Reserved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-500 flex items-center gap-1 mt-1">
                    <Users className="w-3.5 h-3.5" /> Capacity: {table.capacity} guests
                  </p>
                </div>
                <span className={cn('badge text-[10px] font-bold px-2 py-0.5', table.is_active ? 'badge-sage' : 'badge-rose')}>
                  {table.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* QR Code Container with Restaurant Name Below */}
              <div 
                className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border border-cream-100 hover:border-gold-300 transition-colors mb-4 cursor-pointer group"
                onClick={() => setSelectedTable(table)}
              >
                <div className="relative p-1 bg-white rounded-lg">
                  <QRCodeSVG
                    id={`qr-${table.id}`}
                    value={getQRUrl(table)}
                    size={130}
                    fgColor="#1a1208"
                    bgColor="#ffffff"
                    level="M"
                  />
                </div>
                <div className="mt-3 text-center border-t border-cream-100/60 pt-2.5 w-full">
                  <p className="text-[10px] font-serif font-bold text-gold-700 tracking-widest uppercase">{demoRestaurant.name}</p>
                  <p className="text-[9px] text-ink-400 font-sans mt-0.5">Table {table.table_number} Ordering QR</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-auto">
              <button
                onClick={() => handleDownloadQR(table)}
                className="btn-primary flex-1 text-xs py-2 h-9 px-3 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                onClick={() => setEditingTable(table)}
                title="Edit Capacity & Reservation Status"
                className="btn-secondary text-xs py-2 h-9 px-3 flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-ink-600" /> Edit
              </button>
              <button
                onClick={() => toggleTableActive(table.id)}
                className={cn(
                  "btn-ghost py-2 px-2.5 h-9 text-xs transition-colors",
                  table.is_active ? "text-ink-500 hover:text-rose-600 hover:bg-rose-50" : "text-ink-500 hover:text-sage-700 hover:bg-sage-50"
                )}
              >
                {table.is_active ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => handleDeleteTable(table.id)}
                title="Delete Table"
                className="p-2 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-rose-50 text-ink-400 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Single Table Modal */}
      {showAddTable && (
        <>
          <div className="overlay" onClick={() => setShowAddTable(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-xl w-full max-w-sm p-6 animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading text-xl font-bold text-ink-900 flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-gold-600" /> Add Single Table
                </h2>
                <button onClick={() => setShowAddTable(false)} className="text-ink-400 hover:text-ink-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Table Number / Label</label>
                  <input
                    type="text"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 7, 8 or Reserved-A"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Seating Capacity</label>
                  <input
                    type="number"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                    className="input-field"
                    min="1"
                    max="20"
                  />
                </div>
                <div className="flex items-center gap-3 h-11 px-3 bg-white rounded-xl border border-cream-200/80">
                  <input
                    type="checkbox"
                    id="newTableIsVip"
                    checked={newTableIsVip}
                    onChange={(e) => setNewTableIsVip(e.target.checked)}
                    className="w-4 h-4 rounded text-gold-600 focus:ring-gold-500 border-cream-300"
                  />
                  <label htmlFor="newTableIsVip" className="text-sm font-medium text-ink-700 cursor-pointer flex items-center gap-1.5 select-none">
                    <Crown className="w-4 h-4 text-gold-600" /> Reserved Designation
                  </label>
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

      {/* Edit Table Modal */}
      {editingTable && (
        <>
          <div className="overlay" onClick={() => setEditingTable(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-xl w-full max-w-sm p-6 animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading text-xl font-bold text-ink-900 flex items-center gap-1.5">
                  <Edit2 className="w-5 h-5 text-gold-600" /> Edit Table Settings
                </h2>
                <button onClick={() => setEditingTable(null)} className="text-ink-400 hover:text-ink-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Table Number / Label</label>
                  <input
                    type="text"
                    value={editingTable.table_number}
                    onChange={(e) => setEditingTable({ ...editingTable, table_number: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 7"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Seating Capacity</label>
                  <input
                    type="number"
                    value={editingTable.capacity}
                    onChange={(e) => setEditingTable({ ...editingTable, capacity: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="1"
                    max="30"
                  />
                </div>
                <div className="flex items-center gap-3 h-11 px-3 bg-white rounded-xl border border-cream-200/80">
                  <input
                    type="checkbox"
                    id="editTableIsVip"
                    checked={editingTable.is_vip || false}
                    onChange={(e) => setEditingTable({ ...editingTable, is_vip: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-600 focus:ring-gold-500 border-cream-300"
                  />
                  <label htmlFor="editTableIsVip" className="text-sm font-medium text-ink-700 cursor-pointer flex items-center gap-1.5 select-none">
                    <Crown className="w-4 h-4 text-gold-600" /> Reserved Designation
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditingTable(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleSaveChanges} className="btn-primary flex-1">Save Changes</button>
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
            <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-xl w-full max-w-sm p-8 text-center animate-scale-in relative overflow-hidden">
              {selectedTable.is_vip && (
                <div className="absolute top-4 right-4 text-gold-600">
                  <Crown className="w-6 h-6 animate-pulse" />
                </div>
              )}
              
              {selectedTable.is_vip && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-gold-600 text-white rounded-full text-[10px] font-bold mb-3 shadow-sm">
                  <Crown className="w-2.5 h-2.5" /> Reserved
                </div>
              )}
              <h2 className="font-heading text-2xl font-bold text-ink-900 mb-1">
                Table {selectedTable.table_number}
              </h2>
              <p className="text-xs text-ink-500 mb-6 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5" /> Seating Capacity: {selectedTable.capacity} guests
              </p>

              <div className="bg-white rounded-2xl p-6 inline-flex flex-col items-center justify-center border border-cream-200 shadow-sm mb-6 w-full max-w-[260px]">
                <QRCodeSVG
                  value={getQRUrl(selectedTable)}
                  size={180}
                  fgColor="#1a1208"
                  bgColor="#ffffff"
                  level="H"
                />
                <div className="mt-4 text-center border-t border-cream-100 pt-3 w-full">
                  <p className="text-xs font-serif font-bold text-gold-700 tracking-widest uppercase">{demoRestaurant.name}</p>
                  <p className="text-[10px] text-ink-400 font-sans mt-0.5">Scan to view menu & order</p>
                </div>
              </div>

              <p className="text-xs text-ink-400 break-all mb-6 bg-cream-100 rounded-lg p-2 max-w-full">
                {getQRUrl(selectedTable)}
              </p>

              <div className="flex flex-col gap-2.5 mt-2">
                <a
                  href={getQRUrl(selectedTable)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Customer Menu (Table {selectedTable.table_number})</span>
                </a>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedTable(null)} className="btn-secondary flex-1 py-2 text-xs">Close</button>
                  <button onClick={() => handleDownloadQR(selectedTable)} className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5">
                    <Download className="w-4 h-4" /> Download QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
