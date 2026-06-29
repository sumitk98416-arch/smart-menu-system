'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Phone, Mail, Search, Plus, Trash2, Edit2, Copy, ShieldAlert,
  Wrench, Truck, Users, Check, X, Info, User, HelpCircle, PhoneCall, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Core interface definitions
interface ContactItem {
  id: string;
  name: string;
  role: string;
  category: 'emergency' | 'supplier' | 'staff' | 'custom';
  phone: string;
  email?: string;
  notes?: string;
}

const DEFAULT_EMERGENCY_CONTACTS: ContactItem[] = [
  {
    id: 'em-1',
    name: 'Ambulance & Medical Emergency',
    role: 'Medical First Aid',
    category: 'emergency',
    phone: '102',
    notes: 'National emergency medical response'
  },
  {
    id: 'em-2',
    name: 'Fire Department',
    role: 'Fire & Safety',
    category: 'emergency',
    phone: '101',
    notes: 'Local fire station dispatch control'
  },
  {
    id: 'em-3',
    name: 'Commercial Gas Supplier',
    role: 'Gas Leak & Supply',
    category: 'emergency',
    phone: '1800-233-3555',
    notes: 'Indane Commercial - Leak support & refills'
  },
  {
    id: 'em-4',
    name: 'Local Electrician (Shaji Electricals)',
    role: 'Maintenance / Grid Issues',
    category: 'emergency',
    phone: '+91 98765 43210',
    notes: 'On-call electrician for industrial kitchen equipment'
  },
  {
    id: 'em-5',
    name: 'Emergency Plumbing & Drainage',
    role: 'Maintenance / Plumber',
    category: 'emergency',
    phone: '+91 87654 32109',
    notes: 'Quick-Fix Drainage - Water line repairs'
  },
  {
    id: 'em-6',
    name: 'Food Safety Inspector (Local Office)',
    role: 'Regulatory Compliance',
    category: 'emergency',
    phone: '+91 76543 21098',
    notes: 'FSSAI District Officer on duty'
  }
];

