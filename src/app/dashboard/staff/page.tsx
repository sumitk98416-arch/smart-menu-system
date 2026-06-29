'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Users, UserPlus, Calendar, Search, Star, Phone, Mail, Award, Clock, 
  MapPin, X, Plus, Edit2, Trash2, ShieldAlert, CheckCircle, ArrowRight, ShieldCheck, 
  UserCheck, Compass, Heart, Clipboard, HelpCircle, Lock, Unlock,
  Sunrise, Sun, Moon, Coffee, Briefcase, Sparkles, Settings, Trash, Info, DollarSign, Download,

} from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';


// Premium icons mapping for customizable shifts - strictly no emojis!
const SHIFT_ICONS: Record<string, React.ComponentType<any>> = {
  sunrise: Sunrise,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  briefcase: Briefcase,
  sparkles: Sparkles,
  clock: Clock
};

// Available premium brand-harmony accent colors for shifts
const SHIFT_COLORS = [
  { id: 'amber', label: 'Gold / Amber', bg: 'bg-amber-50/70 border-amber-200 text-amber-700' },
  { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-50/70 border-emerald-200 text-emerald-700' },
  { id: 'indigo', label: 'Royal Indigo', bg: 'bg-indigo-50/70 border-indigo-200 text-indigo-700' },
  { id: 'slate', label: 'Slate Grey', bg: 'bg-slate-50 border-slate-200 text-slate-500' },
  { id: 'purple', label: 'Imperial Purple', bg: 'bg-purple-50/70 border-purple-200 text-purple-700' },
  { id: 'rose', label: 'Rose Red', bg: 'bg-rose-50/70 border-rose-200 text-rose-700' },
  { id: 'bronze', label: 'Warm Bronze', bg: 'bg-orange-50/70 border-orange-200 text-orange-800' }
] as const;

// Interface for customizable shift type
interface ShiftType {
  id: string; // 'morning', 'afternoon', 'night', 'off', or dynamic ids
  name: string; // Custom Name (e.g., Morning Shift)
  hours: string; // Custom Timings (e.g., 08:00 AM - 04:00 PM)
  color: 'amber' | 'emerald' | 'indigo' | 'slate' | 'purple' | 'rose' | 'bronze';
  iconName: 'sunrise' | 'sun' | 'moon' | 'coffee' | 'briefcase' | 'sparkles' | 'clock';
}

const ShiftIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComp = SHIFT_ICONS[name.toLowerCase()] || Clock;
  return <IconComp className={className} />;
};

// Types for staff members
interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: 'clocked_in' | 'on_break' | 'off_duty';
  phone: string;
  email: string;
  address: string;
  idProof: string;
  shift: 'morning' | 'afternoon' | 'night';
  hourlyRate: number;
  joinedDate: string;
  performanceRating: number;
  totalOrdersServed: number;
  avgServingTimeMinutes: number;
  assignedTables?: string[]; // Waiters only
  assignedSection?: string;   // Chefs/Managers only
  profilePicture?: string;
  weeklyShifts: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

interface AttendanceRecord {
  id: string;
  staffId: string;
  name: string;
  role: string;
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: 'present' | 'absent' | 'on_leave';
}

interface PayrollRecord {
  monthKey: string;
  staffId: string;
  bonus: number;
  deductions: number;
  absenceDeductions?: number;
  status: 'Pending' | 'Processing' | 'Paid';
}

const TODAY_DATE = '2026-05-27';

const getDefaultWeeklyShifts = (primaryShift: 'morning' | 'afternoon' | 'night', idNum: number) => {
  const days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  const firstOffIndex = idNum % 7;
  const secondOffIndex = (idNum + 1) % 7;
  const weekly: Record<string, any> = {};
  days.forEach((day, idx) => {
    if (idx === firstOffIndex || idx === secondOffIndex) {
      weekly[day] = 'off';
    } else {
      weekly[day] = primaryShift;
    }
  });
  return weekly as {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
};

// 1. Initial Mock Staff Data representing a premium restaurateur dashboard
const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'emp-1',
    name: 'Ramesh Kumar',
    role: 'chef',
    status: 'clocked_in',
    phone: '+91 98765 01234',
    email: 'ramesh.kumar@goldenplate.com',
    address: 'A-102, Shanti Nagar, Pune',
    idProof: 'Aadhar Card: 8493-2048-1102',
    shift: 'morning',
    hourlyRate: 35000,
    joinedDate: '2024-04-12',
    performanceRating: 4.8,
    totalOrdersServed: 1450,
    avgServingTimeMinutes: 14,
    assignedSection: 'Tandoor & Curry Main Range',
    weeklyShifts: getDefaultWeeklyShifts('morning', 1)
  },
  {
    id: 'emp-2',
    name: 'Jenny Doe',
    role: 'waiter',
    status: 'clocked_in',
    phone: '+91 98765 56789',
    email: 'jenny.doe@goldenplate.com',
    address: 'Flat 405, Koregaon Park, Pune',
    idProof: 'Passport: Z-2048-9104',
    shift: 'afternoon',
    hourlyRate: 20000,
    joinedDate: '2025-01-20',
    performanceRating: 4.9,
    totalOrdersServed: 840,
    avgServingTimeMinutes: 8,
    assignedTables: ['Table 1', 'Table 2', 'Table 3'],
    weeklyShifts: getDefaultWeeklyShifts('afternoon', 2)
  },
  {
    id: 'emp-3',
    name: 'Vicky Singh',
    role: 'manager',
    status: 'clocked_in',
    phone: '+91 98765 99999',
    email: 'vicky.singh@goldenplate.com',
    address: 'Lane 7, Kalyani Nagar, Pune',
    idProof: 'Driving License: DL-3920-5829',
    shift: 'morning',
    hourlyRate: 50000,
    joinedDate: '2023-08-01',
    performanceRating: 4.7,
    totalOrdersServed: 320,
    avgServingTimeMinutes: 0,
    assignedSection: 'Main Floor & Guest Relations',
    weeklyShifts: getDefaultWeeklyShifts('morning', 3)
  },
  {
    id: 'emp-4',
    name: 'Priya Patel',
    role: 'cashier',
    status: 'clocked_in',
    phone: '+91 98765 44444',
    email: 'priya.patel@goldenplate.com',
    address: 'Sector 15, Vashi, Navi Mumbai',
    idProof: 'PAN Card: BPLPP5829A',
    shift: 'morning',
    hourlyRate: 22000,
    joinedDate: '2024-09-15',
    performanceRating: 4.9,
    totalOrdersServed: 2100, // transactions
    avgServingTimeMinutes: 3,
    assignedSection: 'POS Terminal 1',
    weeklyShifts: getDefaultWeeklyShifts('morning', 4)
  },
  {
    id: 'emp-5',
    name: 'David Smith',
    role: 'waiter',
    status: 'on_break',
    phone: '+91 98765 22222',
    email: 'david.smith@goldenplate.com',
    address: '12 Orchid Close, Camp, Pune',
    idProof: 'Voter ID: NY-1048-3920',
    shift: 'afternoon',
    hourlyRate: 19000,
    joinedDate: '2025-02-10',
    performanceRating: 4.5,
    totalOrdersServed: 410,
    avgServingTimeMinutes: 11,
    assignedTables: ['Table 4', 'Table 5'],
    weeklyShifts: getDefaultWeeklyShifts('afternoon', 5)
  },
  {
    id: 'emp-6',
    name: 'Rahul Verma',
    role: 'chef',
    status: 'off_duty',
    phone: '+91 98765 88888',
    email: 'rahul.verma@goldenplate.com',
    address: 'H-3/42, Karol Bagh, New Delhi',
    idProof: 'Aadhar Card: 9104-5829-2048',
    shift: 'night',
    hourlyRate: 33000,
    joinedDate: '2024-11-01',
    performanceRating: 4.6,
    totalOrdersServed: 630,
    avgServingTimeMinutes: 18,
    assignedSection: 'Continental & Deep Fry Section',
    weeklyShifts: getDefaultWeeklyShifts('night', 6)
  },
  {
    id: 'emp-7',
    name: 'Sneha Reddy',
    role: 'waiter',
    status: 'off_duty',
    phone: '+91 98765 33333',
    email: 'sneha.reddy@goldenplate.com',
    address: 'Plot 88, Jubilee Hills, Hyderabad',
    idProof: 'Passport: P-4920-1038',
    shift: 'morning',
    hourlyRate: 21000,
    joinedDate: '2024-06-05',
    performanceRating: 4.8,
    totalOrdersServed: 1220,
    avgServingTimeMinutes: 7,
    assignedTables: ['Table 6', 'VIP Salon 1'],
    weeklyShifts: getDefaultWeeklyShifts('morning', 7)
  }
];

// Helper to pre-generate at least 3 months (90 days) of realistic attendance logs
const generateThreeMonthsAttendance = (staff: StaffMember[]): AttendanceRecord[] => {
  const logs: AttendanceRecord[] = [];
  const today = new Date(TODAY_DATE);
  
  for (let i = 0; i < 90; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    staff.forEach(s => {
      // Deterministic hash/seed so that values are consistent and stable across hot-reloads
      const charSum = s.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const seed = (charSum + currentDate.getDate() * 11 + currentDate.getMonth() * 37) % 100;
      
      let status: AttendanceRecord['status'] = 'present';
      let clockInTime: string | null = null;
      let clockOutTime: string | null = null;
      
      // Managers and cashiers rarely take leaves; let's model a realistic weekend / off-duty structure
      if (seed < 4) {
        status = 'on_leave';
      } else if (seed < 8) {
        status = 'absent';
      } else {
        status = 'present';
        if (s.shift === 'morning') {
          const inMin = 45 + (seed % 15);
          clockInTime = `07:${inMin.toString().padStart(2, '0')} AM`;
          if (i > 0) {
            const outMin = (seed % 20);
            clockOutTime = `04:${outMin.toString().padStart(2, '0')} PM`;
          }
        } else if (s.shift === 'afternoon') {
          const inMin = 45 + (seed % 15);
          clockInTime = `11:${inMin.toString().padStart(2, '0')} AM`;
          if (i > 0) {
            const outMin = (seed % 20);
            clockOutTime = `08:${outMin.toString().padStart(2, '0')} PM`;
          }
        } else { // night shift
          const inMin = 45 + (seed % 15);
          clockInTime = `08:${inMin.toString().padStart(2, '0')} PM`;
          if (i > 0) {
            const outMin = (seed % 20);
            clockOutTime = `05:${outMin.toString().padStart(2, '0')} AM`;
          }
        }
      }
      
      // Today (i === 0) overrides to match current dashboard active states
      if (i === 0) {
        if (s.id === 'emp-1' || s.id === 'emp-2' || s.id === 'emp-3' || s.id === 'emp-4') {
          status = 'present';
          clockInTime = s.id === 'emp-1' ? '08:30 AM' : s.id === 'emp-2' ? '12:15 PM' : s.id === 'emp-3' ? '08:00 AM' : '09:00 AM';
          clockOutTime = null;
        } else if (s.id === 'emp-5') {
          status = 'present';
          clockInTime = '12:30 PM';
          clockOutTime = null;
        } else if (s.id === 'emp-6') {
          status = 'absent';
          clockInTime = null;
          clockOutTime = null;
        } else if (s.id === 'emp-7') {
          status = 'on_leave';
          clockInTime = null;
          clockOutTime = null;
        }
      }
      
      logs.push({
        id: `att-${dateStr}-${s.id}`,
        staffId: s.id,
        name: s.name,
        role: s.role,
        date: dateStr,
        clockInTime,
        clockOutTime,
        status
      });
    });
  }
  
  return logs;
};