export default function ContactsPage() {
  // Contacts states
  const [customContacts, setCustomContacts] = useState<ContactItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<ContactItem[]>([]);
  const [staffList, setStaffList] = useState<ContactItem[]>([]);
  const [deletedContactIds, setDeletedContactIds] = useState<string[]>([]);
  
  // Overrides for non-custom contacts (emergency, supplier, staff)
  const [contactsOverrides, setContactsOverrides] = useState<Record<string, Partial<ContactItem>>>({});
  
  const [activeTab, setActiveTab] = useState<'all' | 'emergency' | 'supplier' | 'staff' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    role: '',
    category: 'custom' as ContactItem['category'],
    phone: '',
    email: '',
    notes: ''
  });

  // UI status states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Initial Load & Synchronization from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Custom / Emergency contacts added by manager
      const savedCustom = localStorage.getItem('qrestro_custom_contacts');
      if (savedCustom) {
        try {
          setCustomContacts(JSON.parse(savedCustom));
        } catch {}
      }

      // Deleted contact IDs
      const savedDeleted = localStorage.getItem('qrestro_deleted_contact_ids');
      if (savedDeleted) {
        try {
          setDeletedContactIds(JSON.parse(savedDeleted));
        } catch {}
      }

      // Overrides for editing default/staff/suppliers
      const savedOverrides = localStorage.getItem('qrestro_contacts_overrides');
      if (savedOverrides) {
        try {
          setContactsOverrides(JSON.parse(savedOverrides));
        } catch {}
      }

      // Suppliers contacts synced from inventory
      const savedSuppliers = localStorage.getItem('qrestro_suppliers');
      if (savedSuppliers) {
        try {
          const parsed = JSON.parse(savedSuppliers) as { name: string; mobile?: string; email?: string }[];
          const formatted = parsed.map((s, idx) => ({
            id: `sup-${idx}`,
            name: s.name,
            role: 'Supplier Partner',
            category: 'supplier' as const,
            phone: s.mobile || '—',
            email: s.email,
            notes: 'Registered raw inventory vendor'
          }));
          setSuppliersList(formatted);
        } catch {}
      } else {
        // Fallback default suppliers
        const defaultSups = [
          { id: 'sup-1', name: 'Prime Meats Ltd', role: 'Meat & Seafood Supplier', category: 'supplier' as const, phone: '+91 98888 12345', email: 'orders@primemeats.in', notes: 'Delivers daily at 6:00 AM' },
          { id: 'sup-2', name: 'Dairyland Foods', role: 'Dairy & Cheese Supplier', category: 'supplier' as const, phone: '+91 97777 54321', email: 'billing@dairyland.com', notes: 'FSSAI certified milk & butter supply' },
          { id: 'sup-3', name: 'Fresh Produce Hub', role: 'Vegetables & Fruits Supplier', category: 'supplier' as const, phone: '+91 96666 98765', email: 'sales@freshproduce.in', notes: 'Organic farming wholesale vendor' }
        ];
        setSuppliersList(defaultSups);
      }

      // Staff contacts synced from staff list
      const savedStaff = localStorage.getItem('qrestro_staff_list');
      if (savedStaff) {
        try {
          const parsed = JSON.parse(savedStaff) as { id: string; name: string; role: string; phone?: string; email?: string }[];
          const formatted = parsed.map(s => ({
            id: `staff-${s.id}`,
            name: s.name,
            role: s.role.toUpperCase(),
            category: 'staff' as const,
            phone: s.phone || '—',
            email: s.email,
            notes: 'Active restaurant employee'
          }));
          setStaffList(formatted);
        } catch {}
      } else {
        // Fallback default staff
        const defaultStaff = [
          { id: 'staff-1', name: 'Ramesh Kumar', role: 'HEAD CHEF', category: 'staff' as const, phone: '+91 98765 01234', email: 'ramesh.kumar@goldenplate.com', notes: 'Kitchen Shift Lead' },
          { id: 'staff-2', name: 'Jenny Doe', role: 'WAITER', category: 'staff' as const, phone: '+91 98765 12345', email: 'jenny.doe@goldenplate.com', notes: 'Front of House Service' },
          { id: 'staff-3', name: 'Vicky Singh', role: 'GENERAL MANAGER', category: 'staff' as const, phone: '+91 98765 23456', email: 'vicky.singh@goldenplate.com', notes: 'Administrative Lead' }
        ];
        setStaffList(defaultStaff);
      }
    }
  }, []);

  // Save custom contacts to LocalStorage
  const saveCustomContacts = (updatedList: ContactItem[]) => {
    setCustomContacts(updatedList);
    localStorage.setItem('qrestro_custom_contacts', JSON.stringify(updatedList));
  };

  // Save overrides to LocalStorage
  const saveOverrides = (updatedOverrides: Record<string, Partial<ContactItem>>) => {
    setContactsOverrides(updatedOverrides);
    localStorage.setItem('qrestro_contacts_overrides', JSON.stringify(updatedOverrides));
  };

  // Save deleted contact IDs to LocalStorage
  const saveDeletedIds = (ids: string[]) => {
    setDeletedContactIds(ids);
    localStorage.setItem('qrestro_deleted_contact_ids', JSON.stringify(ids));
  };

  // 2. Combine all data sources and merge local overrides
  const allContacts = useMemo(() => {
    const baseList = [
      ...DEFAULT_EMERGENCY_CONTACTS,
      ...suppliersList,
      ...staffList,
      ...customContacts
    ];

    return baseList
      .filter(c => !deletedContactIds.includes(c.id))
      .map(c => {
        const override = contactsOverrides[c.id];
        if (override) {
          return {
            ...c,
            ...override,
            id: c.id, // ID cannot be altered
            category: c.category // Category cannot be altered
          };
        }
        return c;
      });
  }, [suppliersList, staffList, customContacts, contactsOverrides, deletedContactIds]);

  // 3. Search and filtering logic
  const filteredContacts = useMemo(() => {
    return allContacts.filter(c => {
      // Tab Category filter
      if (activeTab !== 'all' && c.category !== activeTab) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.role.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.notes && c.notes.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [allContacts, activeTab, searchQuery]);

  // 4. Metrics summaries
  const metrics = useMemo(() => {
    return {
      total: allContacts.length,
      emergency: allContacts.filter(c => c.category === 'emergency').length,
      supplier: allContacts.filter(c => c.category === 'supplier').length,
      staff: allContacts.filter(c => c.category === 'staff').length,
      custom: allContacts.filter(c => c.category === 'custom').length
    };
  }, [allContacts]);

  // 5. Handlers
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.phone.trim()) return;

    if (editingContact) {
      // If it's a custom contact (created by user)
      if (editingContact.id.startsWith('custom-')) {
        const updated = customContacts.map(c =>
          c.id === editingContact.id
            ? {
                ...c,
                name: formState.name,
                role: formState.role,
                category: formState.category,
                phone: formState.phone,
                email: formState.email || undefined,
                notes: formState.notes || undefined
              }
            : c
        );
        saveCustomContacts(updated);
      } else {
        // Save as override for default, supplier, or staff contact
        const updatedOverrides = {
          ...contactsOverrides,
          [editingContact.id]: {
            name: formState.name,
            role: formState.role,
            phone: formState.phone,
            email: formState.email || undefined,
            notes: formState.notes || undefined
          }
        };
        saveOverrides(updatedOverrides);
      }
    } else {
      // Add mode (always custom)
      const newContact: ContactItem = {
        id: `custom-${Date.now()}`,
        name: formState.name,
        role: formState.role || 'Contact',
        category: formState.category,
        phone: formState.phone,
        email: formState.email || undefined,
        notes: formState.notes || undefined
      };
      saveCustomContacts([...customContacts, newContact]);
    }

    setIsModalOpen(false);
    setEditingContact(null);
    setFormState({
      name: '',
      role: '',
      category: 'custom',
      phone: '',
      email: '',
      notes: ''
    });
  };

  const handleEditClick = (contact: ContactItem) => {
    setEditingContact(contact);
    setFormState({
      name: contact.name,
      role: contact.role,
      category: contact.category,
      phone: contact.phone,
      email: contact.email || '',
      notes: contact.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteContact = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      if (id.startsWith('custom-')) {
        const updated = customContacts.filter(c => c.id !== id);
        saveCustomContacts(updated);
      } else {
        saveDeletedIds([...deletedContactIds, id]);
      }
    }
  };

  const handleResetContact = (id: string) => {
    if (confirm('Reset this contact details back to original defaults?')) {
      const updatedOverrides = { ...contactsOverrides };
      delete updatedOverrides[id];
      saveOverrides(updatedOverrides);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E1DA] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#2C261F]">Important Contacts</h1>
          <p className="text-xs text-[#8C8375] mt-1 font-medium">
            Manage emergency service links, ingredient supplier accounts, and staff phone logs. Edit any contact to add custom emails or comments.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingContact(null);
            setFormState({
              name: '',
              role: '',
              category: 'custom',
              phone: '',
              email: '',
              notes: ''
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-[#B88A52]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Contact</span>
        </button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'All Contacts', val: metrics.total, color: 'border-[#E6E1DA]', bg: 'bg-white' },
          { label: 'Emergency Services', val: metrics.emergency, color: 'border-rose-100', bg: 'bg-rose-50/30' },
          { label: 'Suppliers & Vendors', val: metrics.supplier, color: 'border-amber-100', bg: 'bg-[#FAF4EB]/30' },
          { label: 'Staff Directory', val: metrics.staff, color: 'border-emerald-100', bg: 'bg-emerald-50/20' },
          { label: 'Custom Notes', val: metrics.custom, color: 'border-blue-100', bg: 'bg-blue-50/20' }
        ].map((item, idx) => (
          <div key={idx} className={cn("border rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[5.5rem] h-auto bg-white transition-all hover:shadow-sm", item.color, item.bg)}>
            <span className="text-[10px] font-bold text-[#8C8375] uppercase tracking-wider">{item.label}</span>
            <span className="text-2xl font-black text-[#2C261F] font-mono mt-1">{item.val}</span>
          </div>
        ))}
      </div>

      {/* TOOLBAR CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FCFAF7] border border-[#E6E1DA] rounded-2xl p-4">
        {/* TAB CONTROLS */}
        <div className="flex flex-wrap items-center bg-white border border-[#EAE6DF] rounded-xl p-1 shadow-xs w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Contacts' },
            { id: 'emergency', label: 'Emergency / Services' },
            { id: 'supplier', label: 'Suppliers' },
            { id: 'staff', label: 'Staff Members' },
            { id: 'custom', label: 'Custom / Other' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex-1 sm:flex-initial text-center",
                activeTab === tab.id
                  ? "bg-[#B88A52] text-white shadow-xs"
                  : "text-[#5A5348] hover:bg-[#FAF7F2]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8375]" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-xs text-[#5A5348] font-semibold bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8375] hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* DIRECTORY LISTING */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white border border-[#E6E1DA] rounded-2xl p-12 text-center shadow-xs">
          <HelpCircle className="w-12 h-12 text-[#8C8375] mx-auto opacity-40 mb-3" />
          <h3 className="font-heading text-sm font-bold text-[#2C261F]">No Contacts Found</h3>
          <p className="text-xs text-[#8C8375] mt-1 max-w-xs mx-auto">
            Try adjusting your search terms, changing the category filter, or adding a new custom contact.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map(contact => {
            // Theme mapping based on contact category
            let badgeStyle = 'bg-gray-50 text-gray-700 border-gray-200';
            let avatarStyle = 'bg-gray-100 text-[#5A5348]';
            let cardAccent = 'hover:border-[#B88A52]/20';

            const isCustom = contact.id.startsWith('custom-');
            const hasOverride = !!contactsOverrides[contact.id];

            if (contact.category === 'emergency') {
              badgeStyle = 'bg-rose-50 text-rose-700 border-rose-100';
              avatarStyle = 'bg-rose-50 text-rose-700 border-rose-100';
              cardAccent = 'hover:border-rose-300/40';
            } else if (contact.category === 'supplier') {
              badgeStyle = 'bg-[#FAF4EB] text-[#B88A52] border-[#FAF0E2]';
              avatarStyle = 'bg-[#FAF4EB] text-[#B88A52] border-[#FAF0E2]';
              cardAccent = 'hover:border-[#B88A52]/30';
            } else if (contact.category === 'staff') {
              badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-100';
              avatarStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
              cardAccent = 'hover:border-emerald-300/40';
            } else if (contact.category === 'custom') {
              badgeStyle = 'bg-blue-50 text-blue-800 border-blue-100';
              avatarStyle = 'bg-blue-50 text-blue-700 border-blue-100';
              cardAccent = 'hover:border-blue-300/40';
            }

            return (
              <div
                key={contact.id}
                className={cn(
                  "bg-white border border-[#E6E1DA] rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between hover:shadow-md relative overflow-hidden group",
                  cardAccent,
                  hasOverride && "border-[#B88A52]/30 shadow-[#B88A52]/3"
                )}
              >
                {/* Visual badge highlight */}
                {contact.category === 'emergency' && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Initials Avatar */}
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border", avatarStyle)}>
                        {getInitials(contact.name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-heading text-xs font-black text-[#2C261F] truncate group-hover:text-[#B88A52] transition-colors" title={contact.name}>
                          {contact.name}
                        </h4>
                        <p className="text-[10px] text-[#8C8375] font-bold mt-0.5 uppercase tracking-wider truncate">
                          {contact.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border", badgeStyle)}>
                        {contact.category === 'emergency' ? 'EMERGENCY' : contact.category}
                      </span>
                      {hasOverride && (
                        <span className="text-[7px] bg-[#FAF4EB] text-[#B88A52] font-extrabold px-1 rounded border border-[#B88A52]/10 uppercase tracking-wide">
                          Modified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info lines */}
                  <div className="mt-5 space-y-2 border-t border-[#F3EFEA] pt-4 text-xs font-semibold text-[#5A5348]">
                    {/* Phone Block */}
                    <div className="flex items-center justify-between gap-2 hover:bg-[#FAF7F2] p-1.5 rounded-lg transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-3.5 h-3.5 text-[#8C8375] shrink-0" />
                        <span className="font-mono text-[11px] truncate">{contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                          className="p-1 text-[#8C8375] hover:text-[#B88A52] hover:bg-white rounded border border-transparent hover:border-[#E6E1DA] transition-all cursor-pointer"
                          title="Dial phone number"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleCopy(contact.id + '-phone', contact.phone)}
                          className="p-1 text-[#8C8375] hover:text-[#B88A52] hover:bg-white rounded border border-transparent hover:border-[#E6E1DA] transition-all cursor-pointer relative"
                          title="Copy phone"
                        >
                          {copiedId === contact.id + '-phone' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Email Block */}
                    <div className="flex items-center justify-between gap-2 hover:bg-[#FAF7F2] p-1.5 rounded-lg transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-[#8C8375] shrink-0" />
                        {contact.email ? (
                          <span className="truncate text-[10px] lowercase">{contact.email}</span>
                        ) : (
                          <span className="text-[10px] text-[#8C8375]/50 italic">No email added</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {contact.email ? (
                          <>
                            <a
                              href={`mailto:${contact.email}`}
                              className="p-1 text-[#8C8375] hover:text-[#B88A52] hover:bg-white rounded border border-transparent hover:border-[#E6E1DA] transition-all cursor-pointer"
                              title="Compose email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleCopy(contact.id + '-email', contact.email || '')}
                              className="p-1 text-[#8C8375] hover:text-[#B88A52] hover:bg-white rounded border border-transparent hover:border-[#E6E1DA] transition-all cursor-pointer"
                              title="Copy email"
                            >
                              {copiedId === contact.id + '-email' ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditClick(contact)}
                            className="text-[9px] text-[#B88A52] hover:underline px-1 py-0.5 rounded cursor-pointer font-bold"
                            title="Click to add email"
                          >
                            + Add Email
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notes block */}
                    <div className="mt-1 bg-[#FCFAF7] border border-[#F0ECE6] rounded-xl p-2.5 min-h-[3.25rem] flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-[#B88A52] shrink-0 mt-0.5" />
                      {contact.notes ? (
                        <p className="text-[10px] text-[#8C8375] font-medium leading-relaxed italic">
                          {contact.notes}
                        </p>
                      ) : (
                        <p className="text-[10px] text-[#8C8375]/40 font-medium leading-relaxed italic">
                          No comments or availability notes logged. Click edit to add.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit & Action buttons (Now visible for ALL contacts!) */}
                <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-[#F3EFEA]">
                  <button
                    onClick={() => handleEditClick(contact)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E6E1DA] hover:bg-[#FAF7F2] text-[#8C8375] hover:text-[#B88A52] text-[10px] font-bold transition-all cursor-pointer"
                    title="Edit contact information, email, or comments"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Info</span>
                  </button>

                  {/* Custom contact: Delete | Default contact overridden: Reset */}
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {!isCustom && hasOverride && (
                    <button
                      onClick={() => handleResetContact(contact.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-50 text-amber-600 hover:text-amber-800 text-[10px] font-bold transition-all cursor-pointer"
                      title="Reset custom overrides back to defaults"
                    >
                      <RotateCcw className="w-3 h-3 animate-reverse" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE & EDIT CONTACT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#E6E1DA] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="bg-[#2C261F] text-white p-4 flex items-center justify-between border-b-2 border-[#B88A52]">
              <div>
                <h3 className="font-heading text-xs font-black uppercase tracking-wider text-[#B88A52]">
                  {editingContact ? `Edit Contact: ${editingContact.name.substring(0, 25)}${editingContact.name.length > 25 ? '...' : ''}` : 'Register Custom Contact'}
                </h3>
                <p className="text-[10px] text-gray-300 mt-0.5 font-medium">
                  {editingContact ? 'Modify telephone details, email, or comments' : 'Record a localized service number'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-5 space-y-4">
              {/* Category Select */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8375] mb-1.5">Category</label>
                <select
                  disabled={editingContact ? !editingContact.id.startsWith('custom-') : false}
                  value={formState.category}
                  onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full text-xs font-bold px-3 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <option value="custom">Custom / Other</option>
                  <option value="emergency">Emergency / Maintenance Service</option>
                  <option value="supplier">Supplier / Vendor</option>
                  <option value="staff">Staff Member</option>
                </select>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8375] mb-1.5">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shaji Commercial Gas Line Support"
                  value={formState.name}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs font-bold px-3 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] placeholder-[#8C8375]/50 bg-white"
                />
              </div>

              {/* Role / Job Title */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8375] mb-1.5">Role / Service Description</label>
                <input
                  type="text"
                  placeholder="e.g. Gas Repairs / Plumber"
                  value={formState.role}
                  onChange={(e) => setFormState(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full text-xs font-bold px-3 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] placeholder-[#8C8375]/50 bg-white"
                />
              </div>

              {/* Contact Info (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8375] mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 99999 88888"
                    value={formState.phone}
                    onChange={(e) => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] placeholder-[#8C8375]/50 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8375] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. support@provider.com"
                    value={formState.email}
                    onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] placeholder-[#8C8375]/50 bg-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8375] mb-1.5">Comments & Availability Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Available 24/7 for urgent leak complaints. Email for commercial invoice copies."
                  value={formState.notes}
                  onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-xs font-medium px-3 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#5A5348] placeholder-[#8C8375]/50 bg-white resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3EFEA]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E6E1DA] hover:bg-[#FAF7F2] text-[#5A5348] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