// Converts 12-hour AM/PM string (e.g., '08:30 AM') to native 24-hour value (e.g., '08:30')
const timeStringTo24H = (timeStr: string | null): string => {
  if (!timeStr) return '';
  const match = timeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '';
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Converts native 24-hour value (e.g., '17:00') to 12-hour AM/PM string (e.g., '05:00 PM')
const time24HToString = (time24: string): string => {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length !== 2) return '';
  
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  if (hours === 0) hours = 12;
  
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const INITIAL_SHIFT_TYPES: ShiftType[] = [
  { id: 'morning', name: 'Morning', hours: '08:00 AM - 04:00 PM', color: 'amber', iconName: 'sunrise' },
  { id: 'afternoon', name: 'Afternoon', hours: '04:00 PM - 12:00 AM', color: 'emerald', iconName: 'sun' },
  { id: 'night', name: 'Night', hours: '12:00 AM - 08:00 AM', color: 'indigo', iconName: 'moon' },
  { id: 'off', name: 'OFF', hours: 'Rest Day', color: 'slate', iconName: 'coffee' }
];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isStaffLoaded, setIsStaffLoaded] = useState(false);

  useEffect(() => {
    const isFresh = localStorage.getItem('qrestro_demo_fresh_signup') === 'true';
    const stored = localStorage.getItem('qrestro_staff_list');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setStaffList(parsed.map((s: any) => ({
            ...s,
            status: s.status || 'off_duty',
            weeklyShifts: s.weeklyShifts || getDefaultWeeklyShifts(s.shift || 'morning', parseInt(s.id?.replace('emp-', '') || '1', 10))
          })));
        } else {
          setStaffList(isFresh ? [] : INITIAL_STAFF);
        }
      } catch (e) {
        setStaffList(isFresh ? [] : INITIAL_STAFF);
      }
    } else {
      setStaffList(isFresh ? [] : INITIAL_STAFF);
    }
    setIsStaffLoaded(true);
  }, []);

  useEffect(() => {
    if (isStaffLoaded) {
      localStorage.setItem('qrestro_staff_list', JSON.stringify(staffList));
    }
  }, [staffList, isStaffLoaded]);

  // Dynamic shift types customization state
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>(INITIAL_SHIFT_TYPES);
  const [isShiftManagerOpen, setIsShiftManagerOpen] = useState(false);
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null);
  
  const [shiftTypeForm, setShiftTypeForm] = useState({
    id: '',
    name: '',
    hours: '',
    color: 'amber' as ShiftType['color'],
    iconName: 'sunrise' as ShiftType['iconName']
  });

  const handleSaveShiftType = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShiftType) {
      // Editing existing shift type
      setShiftTypes(prev => prev.map(st => st.id === editingShiftType.id ? {
        ...st,
        name: shiftTypeForm.name,
        hours: shiftTypeForm.hours,
        color: shiftTypeForm.color,
        iconName: shiftTypeForm.iconName
      } : st));
      
      // Update any staff primary shifts if their ID matches a core shift type
      if (['morning', 'afternoon', 'night'].includes(editingShiftType.id)) {
        // No structural change needed, but the name/hours change cascades dynamically via the state
      }
      setEditingShiftType(null);
    } else {
      // Creating new shift type
      const newId = `custom-${Date.now()}`;
      const newST: ShiftType = {
        id: newId,
        name: shiftTypeForm.name,
        hours: shiftTypeForm.hours,
        color: shiftTypeForm.color,
        iconName: shiftTypeForm.iconName
      };
      setShiftTypes(prev => [...prev, newST]);
    }
    // Reset Form
    setShiftTypeForm({
      id: '',
      name: '',
      hours: '',
      color: 'amber',
      iconName: 'sunrise'
    });
  };

  const handleDeleteShiftType = (id: string) => {
    if (['morning', 'afternoon', 'night', 'off'].includes(id)) {
      alert('Core restaurant shifts (Morning, Afternoon, Night, and OFF) cannot be deleted to preserve system operation.');
      return;
    }
    if (confirm('Are you sure you want to delete this shift type? Any staff scheduled on this shift will revert to "OFF".')) {
      setShiftTypes(prev => prev.filter(st => st.id !== id));
      // Re-assign employees scheduled on this shift to 'off'
      setStaffList(prev => prev.map(s => {
        const updatedWeekly = { ...s.weeklyShifts };
        let changed = false;
        (Object.keys(updatedWeekly) as Array<keyof typeof updatedWeekly>).forEach(day => {
          if (updatedWeekly[day] === id) {
            updatedWeekly[day] = 'off';
            changed = true;
          }
        });
        return changed ? { ...s, weeklyShifts: updatedWeekly } : s;
      }));
    }
  };

  const startEditShiftType = (st: ShiftType) => {
    setEditingShiftType(st);
    setShiftTypeForm({
      id: st.id,
      name: st.name,
      hours: st.hours,
      color: st.color,
      iconName: st.iconName
    });
  };

  // 2. Interactive Page State
  const [selectedStaffId, setSelectedStaffId] = useState<string>('emp-2'); // Waiter Jenny selected by default
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // 3. Modal Toggles
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isRosterDetailsOpen, setIsRosterDetailsOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [modalSelectedStaffId, setModalSelectedStaffId] = useState<string>('emp-1');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState(TODAY_DATE);

  // 3.5. Initial Mock Attendance Records representing today and 3-month history
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const isFresh = localStorage.getItem('qrestro_demo_fresh_signup') === 'true';
      const stored = localStorage.getItem('qrestro_attendance_logs');
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
      if (isFresh) return [];
    }
    return generateThreeMonthsAttendance(INITIAL_STAFF);
  });
  
  const isLocked = attendanceDateFilter !== TODAY_DATE;

  // 3.7. Staff Salary & Payroll Management States
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>('2026-05');
  const [isMayUnlockedOverride, setIsMayUnlockedOverride] = useState(false);
  const [payrollList, setPayrollList] = useState<PayrollRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const isFresh = localStorage.getItem('qrestro_demo_fresh_signup') === 'true';
      const stored = localStorage.getItem('qrestro_payroll');
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
      if (isFresh) return [];
    }
    const records: PayrollRecord[] = [];
    const months = ['2026-03', '2026-04', '2026-05'];
    months.forEach(month => {
      INITIAL_STAFF.forEach(s => {
        const charSum = s.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hasBonus = (charSum + (month === '2026-04' ? 17 : 29)) % 100 < 45;
        const hasDeductions = (charSum + (month === '2026-04' ? 13 : 41)) % 100 < 35;
        records.push({
          monthKey: month,
          staffId: s.id,
          bonus: hasBonus ? ((charSum % 5) + 1) * 1000 : 0,
          deductions: hasDeductions ? ((charSum % 3) + 1) * 500 : 0,
          status: month === '2026-05' ? 'Pending' as const : 'Paid' as const,
        });
      });
    });
    return records;
  });

  useEffect(() => {
    localStorage.setItem('qrestro_attendance_logs', JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  useEffect(() => {
    localStorage.setItem('qrestro_payroll', JSON.stringify(payrollList));
  }, [payrollList]);
  const isAllPaidInMonth = useMemo(() => {
    const records = payrollList.filter(p => p.monthKey === selectedPayrollMonth);
    return records.length > 0 && records.every(p => p.status === 'Paid');
  }, [payrollList, selectedPayrollMonth]);

  const isPayrollMonthLocked = useMemo(() => {
    if (selectedPayrollMonth !== '2026-05') return true;
    if (isAllPaidInMonth && !isMayUnlockedOverride) return true;
    return false;
  }, [selectedPayrollMonth, isAllPaidInMonth, isMayUnlockedOverride]);
  
  // Helper to dynamically calculate total present, absent, and leave days in the active month
  const calculateAttendanceDays = (staffId: string, monthKey: string) => {
    const activeMonthLogs = attendanceLogs.filter(log => 
      log.staffId === staffId && 
      log.date.startsWith(monthKey)
    );
    
    let present = 0;
    let absent = 0;
    let leave = 0;
    
    activeMonthLogs.forEach(log => {
      if (log.status === 'present') present++;
      else if (log.status === 'absent') absent++;
      else if (log.status === 'on_leave') leave++;
    });
    
    return { present, absent, leave };
  };

  const updatePayrollBonus = (staffId: string, bonusValue: number) => {
    setPayrollList(prev => prev.map(p => (p.staffId === staffId && p.monthKey === selectedPayrollMonth) ? { ...p, bonus: Math.max(0, bonusValue) } : p));
  };

  const updatePayrollDeductions = (staffId: string, deductionValue: number) => {
    setPayrollList(prev => prev.map(p => (p.staffId === staffId && p.monthKey === selectedPayrollMonth) ? { ...p, deductions: Math.max(0, deductionValue) } : p));
  };

  const updatePayrollAbsenceDeductions = (staffId: string, valStr: string) => {
    const val = valStr === '' ? undefined : Math.max(0, Number(valStr));
    setPayrollList(prev => prev.map(p => (p.staffId === staffId && p.monthKey === selectedPayrollMonth) ? { ...p, absenceDeductions: val } : p));
  };
// PDF generation — professional branded payroll report
  const generatePayrollPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const PW = 297;
      const monthLabel = selectedPayrollMonth === '2026-05' ? 'May' : selectedPayrollMonth === '2026-04' ? 'April' : 'March';
      const generatedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      // Read actual restaurant name from localStorage (same key as layout.tsx)
      let restaurantName = 'The Golden Plate';
      try {
        const saved = localStorage.getItem('qrestro_demo_restaurant');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name) restaurantName = parsed.name;
        }
      } catch { /* fallback to default */ }

      // ── 1. HEADER BANNER ──
      doc.setFillColor(44, 38, 31);
      doc.rect(0, 0, PW, 30, 'F');
      // Gold accent stripe
      doc.setFillColor(184, 138, 82);
      doc.rect(0, 30, PW, 2.5, 'F');
      // Company name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text(restaurantName, 14, 13);
      // Report subtitle
      doc.setFontSize(9);
      doc.setTextColor(184, 138, 82);
      doc.text('STAFF PAYROLL REPORT  |  ' + monthLabel.toUpperCase() + ' 2026', 14, 22);
      // Date on right
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(180, 165, 140);
      doc.text('Generated: ' + generatedDate, PW - 14, 13, { align: 'right' });
      doc.text('Pay Period: 01 ' + monthLabel + ' 2026 - 30 ' + monthLabel + ' 2026', PW - 14, 22, { align: 'right' });

      // ── 2. SUMMARY STAT CARDS ──
      const totalStaff = staffList.length;
      const paidCount = payrollList.filter(p => p.monthKey === selectedPayrollMonth && p.status === 'Paid').length;
      const pendingCount = totalStaff - paidCount;
      const totalGross = staffList.reduce((s, st) => s + st.hourlyRate, 0);
      const totalNet = staffList.reduce((sum, staff) => {
        const rec = payrollList.find(p => p.staffId === staff.id && p.monthKey === selectedPayrollMonth) || { bonus: 0, deductions: 0, absenceDeductions: undefined, status: 'Pending' } as PayrollRecord;
        const d = calculateAttendanceDays(staff.id, selectedPayrollMonth);
        const autoAbs = Math.round((staff.hourlyRate / 30) * d.absent);
        const absD = rec.absenceDeductions !== undefined ? rec.absenceDeductions! : autoAbs;
        return sum + Math.round(staff.hourlyRate - absD - (rec.deductions ?? 0) + (rec.bonus ?? 0));
      }, 0);
      const totalDeductions = totalGross - totalNet;

      const cards = [
        { label: 'TOTAL EMPLOYEES', value: String(totalStaff), sub: paidCount + ' Paid  |  ' + pendingCount + ' Pending' },
        { label: 'TOTAL GROSS SALARY', value: 'Rs.' + totalGross.toLocaleString('en-IN'), sub: 'Sum of all base salaries' },
        { label: 'TOTAL DEDUCTIONS', value: 'Rs.' + totalDeductions.toLocaleString('en-IN'), sub: 'Absence + other deductions' },
        { label: 'NET PAYROLL EXPENSE', value: 'Rs.' + totalNet.toLocaleString('en-IN'), sub: 'After deductions & bonuses' },
      ];
      const cardW = (PW - 28 - 9) / 4;
      let cardX = 14;
      const cardY = 36;
      cards.forEach((card) => {
        doc.setFillColor(250, 247, 242);
        doc.setDrawColor(220, 215, 208);
        doc.roundedRect(cardX, cardY, cardW, 20, 2, 2, 'FD');
        doc.setFillColor(184, 138, 82);
        doc.rect(cardX, cardY, 2.5, 20, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(130, 118, 106);
        doc.text(card.label, cardX + 5, cardY + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(44, 38, 31);
        doc.text(card.value, cardX + 5, cardY + 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(150, 140, 125);
        doc.text(card.sub, cardX + 5, cardY + 18.5);
        cardX += cardW + 3;
      });

      // ── 3. SECTION TITLE ──
      let y = 62;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(184, 138, 82);
      doc.text('DETAILED EMPLOYEE SALARY BREAKDOWN', 14, y);
      doc.setDrawColor(184, 138, 82);
      doc.setLineWidth(0.4);
      doc.line(14, y + 1.5, 130, y + 1.5);
      y += 5;

      // ── 4. TABLE HEADERS (fully labeled, 2-line where needed) ──
      const colDefs = [
        { label: 'Employee Name', w: 36 },
        { label: 'Designation', w: 28 },
        { label: 'Base Salary\n(Rs.)', w: 24 },
        { label: 'Days\nPresent', w: 18 },
        { label: 'Days\nAbsent', w: 17 },
        { label: 'Absence\nDeduction (Rs.)', w: 28 },
        { label: 'Other\nDeductions (Rs.)', w: 27 },
        { label: 'Incentive /\nBonus (Rs.)', w: 26 },
        { label: 'Net Payout\n(Rs.)', w: 26 },
        { label: 'Payment\nStatus', w: 21 },
      ];
      const headerH = 12;
      const rowH = 8;
      const startX = 14;

      // Header background
      doc.setFillColor(44, 38, 31);
      let hx = startX;
      colDefs.forEach(col => { doc.rect(hx, y, col.w, headerH, 'F'); hx += col.w; });

      // Header text (2-line support)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      hx = startX;
      colDefs.forEach(col => {
        const lines = col.label.split('\n');
        if (lines.length === 2) {
          doc.text(lines[0], hx + 1.5, y + 5);
          doc.text(lines[1], hx + 1.5, y + 9.5);
        } else {
          doc.text(lines[0], hx + 1.5, y + 7);
        }
        hx += col.w;
      });
      y += headerH;

      // ── 5. DATA ROWS ──
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      staffList.forEach((staff, idx) => {
        const rec = payrollList.find(p => p.staffId === staff.id && p.monthKey === selectedPayrollMonth) || { bonus: 0, deductions: 0, absenceDeductions: undefined, status: 'Pending' } as PayrollRecord;
        const d = calculateAttendanceDays(staff.id, selectedPayrollMonth);
        const autoAbs = Math.round((staff.hourlyRate / 30) * d.absent);
        const absD = rec.absenceDeductions !== undefined ? rec.absenceDeductions! : autoAbs;
        const netPay = Math.round(staff.hourlyRate - absD - (rec.deductions ?? 0) + (rec.bonus ?? 0));
        const status = rec.status ?? 'Pending';

        const isEven = idx % 2 === 0;
        doc.setFillColor(isEven ? 252 : 246, isEven ? 250 : 247, isEven ? 247 : 243);
        let rx = startX;
        colDefs.forEach(col => { doc.rect(rx, y, col.w, rowH, 'F'); rx += col.w; });

        // Row border
        doc.setDrawColor(220, 215, 208);
        doc.setLineWidth(0.2);
        doc.line(startX, y + rowH, startX + colDefs.reduce((a, c) => a + c.w, 0), y + rowH);

        const rowData = [
          staff.name,
          staff.role,
          'Rs.' + staff.hourlyRate.toLocaleString('en-IN'),
          String(d.present) + ' days',
          String(d.absent) + ' days',
          'Rs.' + absD.toLocaleString('en-IN'),
          'Rs.' + (rec.deductions ?? 0).toLocaleString('en-IN'),
          'Rs.' + (rec.bonus ?? 0).toLocaleString('en-IN'),
          'Rs.' + netPay.toLocaleString('en-IN'),
          status,
        ];

        rx = startX;
        doc.setTextColor(44, 38, 31);
        rowData.forEach((cell, i) => {
          const maxChars = Math.floor(colDefs[i].w / 1.85);
          const text = cell.length > maxChars ? cell.substring(0, maxChars - 1) + '.' : cell;
          if (i === 9) {
            if (status === 'Paid') { doc.setTextColor(22, 163, 74); doc.setFont('helvetica', 'bold'); }
            else if (status === 'Pending') { doc.setTextColor(202, 138, 4); doc.setFont('helvetica', 'bold'); }
            else { doc.setTextColor(220, 38, 38); doc.setFont('helvetica', 'bold'); }
          } else {
            doc.setTextColor(44, 38, 31);
            doc.setFont('helvetica', 'normal');
          }
          doc.text(text, rx + 1.5, y + 5.5);
          rx += colDefs[i].w;
        });
        y += rowH;
        if (y > 185) { doc.addPage(); y = 14; }
      });

      // ── 6. GRAND TOTAL ROW ──
      doc.setFillColor(184, 138, 82);
      let tx = startX;
      colDefs.forEach(col => { doc.rect(tx, y, col.w, rowH + 1, 'F'); tx += col.w; });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('GRAND TOTAL', startX + 1.5, y + 6);
      const netColX = startX + colDefs.slice(0, 8).reduce((a, c) => a + c.w, 0);
      doc.text('Rs.' + totalNet.toLocaleString('en-IN'), netColX + 1.5, y + 6);
      y += rowH + 1;

      // ── 7. LEGEND / KEY ──
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 95, 88);
      doc.text('KEY & FORMULA:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(22, 163, 74);
      doc.text('Paid', 52, y);
      doc.setTextColor(202, 138, 4);
      doc.text('Pending', 65, y);
      doc.setTextColor(220, 38, 38);
      doc.text('On Hold', 83, y);
      doc.setTextColor(100, 95, 88);
      doc.text('   |   Absence Deduction = (Base Salary / 30) x Absent Days', 100, y);
      doc.text('   |   Net Payout = Base Salary - Absence Deduction - Other Deductions + Bonus', 14, y + 5);

      // ── 8. FOOTER BANNER ──
      doc.setFillColor(44, 38, 31);
      doc.rect(0, 203, PW, 8, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(160, 140, 110);
      doc.text(restaurantName + '  |  Confidential Payroll Document  |  For Internal Use Only  |  Do Not Distribute', PW / 2, 208, { align: 'center' });

      doc.save('Payroll_Report_' + monthLabel + '_2026.pdf');
    } catch (e) {
      console.error('PDF generation error:', e);
      alert('PDF generation failed: ' + (e as Error).message);
    }
  };

  const updatePayrollStatus = (staffId: string, statusValue: PayrollRecord['status']) => {
    setPayrollList(prev => prev.map(p => (p.staffId === staffId && p.monthKey === selectedPayrollMonth) ? { ...p, status: statusValue } : p));
    if (statusValue !== 'Paid' && selectedPayrollMonth === '2026-05') {
      setIsMayUnlockedOverride(false);
    }
  };

  const updateStaffHourlyRate = (staffId: string, hourlyRateValue: number) => {
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, hourlyRate: Math.max(0, hourlyRateValue) } : s));
  };

  const markAllPayrollPaid = () => {
    setPayrollList(prev => prev.map(p => p.monthKey === selectedPayrollMonth ? { ...p, status: 'Paid' as const } : p));
  };




  // 4. Form States
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'waiter' as string,
    phone: '',
    email: '',
    address: '',
    idProof: '',
    shift: 'morning' as StaffMember['shift'],
    hourlyRate: 200,
    assignedTablesString: '',
    assignedSection: '',
    profilePicture: '',
  });

  const [assignForm, setAssignForm] = useState({
    staffId: '',
    assignedTables: [] as string[],
    assignedSection: '',
  });

  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    role: 'waiter' as string,
    phone: '',
    email: '',
    address: '',
    idProof: '',
    shift: 'morning' as StaffMember['shift'],
    hourlyRate: 200,
    joinedDate: '',
    assignedTablesString: '',
    assignedSection: '',
    profilePicture: '',
  });

  // 5. Select active employee record
  const selectedStaff = useMemo(() => {
    if (staffList.length === 0) return null;
    return staffList.find(s => s.id === selectedStaffId) || staffList[0] || null;
  }, [staffList, selectedStaffId]);

  // 6. Filtering Staff Members
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staffList, searchQuery, roleFilter]);

  // 7. Handlers for staff roster editing and dynamic state updating
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const tables = staffForm.assignedTablesString 
      ? staffForm.assignedTablesString.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const numericIds = staffList
      .map(s => {
        const match = s.id.match(/^emp-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(Boolean);
    const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : staffList.length + 1;
    const newId = `emp-${nextNum}`;

    const newEmp: StaffMember = {
      id: newId,
      name: staffForm.name,
      role: staffForm.role,
      status: 'off_duty',
      phone: staffForm.phone || '+91 99999 88888',
      email: staffForm.email || `${staffForm.name.toLowerCase().replace(/\s+/g, '')}@goldenplate.com`,
      address: staffForm.address || 'Not Provided',
      idProof: staffForm.idProof || 'Aadhar Card: Not Provided',
      shift: staffForm.shift,
      hourlyRate: staffForm.hourlyRate,
      joinedDate: new Date().toISOString().split('T')[0],
      performanceRating: 5.0,
      totalOrdersServed: 0,
      avgServingTimeMinutes: staffForm.role === 'chef' ? 15 : staffForm.role === 'waiter' ? 8 : 0,
      assignedTables: staffForm.role === 'waiter' ? tables : undefined,
      assignedSection: ['chef', 'manager'].includes(staffForm.role) ? staffForm.assignedSection : undefined,
      profilePicture: staffForm.profilePicture || undefined,
      weeklyShifts: getDefaultWeeklyShifts(staffForm.shift, nextNum),
    };

    setStaffList(prev => [...prev, newEmp]);
    const newPayrollRecords: PayrollRecord[] = [
      { monthKey: '2026-03', staffId: newId, bonus: 0, deductions: 0, status: 'Paid' as const },
      { monthKey: '2026-04', staffId: newId, bonus: 0, deductions: 0, status: 'Paid' as const },
      { monthKey: '2026-05', staffId: newId, bonus: 0, deductions: 0, status: 'Pending' as const }
    ];
    setPayrollList(prev => [...prev, ...newPayrollRecords]);
    setSelectedStaffId(newEmp.id);
    setIsAddStaffOpen(false);
    
    // Reset Form
    setStaffForm({
      name: '',
      role: 'waiter',
      phone: '',
      email: '',
      address: '',
      idProof: '',
      shift: 'morning',
      hourlyRate: 200,
      assignedTablesString: '',
      assignedSection: '',
      profilePicture: '',
    });
  };

  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditForm({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
      email: staff.email,
      address: staff.address,
      idProof: staff.idProof,
      shift: staff.shift,
      hourlyRate: staff.hourlyRate,
      joinedDate: staff.joinedDate,
      assignedTablesString: staff.assignedTables?.join(', ') || '',
      assignedSection: staff.assignedSection || '',
      profilePicture: staff.profilePicture || '',
    });
    setIsEditStaffOpen(true);
  };

  const handleEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const tables = editForm.assignedTablesString 
      ? editForm.assignedTablesString.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    setStaffList(prev => prev.map(s => {
      if (s.id === editForm.id) {
        return {
          ...s,
          name: editForm.name,
          role: editForm.role,
          phone: editForm.phone,
          email: editForm.email,
          address: editForm.address,
          idProof: editForm.idProof,
          shift: editForm.shift,
          hourlyRate: editForm.hourlyRate,
          joinedDate: editForm.joinedDate,
          assignedTables: editForm.role === 'waiter' ? tables : undefined,
          assignedSection: ['chef', 'manager'].includes(editForm.role) ? editForm.assignedSection : undefined,
          profilePicture: editForm.profilePicture || undefined,
          weeklyShifts: s.weeklyShifts || getDefaultWeeklyShifts(editForm.shift, parseInt(s.id.replace('emp-', ''), 10)),
        };
      }
      return s;
    }));
    setIsEditStaffOpen(false);
    setEditingStaff(null);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to remove this employee from the system staff list? This cannot be undone.')) {
      setStaffList(prev => prev.filter(s => s.id !== id));
      if (selectedStaffId === id) {
        setSelectedStaffId('emp-2'); // Reset selection
      }
    }
  };

  const handleUpdateAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffList(prev => prev.map(s => {
      if (s.id === assignForm.staffId) {
        return {
          ...s,
          assignedTables: s.role === 'waiter' ? assignForm.assignedTables : undefined,
          assignedSection: ['chef', 'manager'].includes(s.role) ? assignForm.assignedSection : undefined
        };
      }
      return s;
    }));
    setIsAssignOpen(false);
  };

  const toggleStaffStatus = (id: string) => {
    const todayStr = TODAY_DATE;
    const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    setStaffList(prev => prev.map(s => {
      if (s.id === id) {
        let newStatus: StaffMember['status'] = 'off_duty';
        if (s.status === 'off_duty') {
          newStatus = 'clocked_in';
          // Sync clock-in to attendance records
          setAttendanceLogs(logs => {
            const index = logs.findIndex(l => l.staffId === id && l.date === todayStr);
            if (index !== -1) {
              return logs.map((l, idx) => idx === index ? { ...l, status: 'present', clockInTime: currentTimeStr, clockOutTime: null } : l);
            } else {
              return [...logs, {
                id: `att-${Date.now()}`,
                staffId: s.id,
                name: s.name,
                role: s.role,
                date: todayStr,
                clockInTime: currentTimeStr,
                clockOutTime: null,
                status: 'present'
              }];
            }
          });
        }
        else if (s.status === 'clocked_in') {
          newStatus = 'on_break';
        }
        else if (s.status === 'on_break') {
          newStatus = 'off_duty';
          // Sync clock-out to attendance records
          setAttendanceLogs(logs => {
            const index = logs.findIndex(l => l.staffId === id && l.date === todayStr);
            if (index !== -1) {
              return logs.map((l, idx) => idx === index ? { ...l, clockOutTime: currentTimeStr } : l);
            }
            return logs;
          });
        }
        return { ...s, status: newStatus };
      }
      return s;
    }));
  };

  const updateAttendanceStatus = (staffId: string, date: string, newStatus: AttendanceRecord['status']) => {
    if (date !== TODAY_DATE) return;
    setAttendanceLogs(prev => {
      const index = prev.findIndex(l => l.staffId === staffId && l.date === date);
      const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      if (index !== -1) {
        return prev.map((l, idx) => {
          if (idx === index) {
            return {
              ...l,
              status: newStatus,
              clockInTime: newStatus === 'present' ? (l.clockInTime || currentTimeStr) : null,
              clockOutTime: newStatus !== 'present' ? null : l.clockOutTime
            };
          }
          return l;
        });
      } else {
        const staff = staffList.find(s => s.id === staffId);
        if (!staff) return prev;
        return [...prev, {
          id: `att-${Date.now()}`,
          staffId,
          name: staff.name,
          role: staff.role,
          date,
          clockInTime: newStatus === 'present' ? currentTimeStr : null,
          clockOutTime: null,
          status: newStatus
        }];
      }
    });

    // Also sync back to staff clocked status if today's log was marked as absent or on leave
    if (date === TODAY_DATE) {
      if (newStatus !== 'present') {
        setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, status: 'off_duty' } : s));
      } else {
        setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, status: 'clocked_in' } : s));
      }
    }
  };

  const updateClockTime = (staffId: string, date: string, type: 'clockInTime' | 'clockOutTime', value: string) => {
    if (date !== TODAY_DATE) return;
    setAttendanceLogs(prev => {
      const index = prev.findIndex(l => l.staffId === staffId && l.date === date);
      if (index !== -1) {
        return prev.map((l, idx) => idx === index ? { ...l, [type]: value || null } : l);
      } else {
        const staff = staffList.find(s => s.id === staffId);
        if (!staff) return prev;
        return [...prev, {
          id: `att-${Date.now()}`,
          staffId,
          name: staff.name,
          role: staff.role,
          date,
          clockInTime: type === 'clockInTime' ? value : null,
          clockOutTime: type === 'clockOutTime' ? value : null,
          status: 'present'
        }];
      }
    });
  };

  const updateWeeklyShift = (
    staffId: string, 
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', 
    newShift: string
  ) => {
    setStaffList(prev => prev.map(s => {
      if (s.id === staffId) {
        return {
          ...s,
          weeklyShifts: {
            ...s.weeklyShifts,
            [day]: newShift
          }
        };
      }
      return s;
    }));
  };

  // Helper to render stylish employee initials avatar or uploaded photo
  const renderAvatarInitials = (name: string, role: string, profilePicture?: string, sizeClass = "w-12 h-12 text-sm") => {
    if (profilePicture) {
      return (
        <img 
          src={profilePicture} 
          alt={name} 
          className={cn("rounded-full object-cover border shadow-xs transition-all duration-300", sizeClass)} 
        />
      );
    }
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className={cn(
        "rounded-full flex items-center justify-center font-heading font-extrabold border shadow-xs transition-all duration-300",
        sizeClass,
        role === 'manager' && 'bg-purple-100 border-purple-200 text-purple-700',
        role === 'chef' && 'bg-rose-100 border-rose-200 text-rose-700',
        role === 'waiter' && 'bg-emerald-100 border-emerald-200 text-emerald-700',
        role === 'cashier' && 'bg-blue-100 border-blue-200 text-blue-700',
        !['manager', 'chef', 'waiter', 'cashier'].includes(role) && 'bg-amber-100 border-amber-200 text-amber-700',
      )}>
        {initials}
      </div>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEdit) {
          setEditForm(prev => ({ ...prev, profilePicture: base64String }));
        } else {
          setStaffForm(prev => ({ ...prev, profilePicture: base64String }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 sm:p-4 text-[#5A5348] animate-fade-in font-sans">
      
      {/* 1. TOP HEADER PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/70 backdrop-blur-md border border-[#E6E1DA] p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FAF4EB] rounded-xl text-[#B88A52] border border-[#FAF0E2]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#2C261F] tracking-tight">Staff Management</h1>
            <p className="text-xs text-[#8C8375]">Manage working shifts, track waiter efficiency metrics, coordinate floor service and schedules</p>
          </div>
        </div>

        {/* Global Action controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAttendanceOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E6E1DA] hover:border-[#B88A52]/40 bg-white hover:bg-[#FAF7F2] text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-[#B88A52]" />
            <span>Attendance Log</span>
          </button>

          <button 
            onClick={() => setIsRosterDetailsOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E6E1DA] hover:border-[#B88A52]/40 bg-white hover:bg-[#FAF7F2] text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#B88A52]" />
            <span>Detailed Staff List</span>
          </button>

          <button 
            onClick={() => setIsShiftOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E6E1DA] hover:border-[#B88A52]/40 bg-white hover:bg-[#FAF7F2] text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Weekly Schedule</span>
          </button>

          <button 
            onClick={() => setIsPayrollOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E6E1DA] hover:border-[#B88A52]/40 bg-white hover:bg-[#FAF7F2] text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5 text-[#B88A52]" />
            <span>Salary & Payroll</span>
          </button>
          
          <button 
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2C261F] hover:bg-[#3D352C] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* KPI summaries to look extremely premium */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: staffList.length.toString(), detail: 'Across 4 core roles', icon: Users, color: 'text-slate-600 bg-slate-50 border-slate-100' },
          { label: 'Active On Duty', value: staffList.filter(s => s.status === 'clocked_in').length.toString(), detail: 'Currently clocked-in', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'On Rest Break', value: staffList.filter(s => s.status === 'on_break').length.toString(), detail: 'Clocked-out momentarily', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Staff Rating Average', value: '4.8 ★', detail: 'Based on customer orders feedback', icon: Star, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-[#E6E1DA] p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8C8375] tracking-wider block">{kpi.label}</span>
              <span className="text-lg font-bold text-[#2C261F] mt-1 block">{kpi.value}</span>
              <span className="text-[10px] text-[#8C8375] mt-0.5 block font-medium">{kpi.detail}</span>
            </div>
            <div className={cn("p-2.5 rounded-xl border", kpi.color)}>
              <kpi.icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* 2. TAB SPLIT SCREEN DIRECTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT 2/3 COLUMN: Staff directory directory list */}
        <div className="lg:col-span-2 bg-white border border-[#E6E1DA] rounded-2xl shadow-sm overflow-hidden">
          
          {/* Filters and search panel */}
          <div className="p-4 border-b border-[#F0ECE6] flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FCFAF7]">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8C8375]" />
              <input
                type="text"
                placeholder="Search staff by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl text-xs bg-white outline-none transition-all placeholder-[#A89F90] font-medium"
              />
            </div>

            {/* Role filter capsules */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All Roles' },
                { id: 'manager', label: 'Managers' },
                { id: 'chef', label: 'Chefs' },
                { id: 'waiter', label: 'Waiters' },
                { id: 'cashier', label: 'Cashier' }
              ].map(role => (
                <button
                  key={role.id}
                  onClick={() => setRoleFilter(role.id)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer border",
                    roleFilter === role.id
                      ? "bg-[#FAF4EB] text-[#B88A52] border-[#FAF0E2]"
                      : "bg-white text-[#8C8375] border-[#E6E1DA] hover:bg-[#FAF7F2]"
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Listing Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F0ECE6] bg-[#FCFAF7] text-[10px] uppercase font-bold text-[#8C8375] tracking-wider">
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Working Shift</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA]">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#8C8375] text-xs font-semibold">
                      <Users className="w-8 h-8 mx-auto mb-2 text-[#C0B7A6] stroke-1" />
                      No staff profiles found.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const isSelected = selectedStaffId === staff.id;
                    return (
                      <tr 
                        key={staff.id}
                        onClick={() => setSelectedStaffId(staff.id)}
                        className={cn(
                          "group cursor-pointer transition-all text-xs font-medium",
                          isSelected 
                            ? "bg-[#FAF4EB]/70 font-semibold" 
                            : "hover:bg-[#FAF7F2]/50 text-[#5A5348]"
                        )}
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            {renderAvatarInitials(staff.name, staff.role, staff.profilePicture)}
                            <div>
                              <span className={cn("text-xs block", isSelected ? "text-[#B88A52] font-bold" : "text-[#2C261F] font-semibold group-hover:text-[#B88A52]")}>
                                {staff.name}
                              </span>
                              <span className="text-[10px] text-[#8C8375] uppercase tracking-wider block font-semibold mt-0.5">Joined {new Date(staff.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={cn(
                            "inline-flex px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider border",
                            staff.role === 'manager' && 'bg-purple-50 text-purple-700 border-purple-100',
                            staff.role === 'chef' && 'bg-rose-50 text-rose-700 border-rose-100',
                            staff.role === 'waiter' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
                            staff.role === 'cashier' && 'bg-blue-50 text-blue-700 border-blue-100',
                            !['manager', 'chef', 'waiter', 'cashier'].includes(staff.role) && 'bg-amber-50 text-amber-700 border-amber-100',
                          )}>
                            {staff.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-sm font-semibold capitalize text-[#5A5348]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#8C8375]" />
                            <span className="text-xs">{staff.shift} Shift</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border select-none",
                            (staff.status || 'off_duty') === 'clocked_in' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            (staff.status || 'off_duty') === 'on_break' && 'bg-[#FAF4EB] text-amber-700 border-[#FAF0E2]',
                            (staff.status || 'off_duty') === 'off_duty' && 'bg-slate-50 text-slate-600 border-slate-200',
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full animate-pulse",
                              (staff.status || 'off_duty') === 'clocked_in' && 'bg-emerald-500',
                              (staff.status || 'off_duty') === 'on_break' && 'bg-amber-500',
                              (staff.status || 'off_duty') === 'off_duty' && 'bg-slate-400 animate-none',
                            )} />
                            <span>{(staff.status || 'off_duty').replace('_', ' ')}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#FCFAF7] border-t border-[#F0ECE6] flex items-center justify-between text-[10px] text-[#8C8375] font-bold uppercase">
            <span>Showing {filteredStaff.length} of {staffList.length} staff profiles</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Waiters</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> Chefs</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> Managers</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Cashiers</span>
            </div>
          </div>

        </div>

        {/* RIGHT 1/3 COLUMN: Selected Staff Member Profile Details Card */}
        <div className="bg-white border border-[#E6E1DA] rounded-2xl shadow-sm p-4 overflow-hidden relative">
          {!selectedStaff ? (
            <div className="text-center py-16 flex flex-col justify-center items-center min-h-[400px]">
              <Users className="w-12 h-12 text-[#8C8375] opacity-30 mb-3" />
              <p className="text-xs font-bold text-[#2C261F]">No Staff Selected</p>
              <p className="text-[10px] text-[#8C8375] mt-1 max-w-[200px] leading-relaxed">
                Add an employee to the roster or select one from the directory list to manage their shifts.
              </p>
            </div>
          ) : (
            <>
              {/* Header Profile Title */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0ECE6]">
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#8C8375] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#B88A52]" />
                  Staff Profile | <span className="text-[#2C261F]">{selectedStaff.role}</span>
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider border",
                  (selectedStaff.status || 'off_duty') === 'clocked_in' && 'bg-emerald-50 text-emerald-600 border-emerald-100',
                  (selectedStaff.status || 'off_duty') === 'on_break' && 'bg-amber-50 text-amber-600 border-amber-100',
                  (selectedStaff.status || 'off_duty') === 'off_duty' && 'bg-slate-50 text-slate-600 border-slate-100',
                )}>
                  {(selectedStaff.status || 'off_duty').replace('_', ' ')}
                </span>
              </div>

              {/* Centralized Avatar & Name details */}
              <div className="my-5 text-center bg-[#FBF9F5] border border-[#F0ECE6]/60 p-5 rounded-2xl relative">
                <div className="relative inline-block">
                  {/* Profile Image Initials or Photo */}
                  {renderAvatarInitials(selectedStaff.name, selectedStaff.role, selectedStaff.profilePicture, "w-20 h-20 text-2xl font-black border-2 mx-auto")}
                  {/* Pulse status indicator */}
                  <span className={cn(
                    "absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center",
                    (selectedStaff.status || 'off_duty') === 'clocked_in' && 'bg-emerald-500',
                    (selectedStaff.status || 'off_duty') === 'on_break' && 'bg-amber-500',
                    (selectedStaff.status || 'off_duty') === 'off_duty' && 'bg-slate-400',
                  )} />
                </div>

                <h3 className="font-heading font-bold text-base text-[#2C261F] mt-3 tracking-tight">{selectedStaff.name}</h3>
                <div className="mt-1.5 flex items-center justify-center gap-2">
                  <span className="inline-flex px-2 py-0.5 bg-[#FAF4EB] border border-[#FAF0E2] text-[9px] font-extrabold text-[#B88A52] rounded-md uppercase tracking-wider">
                    ID: {selectedStaff.id}
                  </span>
                </div>
              </div>

              {/* Staff contact & personal details */}
              <div className="space-y-2 text-xs font-semibold text-[#8C8375] border-b border-[#F0ECE6] pb-4">
                <div className="flex items-center gap-2.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#FAF0E2]">
                  <Phone className="w-4 h-4 text-[#B88A52] flex-shrink-0" />
                  <a href={`tel:${selectedStaff.phone}`} className="text-[#5A5348] hover:underline font-bold">{selectedStaff.phone}</a>
                </div>
                
                <div className="flex items-center gap-2.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#FAF0E2] overflow-hidden">
                  <Mail className="w-4 h-4 text-[#B88A52] flex-shrink-0" />
                  <a href={`mailto:${selectedStaff.email}`} className="text-[#5A5348] hover:underline font-bold truncate">{selectedStaff.email}</a>
                </div>

                <div className="flex items-center gap-2.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#FAF0E2]">
                  <ShieldCheck className="w-4 h-4 text-[#B88A52] flex-shrink-0" />
                  <span className="text-[#5A5348] font-bold">ID Proof: {selectedStaff.idProof}</span>
                </div>

                <div className="flex items-start gap-2.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#FAF0E2]">
                  <MapPin className="w-4 h-4 text-[#B88A52] mt-0.5 flex-shrink-0" />
                  <span className="text-[#5A5348] font-bold text-left leading-normal">{selectedStaff.address}</span>
                </div>

                <div className="flex items-center gap-2.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#FAF0E2]">
                  <Calendar className="w-4 h-4 text-[#B88A52] flex-shrink-0" />
                  <span className="text-[#5A5348] font-bold">
                    Joined: {new Date(selectedStaff.joinedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Active Assignments Panel (e.g. Waiter tables, Chef ranges) */}
              {['waiter', 'chef', 'manager'].includes(selectedStaff.role) && (
                <div className="bg-[#FCFAF7] border border-[#E6E1DA] p-3 rounded-xl mt-4">
                  {selectedStaff.role === 'waiter' ? (
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-[#8C8375] tracking-wider flex items-center gap-1.5 mb-2">
                        <Compass className="w-3.5 h-3.5 text-[#B88A52]" />
                        Assigned Tables Floor
                      </span>
                      
                      {selectedStaff.assignedTables && selectedStaff.assignedTables.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedStaff.assignedTables.map((table, idx) => (
                            <span 
                              key={idx}
                              className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg uppercase"
                            >
                              🍽️ {table}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          No tables assigned. Employee is unallocated!
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-[#8C8375] tracking-wider flex items-center gap-1.5 mb-1.5">
                        <Clipboard className="w-3.5 h-3.5 text-[#B88A52]" />
                        Active Kitchen Section
                      </span>
                      <p className="text-xs font-bold text-[#2C261F] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B88A52]" />
                        {selectedStaff.assignedSection || 'General Operations'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Staff Controls Panel */}
              <div className="mt-5 space-y-2">
                <button 
                  onClick={() => openEditModal(selectedStaff)}
                  className="w-full py-2.5 bg-[#B88A52] hover:bg-[#C99E65] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Staff Profile</span>
                </button>

                <button 
                  onClick={() => {
                    setAssignForm({
                      staffId: selectedStaff.id,
                      assignedTables: selectedStaff.assignedTables || [],
                      assignedSection: selectedStaff.assignedSection || ''
                    });
                    setIsAssignOpen(true);
                  }}
                  className="w-full py-2.5 border border-[#E6E1DA] hover:bg-[#FAF7F2] hover:border-[#B88A52]/40 text-[#5A5348] text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                >
                  Assign Workstations
                </button>
              </div>
            </>
          )}
        </div>

      </div>


      {/* ========================================================================= */}
      {/* MODAL POPUPS (Glassmorphism overlay styles, fully functional backend) */}
      {/* ========================================================================= */}

      {/* 1. ADD STAFF PROFILE MODAL */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23201D]/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-xl overflow-hidden p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE6]">
              <h3 className="text-base font-bold text-[#2C261F] flex items-center gap-1.5">
                <UserCheck className="w-5 h-5 text-[#B88A52]" />
                Register New Employee
              </h3>
              <button 
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 mt-4 text-left">
              <div className="flex items-center gap-4 bg-[#FAF7F2] p-4 rounded-xl border border-[#FAF0E2]">
                <div className="relative">
                  {renderAvatarInitials(
                    staffForm.name || "New Staff",
                    staffForm.role,
                    staffForm.profilePicture,
                    "w-16 h-16 text-xl border-2"
                  )}
                  {staffForm.profilePicture && (
                    <button
                      type="button"
                      onClick={() => setStaffForm(prev => ({ ...prev, profilePicture: '' }))}
                      className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-sm border border-white cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Profile Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, false)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#B88A52]/10 file:text-[#B88A52] hover:file:bg-[#B88A52]/20 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">ID Proof (e.g. Aadhar, PAN Card)</label>
                <input
                  type="text"
                  required
                  value={staffForm.idProof}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, idProof: e.target.value }))}
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                  placeholder="e.g. Aadhar Card: 8493-2048-1102"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Primary Role</label>
                  <select
                    value={['waiter', 'chef', 'manager', 'cashier'].includes(staffForm.role) ? staffForm.role : 'other'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStaffForm(prev => ({ ...prev, role: val === 'other' ? '' : val }));
                    }}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                  >
                    <option value="waiter">Waiter</option>
                    <option value="chef">Chef</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="other">Others / Custom...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Working Shift</label>
                  <select
                    value={staffForm.shift}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, shift: e.target.value as any }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                  >
                    <option value="morning">Morning Shift</option>
                    <option value="afternoon">Afternoon Shift</option>
                    <option value="night">Night Shift</option>
                  </select>
                </div>
              </div>

              {!['waiter', 'chef', 'manager', 'cashier'].includes(staffForm.role) && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Specify Custom Role</label>
                  <input
                    type="text"
                    required
                    value={staffForm.role}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    placeholder="e.g. Hostess, Security, Cleaner"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                  placeholder="+91 99999 88888"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Home Address</label>
                <textarea
                  rows={2}
                  required
                  value={staffForm.address}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] resize-none"
                  placeholder="e.g. Flat 405, Koregaon Park, Pune"
                />
              </div>

              {staffForm.role === 'waiter' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Assigned Tables (Comma separated)</label>
                  <input
                    type="text"
                    value={staffForm.assignedTablesString}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, assignedTablesString: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    placeholder="e.g. Table 1, Table 2, Table 3"
                  />
                </div>
              )}

              {(staffForm.role === 'chef' || staffForm.role === 'manager') && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Assigned Kitchen / Floor Section</label>
                  <input
                    type="text"
                    value={staffForm.assignedSection}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, assignedSection: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    placeholder="e.g. Continental, Bakery, POS 2"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0ECE6]">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2C261F] hover:bg-[#3D352C] text-white text-xs font-semibold rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ROLE & FLOOR TABLE ASSIGNMENT MODAL */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23201D]/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-xl overflow-hidden p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE6]">
              <h3 className="text-base font-bold text-[#B88A52] flex items-center gap-1.5">
                <Compass className="w-5 h-5" />
                Assign Floor Tables & Areas
              </h3>
              <button 
                onClick={() => setIsAssignOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAssignments} className="space-y-4 mt-4 text-left">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Select Employee</label>
                <select
                  value={assignForm.staffId}
                  onChange={(e) => {
                    const emp = staffList.find(s => s.id === e.target.value);
                    if (emp) {
                      setAssignForm({
                        staffId: emp.id,
                        assignedTables: emp.assignedTables || [],
                        assignedSection: emp.assignedSection || ''
                      });
                    }
                  }}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              {staffList.find(s => s.id === assignForm.staffId)?.role === 'waiter' ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Check Dining Tables to Allocate</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'VIP Salon 1', 'Outdoor Area'].map(table => {
                      const isChecked = assignForm.assignedTables.includes(table);
                      return (
                        <button
                          type="button"
                          key={table}
                          onClick={() => {
                            setAssignForm(prev => {
                              const list = prev.assignedTables.includes(table)
                                ? prev.assignedTables.filter(t => t !== table)
                                : [...prev.assignedTables, table];
                              return { ...prev, assignedTables: list };
                            });
                          }}
                          className={cn(
                            "py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer",
                            isChecked 
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                              : "bg-white border-[#E6E1DA] text-[#5A5348] hover:bg-[#FAF7F2]"
                          )}
                        >
                          🍽️ {table}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : ['chef', 'manager'].includes(staffList.find(s => s.id === assignForm.staffId)?.role || '') ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Specify Workstation Area</label>
                  <input
                    type="text"
                    required
                    value={assignForm.assignedSection}
                    onChange={(e) => setAssignForm(prev => ({ ...prev, assignedSection: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    placeholder="e.g. Curry Kitchen Section"
                  />
                </div>
              ) : (
                <div className="py-6 px-4 text-center text-[#8C8375] font-semibold text-xs bg-[#FAF7F2] border border-[#FAF0E2] rounded-xl">
                  Workstation assignments are only applicable for Chefs, Managers, and Waiters. Cashiers and custom roles do not require workstations.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0ECE6]">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B88A52] hover:bg-[#C99E65] text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-[#B88A52]/20 cursor-pointer"
                >
                  Save Allocations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ROSTER SHIFT SCHEDULE CALENDAR MODAL */}
      {isShiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23201D]/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl bg-white border border-[#E6E1DA] rounded-2xl shadow-xl overflow-hidden p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE6]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FAF4EB] rounded-lg text-[#B88A52] border border-[#FAF0E2]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2C261F]">Weekly Shift Scheduler</h3>
                  <p className="text-[10px] text-[#8C8375]">Customize daily shift assignments and off-duty schedules for all employees</p>
                </div>
              </div>
              <button 
                onClick={() => setIsShiftOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-left">
              {/* Legend Row to explain symbols - strictly no emojis! */}
              <div className="flex flex-wrap items-center gap-3 bg-[#FCFAF7] border border-[#E6E1DA]/40 p-2.5 rounded-xl text-[9px] font-bold text-[#8C8375] uppercase">
                <span className="text-[10px] text-[#2C261F] tracking-wide flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-[#B88A52]" />
                  <span>Active Shift Legend:</span>
                </span>
                {shiftTypes.map(st => {
                  const colorObj = SHIFT_COLORS.find(c => c.id === st.color) || SHIFT_COLORS[3];
                  return (
                    <span key={st.id} className="flex items-center gap-1.5 border border-[#E6E1DA] bg-white px-2 py-1 rounded-lg">
                      <span className={cn("px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1 font-bold", colorObj.bg)}>
                        <ShiftIcon name={st.iconName} className="w-3 h-3" />
                        <span>{st.name}</span>
                      </span>
                      <span className="text-[8px] text-[#8C8375] font-semibold">({st.hours})</span>
                    </span>
                  );
                })}
              </div>

              {/* Action Bar for Customizing Shifts & Timings */}
              <div className="flex items-center justify-between gap-4 mt-2">
                <div className="text-[10px] text-[#8C8375]">
                  Assign shifts dynamically below. To customize shift names, working hours, colors, or icons, click the configure button.
                </div>
                <button
                  onClick={() => setIsShiftManagerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#B88A52] text-[#B88A52] hover:bg-[#FAF4EB] text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Manage Shifts & Hours</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-[#E6E1DA] rounded-xl shadow-xs max-h-[50vh]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#F0ECE6] bg-[#FCFAF7] text-[9px] uppercase font-bold text-[#8C8375] tracking-wider">
                      <th className="py-3 px-4 font-extrabold sticky left-0 bg-[#FCFAF7] z-10">Employee</th>
                      <th className="py-3 px-3 text-center">Mon</th>
                      <th className="py-3 px-3 text-center">Tue</th>
                      <th className="py-3 px-3 text-center">Wed</th>
                      <th className="py-3 px-3 text-center">Thu</th>
                      <th className="py-3 px-3 text-center">Fri</th>
                      <th className="py-3 px-3 text-center">Sat</th>
                      <th className="py-3 px-3 text-center">Sun</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFEA] font-medium text-[#5A5348] bg-white">
                    {staffList.map((emp) => (
                      <tr key={emp.id} className="hover:bg-[#FAF7F2]/30">
                        <td className="py-3 px-4 font-bold text-[#2C261F] sticky left-0 bg-white z-10 border-r border-[#F3EFEA]/80 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2">
                            {renderAvatarInitials(emp.name, emp.role, emp.profilePicture, "w-7 h-7 text-[10px]")}
                            <div>
                              <span className="block font-bold truncate max-w-[120px]">{emp.name}</span>
                              <span className="text-[8px] text-[#8C8375] uppercase tracking-wider block font-semibold">{emp.role}</span>
                            </div>
                          </div>
                        </td>
                        
                        {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => (
                          <td key={day} className="py-3 px-2.5 text-center">
                            <select
                              value={emp.weeklyShifts[day]}
                              onChange={(e) => updateWeeklyShift(emp.id, day, e.target.value)}
                              className={cn(
                                "px-1.5 py-1 text-[9px] font-bold uppercase rounded-lg border outline-none cursor-pointer bg-white transition-colors w-24 text-center font-sans focus:ring-1 focus:ring-[#B88A52]/30",
                                (() => {
                                  const activeST = shiftTypes.find(st => st.id === emp.weeklyShifts[day]) || shiftTypes[3] || INITIAL_SHIFT_TYPES[3];
                                  const colorObj = SHIFT_COLORS.find(c => c.id === activeST.color) || SHIFT_COLORS[3];
                                  return colorObj.bg;
                                })()
                              )}
                            >
                              {shiftTypes.map(st => (
                                <option key={st.id} value={st.id}>
                                  {st.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#F0ECE6]">
                <button
                  onClick={() => setIsShiftOpen(false)}
                  className="px-5 py-2.5 bg-[#2C261F] hover:bg-[#3D352C] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Close Shift Scheduler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3.5. SHIFT TYPES MANAGEMENT DIALOG */}
      {isShiftManagerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#23201D]/55 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-[#E6E1DA] rounded-2xl shadow-2xl overflow-hidden p-6 animate-scale-up flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE6]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#B88A52]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#2C261F]">Shift Types & Timing Manager</h3>
                  <p className="text-[10px] text-[#8C8375]">Add custom shifts, modify timing hours, and select premium icon markers.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsShiftManagerOpen(false);
                  setEditingShiftType(null);
                  setShiftTypeForm({ id: '', name: '', hours: '', color: 'amber', iconName: 'sunrise' });
                }}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 flex-1 overflow-y-auto pr-1">
              
              {/* LEFT COLUMN: List of Active Shift Types */}
              <div className="space-y-2 text-left">
                <h4 className="text-[10px] uppercase font-bold text-[#8C8375] tracking-wider mb-2">Active Shifts</h4>
                <div className="space-y-2">
                  {shiftTypes.map(st => {
                    const colorObj = SHIFT_COLORS.find(c => c.id === st.color) || SHIFT_COLORS[3];
                    const isCore = ['morning', 'afternoon', 'night', 'off'].includes(st.id);
                    return (
                      <div 
                        key={st.id} 
                        className={cn(
                          "p-3 rounded-xl border flex items-center justify-between gap-3 bg-white hover:border-[#B88A52]/40 transition-all shadow-xs",
                          editingShiftType?.id === st.id ? "border-[#B88A52] ring-1 ring-[#B88A52]" : "border-[#E6E1DA]"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn("p-2 rounded-lg border", colorObj.bg)}>
                            <ShiftIcon name={st.iconName} className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-[#2C261F]">{st.name}</span>
                            <span className="block text-[9px] text-[#8C8375] font-semibold mt-0.5">{st.hours}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEditShiftType(st)}
                            className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#5A5348] cursor-pointer hover:text-[#B88A52]"
                            title="Edit shift particulars"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isCore && (
                            <button
                              onClick={() => handleDeleteShiftType(st.id)}
                              className="p-1 rounded-lg hover:bg-rose-50 text-[#8C8375] cursor-pointer hover:text-rose-600"
                              title="Delete custom shift"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: Add / Edit Form */}
              <div className="bg-[#FCFAF7] border border-[#E6E1DA]/60 p-4 rounded-xl text-left flex flex-col justify-between">
                <form onSubmit={handleSaveShiftType} className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-[#8C8375] tracking-wider">
                    {editingShiftType ? 'Edit Shift Type Details' : 'Create Custom Shift'}
                  </h4>
                  
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#8C8375] mb-1">Shift Display Name</label>
                    <input
                      type="text"
                      required
                      value={shiftTypeForm.name}
                      onChange={(e) => setShiftTypeForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full text-xs font-bold px-3 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-lg outline-none text-[#2C261F] bg-white"
                      placeholder="e.g. Mid-Day Shift, Brunch Duty"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#8C8375] mb-1">Timing Hours (Customize Time)</label>
                    <input
                      type="text"
                      required
                      value={shiftTypeForm.hours}
                      onChange={(e) => setShiftTypeForm(prev => ({ ...prev, hours: e.target.value }))}
                      className="w-full text-xs font-bold px-3 py-2 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-lg outline-none text-[#2C261F] bg-white"
                      placeholder="e.g. 11:30 AM - 07:30 PM"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[#8C8375] mb-1">Shift Marker Icon</label>
                      <select
                        value={shiftTypeForm.iconName}
                        onChange={(e) => setShiftTypeForm(prev => ({ ...prev, iconName: e.target.value as any }))}
                        className="w-full text-xs font-semibold px-2 py-2 border border-[#E6E1DA] focus:border-[#B88A52] rounded-lg bg-white outline-none text-[#5A5348] cursor-pointer"
                      >
                        <option value="sunrise">Sunrise (Morning)</option>
                        <option value="sun">Sun (Mid-day)</option>
                        <option value="moon">Moon (Night)</option>
                        <option value="coffee">Coffee (Rest/OFF)</option>
                        <option value="briefcase">Briefcase (Work)</option>
                        <option value="sparkles">Sparkles (Special)</option>
                        <option value="clock">Clock (Default)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[#8C8375] mb-1">Accent Theme Color</label>
                      <select
                        value={shiftTypeForm.color}
                        onChange={(e) => setShiftTypeForm(prev => ({ ...prev, color: e.target.value as any }))}
                        className="w-full text-xs font-semibold px-2 py-2 border border-[#E6E1DA] focus:border-[#B88A52] rounded-lg bg-white outline-none text-[#5A5348] cursor-pointer"
                      >
                        {SHIFT_COLORS.map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0ECE6]/80">
                    {editingShiftType && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingShiftType(null);
                          setShiftTypeForm({ id: '', name: '', hours: '', color: 'amber', iconName: 'sunrise' });
                        }}
                        className="px-3 py-1.5 border border-[#E6E1DA] text-[#5A5348] text-[10px] font-bold uppercase rounded-lg hover:bg-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#B88A52] hover:bg-[#C99E65] text-white text-[10px] font-bold uppercase rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      {editingShiftType ? 'Update Shift' : 'Create Shift'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#F0ECE6]">
              <button
                onClick={() => {
                  setIsShiftManagerOpen(false);
                  setEditingShiftType(null);
                  setShiftTypeForm({ id: '', name: '', hours: '', color: 'amber', iconName: 'sunrise' });
                }}
                className="px-4 py-2 bg-[#2C261F] hover:bg-[#3D352C] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Return to Schedule Grid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DETAILED STAFF OVERVIEW MODAL */}
      {isRosterDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23201D]/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-6xl bg-white border border-[#E6E1DA] rounded-2xl shadow-xl overflow-hidden p-6 animate-scale-up flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0ECE6]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#B88A52]" />
                <h3 className="text-base font-bold text-[#2C261F]">Detailed Staff Directory</h3>
              </div>
              <button 
                onClick={() => setIsRosterDetailsOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Split layout: Left is Name & Role list, Right is selected employee status details */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 my-4 flex-1 overflow-hidden min-h-[400px]">
              
              {/* LEFT COLUMN: Scrollable list of staff (Name & Role) */}
              <div className="md:col-span-2 border border-[#E6E1DA] rounded-xl bg-[#FCFAF7] p-2 space-y-1.5">
                {staffList.map((emp) => {
                  const isSelected = modalSelectedStaffId === emp.id;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => setModalSelectedStaffId(emp.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#FAF4EB] border-[#FAF0E2] shadow-xs"
                          : "bg-white border-[#E6E1DA]/40 hover:bg-[#FAF7F2]/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {renderAvatarInitials(emp.name, emp.role, emp.profilePicture)}
                        <div>
                          <span className={cn(
                            "text-xs block font-bold",
                            isSelected ? "text-[#B88A52]" : "text-[#2C261F]"
                          )}>
                            {emp.name}
                          </span>
                          <span className="text-[9px] text-[#8C8375] uppercase tracking-wider font-semibold block mt-0.5">{emp.role}</span>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        emp.status === 'clocked_in' && 'bg-emerald-500',
                        emp.status === 'on_break' && 'bg-amber-500',
                        emp.status === 'off_duty' && 'bg-slate-400',
                      )} />
                    </button>
                  );
                })}
              </div>

              {/* RIGHT COLUMN: Selected Employee Detailed Status Panel */}
              <div className="md:col-span-3 border border-[#E6E1DA] rounded-xl bg-white p-5 flex flex-col justify-between">
                {(() => {
                  const modalSelectedStaff = staffList.find(s => s.id === modalSelectedStaffId) || staffList[0];
                  if (!modalSelectedStaff) {
                    return (
                      <div className="text-center py-12 text-[#8C8375]">
                        Select a staff member from the left list to view their detailed status.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4 text-left">
                      {/* Name & ID Badge Header */}
                      <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-3">
                        <div>
                          <h4 className="font-heading font-extrabold text-[#2C261F] text-base leading-tight">
                            {modalSelectedStaff.name}
                          </h4>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex px-2 py-0.5 bg-[#FAF4EB] border border-[#FAF0E2] text-[9px] font-extrabold text-[#B88A52] rounded-md uppercase tracking-wider">
                              ID: {modalSelectedStaff.id}
                            </span>
                            <span className="capitalize text-[10px] text-[#8C8375] font-semibold">{modalSelectedStaff.role}</span>
                          </div>
                        </div>

                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                          (modalSelectedStaff.status || 'off_duty') === 'clocked_in' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          (modalSelectedStaff.status || 'off_duty') === 'on_break' && 'bg-amber-50 text-amber-700 border-amber-200',
                          (modalSelectedStaff.status || 'off_duty') === 'off_duty' && 'bg-slate-50 text-slate-600 border-slate-200',
                        )}>
                          {(modalSelectedStaff.status || 'off_duty').replace('_', ' ')}
                        </span>
                      </div>

                      {/* Detailed Grid Parameters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-[#8C8375]">
                        <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#FAF0E2] flex items-center gap-2.5">
                          <Phone className="w-4 h-4 text-[#B88A52] flex-shrink-0" />
                          <div>
                            <span className="text-[9px] uppercase text-[#8C8375] block tracking-wide">Phone Number</span>
                            <a href={`tel:${modalSelectedStaff.phone}`} className="text-[#5A5348] hover:underline font-bold mt-0.5 block">{modalSelectedStaff.phone}</a>
                          </div>
                        </div>

                        <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#FAF0E2] flex items-center gap-2.5 overflow-hidden">
                          <Mail className="w-4 h-4 text-[#B88A52] flex-shrink-0" />
                          <div className="overflow-hidden">
                            <span className="text-[9px] uppercase text-[#8C8375] block tracking-wide">Email Address</span>
                            <a href={`mailto:${modalSelectedStaff.email}`} className="text-[#5A5348] hover:underline font-bold mt-0.5 block truncate">{modalSelectedStaff.email}</a>
                          </div>
                        </div>

                        <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#FAF0E2] flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-[#B88A52] flex-shrink-0" />
                          <div>
                            <span className="text-[9px] uppercase text-[#8C8375] block tracking-wide">ID Proof Details</span>
                            <span className="text-[#5A5348] font-bold mt-0.5 block">{modalSelectedStaff.idProof}</span>
                          </div>
                        </div>

                        <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#FAF0E2] flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-[#B88A52] flex-shrink-0" />
                          <div>
                            <span className="text-[9px] uppercase text-[#8C8375] block tracking-wide">Current Shift</span>
                            <span className="text-[#5A5348] font-bold mt-0.5 block capitalize">
                              {modalSelectedStaff.shift} Shift
                            </span>
                          </div>
                        </div>

                        <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#FAF0E2] flex items-start gap-2.5 sm:col-span-2">
                          <MapPin className="w-4 h-4 text-[#B88A52] mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[9px] uppercase text-[#8C8375] block tracking-wide">Home Address</span>
                            <span className="text-[#5A5348] font-bold mt-0.5 block leading-relaxed">{modalSelectedStaff.address}</span>
                          </div>
                        </div>

                        <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#FAF0E2] flex items-center gap-2.5 sm:col-span-2">
                          <Calendar className="w-4 h-4 text-[#B88A52] flex-shrink-0" />
                          <div>
                            <span className="text-[9px] uppercase text-[#8C8375] block tracking-wide">Joined Date</span>
                            <span className="text-[#5A5348] font-bold mt-0.5 block">
                              {new Date(modalSelectedStaff.joinedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>


                      {/* Modifying Controls Actions Row */}
                      <div className="flex items-center justify-end gap-2 border-t border-[#F0ECE6] pt-3">
                        <button
                          onClick={() => openEditModal(modalSelectedStaff)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-[#E6E1DA] hover:border-[#B88A52]/40 text-[#5A5348] hover:text-[#B88A52] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(modalSelectedStaff.id)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-rose-100 hover:bg-rose-50 text-rose-500 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Staff</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F0ECE6]">
              <span className="text-[10px] uppercase font-bold text-[#8C8375]">Total registered staff database: {staffList.length} members</span>
              <button
                onClick={() => setIsRosterDetailsOpen(false)}
                className="px-5 py-2 bg-[#2C261F] hover:bg-[#3D352C] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Staff Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EDIT STAFF PROFILE MODAL */}
      {isEditStaffOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#23201D]/45 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#E6E1DA] rounded-2xl shadow-xl overflow-hidden p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE6]">
              <h3 className="text-base font-bold text-[#B88A52] flex items-center gap-1.5">
                <Edit2 className="w-5 h-5" />
                Edit Employee Details
              </h3>
              <button 
                onClick={() => {
                  setIsEditStaffOpen(false);
                  setEditingStaff(null);
                }}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditStaff} className="space-y-4 mt-4 text-left">
              <div className="flex items-center gap-4 bg-[#FAF7F2] p-4 rounded-xl border border-[#FAF0E2]">
                <div className="relative">
                  {renderAvatarInitials(
                    editForm.name || "Staff Member",
                    editForm.role,
                    editForm.profilePicture,
                    "w-16 h-16 text-xl border-2"
                  )}
                  {editForm.profilePicture && (
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, profilePicture: '' }))}
                      className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-sm border border-white cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Profile Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, true)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#B88A52]/10 file:text-[#B88A52] hover:file:bg-[#B88A52]/20 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">ID Proof (e.g. Aadhar, PAN Card)</label>
                <input
                  type="text"
                  required
                  value={editForm.idProof}
                  onChange={(e) => setEditForm(prev => ({ ...prev, idProof: e.target.value }))}
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                  placeholder="e.g. Aadhar Card: 8493-2048-1102"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Primary Role</label>
                  <select
                    value={['waiter', 'chef', 'manager', 'cashier'].includes(editForm.role) ? editForm.role : 'other'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm(prev => ({ ...prev, role: val === 'other' ? '' : val }));
                    }}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                  >
                    <option value="waiter">Waiter</option>
                    <option value="chef">Chef</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="other">Others / Custom...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Working Shift</label>
                  <select
                    value={editForm.shift}
                    onChange={(e) => setEditForm(prev => ({ ...prev, shift: e.target.value as any }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl bg-white outline-none text-[#5A5348] cursor-pointer"
                  >
                    <option value="morning">Morning Shift</option>
                    <option value="afternoon">Afternoon Shift</option>
                    <option value="night">Night Shift</option>
                  </select>
                </div>
              </div>

              {!['waiter', 'chef', 'manager', 'cashier'].includes(editForm.role) && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Specify Custom Role</label>
                  <input
                    type="text"
                    required
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                    placeholder="e.g. Hostess, Security, Cleaner"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Joined Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.joinedDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, joinedDate: e.target.value }))}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Home Address</label>
                <textarea
                  rows={2}
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F] resize-none"
                />
              </div>

              {editForm.role === 'waiter' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Assigned Tables (Comma separated)</label>
                  <input
                    type="text"
                    value={editForm.assignedTablesString}
                    onChange={(e) => setEditForm(prev => ({ ...prev, assignedTablesString: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                  />
                </div>
              )}

              {(editForm.role === 'chef' || editForm.role === 'manager') && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C8375] mb-1">Assigned Kitchen / Floor Section</label>
                  <input
                    type="text"
                    value={editForm.assignedSection}
                    onChange={(e) => setEditForm(prev => ({ ...prev, assignedSection: e.target.value }))}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-xl outline-none text-[#2C261F]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0ECE6]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditStaffOpen(false);
                    setEditingStaff(null);
                  }}
                  className="px-4 py-2 border border-[#E6E1DA] text-[#5A5348] text-xs font-semibold rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2C261F] hover:bg-[#3D352C] text-white text-xs font-semibold rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ATTENDANCE LOG MODAL */}
      {isAttendanceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#23201D]/45 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl bg-white border border-[#E6E1DA] rounded-2xl shadow-xl overflow-hidden p-6 animate-scale-up flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0ECE6]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FAF4EB] rounded-lg text-[#B88A52] border border-[#FAF0E2]">
                  <Clipboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2C261F]">Staff Attendance Tracker</h3>
                  <p className="text-[10px] text-[#8C8375]">Monitor live clock-in times and configure daily attendance overrides</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAttendanceOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attendance Filter & Switch Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-[#F0ECE6] bg-[#FCFAF7] my-3 rounded-2xl border border-[#E6E1DA]/40">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-[#8C8375] tracking-wider block">Select Logs View Day</span>
                <span className="text-[10px] text-[#8C8375]/75 font-medium block mt-0.5">Explore the last 3 months of history</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  {[
                    { id: '2026-05-27', label: 'Today' },
                    { id: '2026-05-26', label: 'Yesterday' }
                  ].map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => setAttendanceDateFilter(day.id)}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer border",
                        attendanceDateFilter === day.id
                          ? "bg-[#FAF4EB] text-[#B88A52] border-[#FAF0E2]"
                          : "bg-white text-[#8C8375] border-[#E6E1DA] hover:bg-[#FAF7F2]"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                  
                  {/* 3-month date picker input limit range */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-[#8C8375]">Or select date:</span>
                    <input
                      type="date"
                      min="2026-02-27"
                      max="2026-05-27"
                      value={attendanceDateFilter}
                      onChange={(e) => {
                        if (e.target.value) {
                          setAttendanceDateFilter(e.target.value);
                        }
                      }}
                      className="px-2.5 py-1 border border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52] rounded-lg text-[10px] font-bold uppercase text-[#5A5348] bg-white outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Locked Warning Banner */}
            {isLocked && (
              <div className="mb-3 px-4 py-2.5 bg-slate-50 border border-slate-200/80 text-slate-500 rounded-xl text-[10px] font-semibold flex items-center gap-2 animate-fade-in">
                <Lock className="w-3.5 h-3.5 text-[#8C8375] stroke-[2.5] flex-shrink-0" />
                <span>Attendance history for <strong>{new Date(attendanceDateFilter).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong> is permanently locked and archived after 24 hours.</span>
              </div>
            )}

            {/* Attendance Table View */}
            <div className="flex-1 border border-[#E6E1DA] rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="border-b border-[#F0ECE6] bg-[#FCFAF7] text-[10px] uppercase font-bold text-[#8C8375] tracking-wider">
                    <th className="py-3 px-4">Employee Details</th>
                    <th className="py-3 px-4">Working Shift</th>
                    <th className="py-3 px-4">Clock In Time</th>
                    <th className="py-3 px-4">Clock Out Time</th>
                    <th className="py-3 px-4 text-center">Attendance Logs Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFEA]">
                  {staffList.map(staff => {
                    const record = attendanceLogs.find(l => l.staffId === staff.id && l.date === attendanceDateFilter) || {
                      id: '',
                      staffId: staff.id,
                      name: staff.name,
                      role: staff.role,
                      date: attendanceDateFilter,
                      clockInTime: null,
                      clockOutTime: null,
                      status: 'absent' as const
                    };

                    return (
                      <tr key={staff.id} className="hover:bg-[#FAF7F2]/40 text-xs font-medium">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-3">
                            {renderAvatarInitials(staff.name, staff.role, staff.profilePicture, "w-9 h-9 text-xs")}
                            <div>
                              <span className="text-xs block text-[#2C261F] font-bold">{staff.name}</span>
                              <span className="text-[9px] uppercase tracking-wider text-[#8C8375] font-semibold mt-0.5">{staff.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 capitalize text-[#5A5348] font-semibold">{staff.shift} Shift</td>
                        <td className="py-2.5 px-4 text-center">
                          {record.status === 'present' ? (
                            <input
                              type="time"
                              disabled={isLocked}
                              value={timeStringTo24H(record.clockInTime)}
                              onChange={(e) => {
                                const timeStr = time24HToString(e.target.value);
                                updateClockTime(staff.id, attendanceDateFilter, 'clockInTime', timeStr);
                              }}
                              className={cn(
                                "w-24 text-[10px] font-bold font-mono px-1.5 py-1 rounded-lg border text-center outline-none transition-all cursor-pointer bg-white mx-auto block",
                                record.clockInTime 
                                  ? "bg-[#FAF7F2] border-[#FAF0E2] text-[#B88A52] focus:border-[#B88A52]/70 focus:ring-1 focus:ring-[#B88A52]/40" 
                                  : "bg-slate-50 border-slate-200 text-slate-400 focus:bg-white focus:border-[#B88A52]/40 focus:ring-1 focus:ring-[#B88A52]/40",
                                isLocked && "cursor-not-allowed opacity-50 bg-slate-50 border-slate-100"
                              )}
                            />
                          ) : (
                            <span className="text-[10px] font-bold font-mono text-slate-400/60 block text-center">--:--</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {record.status === 'present' ? (
                            <input
                              type="time"
                              disabled={isLocked}
                              value={timeStringTo24H(record.clockOutTime)}
                              onChange={(e) => {
                                const timeStr = time24HToString(e.target.value);
                                updateClockTime(staff.id, attendanceDateFilter, 'clockOutTime', timeStr);
                              }}
                              className={cn(
                                "w-24 text-[10px] font-bold font-mono px-1.5 py-1 rounded-lg border text-center outline-none transition-all cursor-pointer bg-white mx-auto block",
                                record.clockOutTime 
                                  ? "bg-[#FAF7F2] border-[#FAF0E2] text-[#B88A52] focus:border-[#B88A52]/70 focus:ring-1 focus:ring-[#B88A52]/40" 
                                  : "bg-slate-50 border-slate-200 text-slate-400 focus:bg-white focus:border-[#B88A52]/40 focus:ring-1 focus:ring-[#B88A52]/40",
                                isLocked && "cursor-not-allowed opacity-50 bg-slate-50 border-slate-100"
                              )}
                            />
                          ) : (
                            <span className="text-[10px] font-bold font-mono text-slate-400/60 block text-center">--:--</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {[
                              { id: 'present', label: 'Present', activeColor: 'bg-emerald-500 border-emerald-500 text-white shadow-xs' },
                              { id: 'absent', label: 'Absent', activeColor: 'bg-rose-500 border-rose-500 text-white shadow-xs' },
                              { id: 'on_leave', label: 'On Leave', activeColor: 'bg-amber-500 border-amber-500 text-white shadow-xs' }
                            ].map(pill => {
                              const isActive = record.status === pill.id;
                              return (
                                <button
                                  key={pill.id}
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => {
                                    if (!isLocked) {
                                      updateAttendanceStatus(staff.id, attendanceDateFilter, pill.id as any);
                                    }
                                  }}
                                  className={cn(
                                    "px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider rounded-lg border transition-all relative",
                                    isActive 
                                      ? pill.activeColor
                                      : "bg-white border-[#E6E1DA] text-[#8C8375] hover:bg-[#FAF7F2]",
                                    isLocked
                                      ? "cursor-not-allowed opacity-40"
                                      : "cursor-pointer"
                                  )}
                                >
                                  <span className="flex items-center gap-1">
                                    {isActive && isLocked && <Lock className="w-2.5 h-2.5 text-white" />}
                                    <span>{pill.label}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3.5 border-t border-[#F0ECE6] mt-4">
              <span className="text-[10px] uppercase font-bold text-[#8C8375]">Today's active clocked-in count: {staffList.filter(s => s.status === 'clocked_in').length} members</span>
              <button
                onClick={() => setIsAttendanceOpen(false)}
                className="px-5 py-2.5 bg-[#2C261F] hover:bg-[#3D352C] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Attendance
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. STAFF SALARY & PAYROLL MANAGER MODAL */}
      {isPayrollOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#23201D]/45 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-6xl bg-white border border-[#E6E1DA] rounded-2xl shadow-xl overflow-hidden p-6 animate-scale-up flex flex-col max-h-[90vh] text-left">
            
            {/* Modal Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3.5 border-b border-[#F0ECE6] gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FAF4EB] rounded-lg text-[#B88A52] border border-[#FAF0E2]">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2C261F] flex items-center gap-2">
                    Staff Salary & Payroll Manager
                    {selectedPayrollMonth !== '2026-05' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-extrabold uppercase tracking-wider rounded border border-amber-200/50">
                        <Lock className="w-2.5 h-2.5 text-amber-600" /> Audit Locked
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-[#8C8375]">Analyze dynamic monthly attendance logs and process monthly fixed salary structures (Indian Standard)</p>
                </div>
              </div>

              {/* 3-Month Segmented Selector */}
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E6E1DA]/60 select-none">
                {[
                  { key: '2026-03', label: 'March 2026', locked: true },
                  { key: '2026-04', label: 'April 2026', locked: true },
                  { key: '2026-05', label: 'May 2026', locked: false }
                ].map(m => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSelectedPayrollMonth(m.key)}
                    className={cn(
                      "px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                      selectedPayrollMonth === m.key
                        ? "bg-[#2C261F] text-white shadow-sm"
                        : "text-[#8C8375] hover:text-[#2C261F] hover:bg-[#FAF0E2]/40"
                    )}
                  >
                    {m.label}
                    {m.locked && <Lock className={cn("w-2.5 h-2.5 shrink-0", selectedPayrollMonth === m.key ? "text-amber-400" : "text-[#8C8375]/50")} />}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setIsPayrollOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF7F2] text-[#8C8375] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
                          {selectedPayrollMonth === '2026-05' && isAllPaidInMonth && !isMayUnlockedOverride && (
                <button
                  onClick={() => setIsMayUnlockedOverride(prev => !prev)}
                  className="ml-2 px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition"
                  title="Toggle unlock for May payroll"
                >
                  <Unlock className="w-4 h-4 inline-block mr-1" />
                  {isMayUnlockedOverride ? 'Lock May' : 'Unlock May'}
                </button>
            )}
            {/* PDF Download Button */}
            <button type="button"
              onClick={generatePayrollPDF}
              className="ml-2 px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center"
              title="Download payroll details as PDF"
            >
              <Download className="w-4 h-4 mr-1" />
              Download PDF
            </button>
            </div>

            {/* Audit Lock Warning Banner */}
            {selectedPayrollMonth !== '2026-05' && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl mt-3 text-amber-800 text-xs font-medium animate-fade-in">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Archive Record Locked:</strong> {selectedPayrollMonth === '2026-04' ? 'April' : 'March'} payroll records are closed, finalized, and fully paid. All cells and adjustments are locked for historical audit.</span>
              </div>
            )}

            {/* Monthly Payroll Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              {[
                { 
                  label: 'Total Monthly Payroll Expense', 
                  value: `₹${payrollList.filter(p => p.monthKey === selectedPayrollMonth).reduce((acc, curr) => {
                    const staff = staffList.find(s => s.id === curr.staffId);
                    if (!staff) return acc;
                    const days = calculateAttendanceDays(staff.id, selectedPayrollMonth);
                    const autoAbsenceDeduction = Math.round((staff.hourlyRate / 30) * days.absent);
                    const absenceDeduction = curr.absenceDeductions !== undefined ? curr.absenceDeductions : autoAbsenceDeduction;
                    return acc + Math.round(staff.hourlyRate - absenceDeduction - curr.deductions + curr.bonus);
                  }, 0).toLocaleString('en-IN')}`, 
                  detail: `Payroll records for ${selectedPayrollMonth === '2026-05' ? 'May' : selectedPayrollMonth === '2026-04' ? 'April' : 'March'} 2026`, 
                  icon: DollarSign, 
                  color: 'text-[#B88A52] bg-[#FAF4EB] border-[#FAF0E2]' 
                },
                { 
                  label: 'Salaried Employees', 
                  value: staffList.length.toString(), 
                  detail: 'On active payroll list', 
                  icon: Users, 
                  color: 'text-slate-600 bg-slate-50 border-slate-100' 
                },
                { 
                  label: 'Pending Payouts', 
                  value: payrollList.filter(p => p.monthKey === selectedPayrollMonth && p.status === 'Pending').length.toString(), 
                  detail: selectedPayrollMonth === '2026-05' ? 'Awaiting authorization' : 'All payouts completed', 
                  icon: Clock, 
                  color: 'text-amber-600 bg-amber-50 border-amber-100' 
                }
              ].map((insight, idx) => (
                <div key={idx} className="bg-white border border-[#E6E1DA] p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#8C8375] tracking-wider block">{insight.label}</span>
                    <span className="text-base font-extrabold text-[#2C261F] mt-1 block">{insight.value}</span>
                    <span className="text-[9px] text-[#8C8375] mt-0.5 block font-medium">{insight.detail}</span>
                  </div>
                  <div className={cn("p-2 rounded-lg border", insight.color)}>
                    <insight.icon className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Payroll Grid Table */}
            <div className="flex-1 border border-[#E6E1DA] rounded-xl overflow-auto shadow-xs">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="border-b border-[#F0ECE6] bg-[#FCFAF7] text-[10px] uppercase font-bold text-[#8C8375] tracking-wider">
                    <th className="py-4 px-4 sticky top-0 bg-[#FCFAF7] z-20 border-r border-[#E6E1DA]/50">Employee Details</th>
                    <th className="py-4 px-4 text-center sticky top-0 bg-[#FCFAF7] z-20 w-24 border-r border-[#E6E1DA]/50">Monthly Salary (₹)</th>
                    <th className="py-4 px-4 text-center sticky top-0 bg-[#FCFAF7] z-20 w-28 border-r border-[#E6E1DA]/50">Days Worked Summary</th>
                    {/* Visual grouping highlight style for deductions section columns */}
                    <th className="py-4 px-3 text-center sticky top-0 bg-[#FAF4EB]/60 z-20 border-r border-[#E6E1DA]/40 w-24 text-[#8C8375]">Absence Deductions (₹)</th>
                    <th className="py-4 px-3 text-center sticky top-0 bg-[#FAF4EB]/60 z-20 border-r border-[#E6E1DA]/50 w-24 text-[#8C8375]">Other Deductions (₹)</th>
                    <th className="py-4 px-4 text-center sticky top-0 bg-[#FCFAF7] z-20 w-24 border-r border-[#E6E1DA]/50">Incentives/Bonus (₹)</th>
                    <th className="py-4 px-4 text-center sticky top-0 bg-[#FCFAF7] z-20 w-24 bg-[#FAF4EB]/30 border-r border-[#E6E1DA]/50">Net Payout (₹)</th>
                    <th className="py-4 px-4 text-center sticky top-0 bg-[#FCFAF7] z-20 w-48">Payout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFEA]">
                  {staffList.map(staff => {
                    const record = payrollList.find(p => p.staffId === staff.id && p.monthKey === selectedPayrollMonth) || { monthKey: selectedPayrollMonth, staffId: staff.id, bonus: 0, deductions: 0, status: 'Pending' as const } as PayrollRecord;
                    const days = calculateAttendanceDays(staff.id, selectedPayrollMonth);
                    const baseSalary = staff.hourlyRate; // hourlyRate maps to fixed monthly base salary in memory
                    
                    // Unpaid Absence deductions calculated on standard 30-day cycle pro-rata basis
                    const autoAbsenceDeduction = Math.round((baseSalary / 30) * days.absent);
                    const isCustomAbsence = record.absenceDeductions !== undefined;
                    const absenceDeduction = isCustomAbsence ? record.absenceDeductions! : autoAbsenceDeduction;
                    const netPay = Math.round(baseSalary - absenceDeduction - record.deductions + record.bonus);

                    return (
                      <tr key={staff.id} className="hover:bg-[#FAF7F2]/40 text-xs font-medium">
                        {/* Employee Card */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-3">
                            {renderAvatarInitials(staff.name, staff.role, staff.profilePicture, "w-9 h-9 text-xs")}
                            <div>
                              <span className="text-xs block text-[#2C261F] font-bold">{staff.name}</span>
                              <span className="text-[9px] uppercase tracking-wider text-[#8C8375] font-semibold mt-0.5">{staff.role}</span>
                            </div>
                          </div>
                        </td>

                        {/* Inline Base Monthly Salary Edit */}
                        <td className="py-2.5 px-4 text-center">
                          <div className="relative flex flex-col items-center gap-0.5">
                            <input
                              type="number"
                              min="0"
                              value={staff.hourlyRate}
                              onChange={(e) => updateStaffHourlyRate(staff.id, Number(e.target.value))}
                              disabled={isPayrollMonthLocked}
                              className={cn(
                                "w-24 text-[10px] font-bold font-mono px-2 py-1.5 rounded-lg border text-center outline-none transition-all",
                                isPayrollMonthLocked
                                  ? "bg-slate-50/50 text-[#8C8375]/70 border-[#E6E1DA]/50 cursor-not-allowed"
                                  : "bg-white text-[#2C261F] border-[#E6E1DA] focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52]"
                              )}
                            />
                            <span className="text-[7px] text-[#8C8375] font-medium font-sans">Base Monthly</span>
                          </div>
                        </td>

                        {/* Days summary Present / Absent / Leave */}
                        <td className="py-2.5 px-4 text-center font-sans">
                          <div className="relative flex flex-col items-center gap-0.5">
                            <div className="flex items-center justify-center gap-1">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] rounded font-bold" title="Present days count">
                                {days.present}P
                              </span>
                              <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] rounded font-bold" title="Absent days count">
                                {days.absent}A
                              </span>
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] rounded font-bold" title="Leave days count">
                                {days.leave}L
                              </span>
                            </div>
                            <span className="text-[7px] text-[#8C8375] font-medium font-sans">Attendance Logs</span>
                          </div>
                        </td>

                        {/* Customizable absence deduction override option */}
                        <td className="py-2.5 px-4 text-center">
                          <div className="relative flex flex-col items-center gap-0.5">
                            <input
                              type="number"
                              min="0"
                              value={isCustomAbsence ? (record.absenceDeductions ?? '') : ''}
                              onChange={(e) => updatePayrollAbsenceDeductions(staff.id, e.target.value)}
                              disabled={isPayrollMonthLocked}
                              className={cn(
                                "w-24 text-[10px] font-bold font-mono px-2 py-1.5 rounded-lg border text-center outline-none transition-all",
                                isPayrollMonthLocked
                                  ? "bg-slate-50/50 text-rose-700/50 border-[#E6E1DA]/50 cursor-not-allowed"
                                  : isCustomAbsence 
                                    ? "border-amber-400 bg-amber-50/30 text-amber-700 focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52]" 
                                    : "border-[#E6E1DA] bg-white text-rose-700 focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52]"
                              )}
                              placeholder={autoAbsenceDeduction.toString()}
                            />
                            {isCustomAbsence ? (
                              <span className="text-[7px] text-amber-600 font-bold uppercase tracking-wider">Customized</span>
                            ) : (
                              days.absent > 0 ? (
                                <span className="text-[7px] text-rose-600 font-medium font-sans">Auto ({days.absent}d absent)</span>
                              ) : (
                                <span className="text-[7px] text-[#8C8375] font-medium font-sans">Auto (No absent)</span>
                              )
                            )}
                          </div>
                        </td>

                        {/* Inline advance salary or cash deductions */}
                        <td className="py-2.5 px-4 text-center">
                          <div className="relative flex flex-col items-center gap-0.5">
                            <input
                              type="number"
                              min="0"
                              value={record.deductions || ''}
                              onChange={(e) => updatePayrollDeductions(staff.id, Number(e.target.value))}
                              disabled={isPayrollMonthLocked}
                              className={cn(
                                "w-24 text-[10px] font-bold font-mono px-2 py-1.5 rounded-lg border text-center outline-none transition-all",
                                isPayrollMonthLocked
                                  ? "bg-slate-50/50 text-rose-700/50 border-[#E6E1DA]/50 cursor-not-allowed"
                                  : "border-[#E6E1DA] bg-white text-rose-700 focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52]"
                              )}
                              placeholder="0"
                            />
                            {record.deductions > 0 ? (
                              <span className="text-[7px] text-amber-600 font-bold uppercase tracking-wider">Customized</span>
                            ) : (
                              <span className="text-[7px] text-[#8C8375] font-medium font-sans">Manual Entry</span>
                            )}
                          </div>
                        </td>

                        {/* Inline Bonus/Incentive Adjustments */}
                        <td className="py-2.5 px-4 text-center">
                          <div className="relative flex flex-col items-center gap-0.5">
                            <input
                              type="number"
                              min="0"
                              value={record.bonus || ''}
                              onChange={(e) => updatePayrollBonus(staff.id, Number(e.target.value))}
                              disabled={isPayrollMonthLocked}
                              className={cn(
                                "w-24 text-[10px] font-bold font-mono px-2 py-1.5 rounded-lg border text-center outline-none transition-all",
                                isPayrollMonthLocked
                                  ? "bg-slate-50/50 text-emerald-700/50 border-[#E6E1DA]/50 cursor-not-allowed"
                                  : "border-[#E6E1DA] bg-white text-emerald-700 focus:border-[#B88A52] focus:ring-1 focus:ring-[#B88A52]"
                              )}
                              placeholder="0"
                            />
                            {record.bonus > 0 ? (
                              <span className="text-[7px] text-emerald-600 font-bold uppercase tracking-wider">Customized</span>
                            ) : (
                              <span className="text-[7px] text-[#8C8375] font-medium font-sans">Manual Entry</span>
                            )}
                          </div>
                        </td>

                        {/* Live dynamic Net monthly salary payout */}
                        <td className="py-2.5 px-4 text-center bg-[#FAF4EB]/30">
                          <div className="relative flex flex-col items-center gap-0.5">
                            <span className="text-xs font-extrabold font-mono text-[#B88A52]">₹{netPay.toLocaleString('en-IN')}</span>
                            <span className="text-[7px] text-[#8C8375] font-medium font-sans">Calculated Net</span>
                          </div>
                        </td>

                        {/* Status Droplist selection */}
                        <td className="py-2.5 px-4 text-center w-32">
                          <div className="relative flex flex-col items-center gap-0.5">
                            <select
                              value={record.status}
                              onChange={(e) => updatePayrollStatus(staff.id, e.target.value as any)}
                              disabled={isPayrollMonthLocked}
                              className={cn(
                                "px-2 py-1.5 text-[9px] font-bold uppercase rounded-lg border outline-none cursor-pointer w-28 text-center transition-colors font-sans focus:ring-1 focus:ring-[#B88A52]/30",
                                isPayrollMonthLocked
                                  ? "bg-emerald-50/40 border-emerald-200/50 text-emerald-700 cursor-not-allowed"
                                  : record.status === 'Paid'
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : record.status === 'Processing'
                                      ? "bg-amber-50 border-amber-200 text-amber-700"
                                      : "bg-slate-50 border-slate-200 text-slate-500"
                              )}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Paid">Paid</option>
                            </select>
                            <span className="text-[7px] text-[#8C8375] font-medium font-sans">Status State</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-3.5 border-t border-[#F0ECE6] mt-4">
              {!isPayrollMonthLocked ? (
                <button
                  onClick={() => {
                    markAllPayrollPaid();
                    alert('All active employee payouts have been authorized and marked as Paid.');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  Mark All Salaried Staff as Paid
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 text-[10px] font-bold uppercase rounded-lg border border-amber-200/50">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  Audit Locked
                </div>
              )}
              
              <button
                onClick={() => setIsPayrollOpen(false)}
                className="px-5 py-2.5 bg-[#2C261F] hover:bg-[#3D352C] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Payroll Manager
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
