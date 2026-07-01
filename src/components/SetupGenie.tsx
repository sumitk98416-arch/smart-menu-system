'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, MessageSquare, Check, ChevronDown, ChevronUp, X, HelpCircle, Send, ArrowRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Core checklist tasks definitions
interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  href: string;
  isCompleted: boolean;
}

// Predefined chat responses for quick-replies or keywords
const CHAT_KNOWLEDGE_BASE = [
  {
    keywords: ['qr', 'scan', 'print', 'code', 'table'],
    question: "How do I set up and print QR codes for tables?",
    answer: "Go to the **Tables & QR** tab. From there, you can add individual tables or generate tables in bulk. Each table gets a unique QR code. Click the 'Download QR' button on any table card to print it. When customers scan it, they can view the live menu and order instantly!"
  },
  {
    keywords: ['kitchen', 'display', 'screen', 'chef'],
    question: "How does the Kitchen Display screen work?",
    answer: "The **Kitchen** tab shows incoming customer orders in real-time. Chefs can view items, order notes, and elapsed time. When an order is ready, they can mark it complete. You can launch the dedicated full-screen kitchen monitor by clicking 'Open Kitchen display' in the sidebar."
  },
  {
    keywords: ['tax', 'gst', 'cgst', 'sgst', 'charge'],
    question: "Can I customize the tax/GST rates and service charges?",
    answer: "Yes! Navigate to **Settings → General Settings**. Under the tax configuration card, you can set custom percentages for CGST, SGST, and service charges. These are automatically computed and displayed on customer checkouts."
  },
  {
    keywords: ['premium', 'upgrade', 'autopay', 'price', 'plan'],
    question: "What features are unlocked in the Premium Plan?",
    answer: "The Premium Plan unlocks unlimited table QR code downloads, complete multi-employee staff access controls, full sales/finance analytics exports, and unlimited active customer orders. You can subscribe via Razorpay Autopay in **Settings → Subscription**."
  },
  {
    keywords: ['staff', 'employee', 'waiter', 'role'],
    question: "How do I add and manage my restaurant staff?",
    answer: "Head to the **Staff** tab in the sidebar. Click 'Add Staff Member' to enter their name, role (e.g. Waiter, Chef, Manager), and contact details. You can track their payroll, wages, and shift status from here."
  }
];

export default function SetupGenie() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'chat'>('checklist');
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);

  // Chat States
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'genie', text: string }>>([
    { sender: 'genie', text: "Hi! I'm Foody 👋 I'll help you set up your restaurant in under 5 minutes. Feel free to ask me anything or click a question below!" }
  ]);
  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load and check tasks status dynamically
  const checkOnboardingProgress = () => {
    if (typeof window === 'undefined') return;

    try {
      // 1. Check Restaurant Profile settings
      const savedRest = localStorage.getItem('qrestro_demo_restaurant');
      const restData = savedRest ? JSON.parse(savedRest) : null;
      const isProfileDone = !!(restData && restData.name && restData.name !== "The Golden Plate" && restData.name.trim() !== "");

      // 2. Check QR Tables
      const savedTables = localStorage.getItem('qrestro_demo_tables');
      const tablesData = savedTables ? JSON.parse(savedTables) : [];
      const isTablesDone = tablesData.length > 0;

      // 3. Check Menu Items
      const savedItems = localStorage.getItem('qrestro_demo_items');
      const itemsData = savedItems ? JSON.parse(savedItems) : [];
      const isMenuDone = itemsData.length > 0;

      // 4. Check Staff
      const savedStaff = localStorage.getItem('qrestro_staff_list');
      const staffData = savedStaff ? JSON.parse(savedStaff) : [];
      const isStaffDone = staffData.length > 0;

      // 5. Check Subscription
      const savedSub = localStorage.getItem('qrestro_demo_subscription');
      const subData = savedSub ? JSON.parse(savedSub) : null;
      const isSubscribed = !!(subData && subData.plan === 'premium');

      const initialTasks: OnboardingTask[] = [
        {
          id: 'profile',
          title: 'Setup Restaurant Profile',
          description: 'Give your restro a custom name and currency',
          href: '/dashboard/settings',
          isCompleted: isProfileDone
        },
        {
          id: 'tables',
          title: 'Create a QR Table',
          description: 'Add restaurant tables to download printable QRs',
          href: '/dashboard/tables',
          isCompleted: isTablesDone
        },
        {
          id: 'menu',
          title: 'Add a Menu Item',
          description: 'Populate your categories with delicious food items',
          href: '/dashboard/menu',
          isCompleted: isMenuDone
        },
        {
          id: 'staff',
          title: 'Add a Staff Member',
          description: 'Add your first chef or waiter to coordinate',
          href: '/dashboard/staff',
          isCompleted: isStaffDone
        },
        {
          id: 'premium',
          title: 'Activate Premium Sub',
          description: 'Unlock unlimited orders and analytics reports',
          href: '/dashboard/settings?tab=subscription',
          isCompleted: isSubscribed
        }
      ];

      setTasks(current => {
        // Find if any task just became completed to trigger celebration
        if (current.length > 0) {
          initialTasks.forEach(task => {
            const match = current.find(c => c.id === task.id);
            if (match && !match.isCompleted && task.isCompleted) {
              setLastCompletedId(task.id);
              setShowCelebration(true);
              setTimeout(() => setShowCelebration(false), 4000);
            }
          });
        }
        return initialTasks;
      });

      const completed = initialTasks.filter(t => t.isCompleted).length;
      setCompletedCount(completed);
    } catch (e) {
      console.error('Error loading onboarding tasks in Genie:', e);
    }
  };

  useEffect(() => {
    checkOnboardingProgress();

    // Listen for storage updates to refresh checklist reactively
    const interval = setInterval(checkOnboardingProgress, 2000);
    window.addEventListener('storage', checkOnboardingProgress);
    window.addEventListener('qrestro_subscription_changed', checkOnboardingProgress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkOnboardingProgress);
      window.removeEventListener('qrestro_subscription_changed', checkOnboardingProgress);
    };
  }, []);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleAskQuestion = (questionText: string) => {
    setMessages(prev => [...prev, { sender: 'user', text: questionText }]);

    // Find best match in knowledge base
    const query = questionText.toLowerCase();
    let bestMatch = CHAT_KNOWLEDGE_BASE.find(kb => 
      kb.keywords.some(k => query.includes(k))
    );

    setTimeout(() => {
      if (bestMatch) {
        setMessages(prev => [...prev, { sender: 'genie', text: bestMatch!.answer }]);
      } else {
        setMessages(prev => [...prev, { 
          sender: 'genie', 
          text: "I'm still learning! For this query, I recommend checking our official documentation or writing to our customer success team directly at supportqrestro@gmail.com. Can I help you with table setup or tax settings?" 
        }]);
      }
    }, 700);
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    handleAskQuestion(inputVal.trim());
    setInputVal('');
  };

  const activeTasksCount = tasks.length - completedCount;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-body">
      {/* ── EXPANDABLE PANEL ── */}
      {isOpen && (
        <div className="w-[360px] max-w-[calc(100vw-2rem)] h-[480px] bg-white border border-[#E6E1DA] shadow-2xl rounded-3xl mb-4 flex flex-col overflow-hidden animate-scale-in">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#B88A52] to-[#D4AF37] p-5 text-white flex items-center justify-between flex-shrink-0 relative overflow-hidden">
            {/* Sparkle background elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-white/30 overflow-hidden relative shadow-inner flex items-center justify-center">
                <img src="/foody_mascot.png" alt="Foody" className="w-full h-full object-cover scale-110" />
                {activeTasksCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#B88A52]">
                    {activeTasksCount}
                  </span>
                )}
              </div>
              <div className="text-left">
                <h3 className="font-heading font-bold text-base leading-tight">Foody</h3>
                <span className="text-white/80 text-[11px] font-medium block mt-0.5">Your Helpful Food Setup Genie</span>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Celebration Overlay */}
          {showCelebration && (
            <div className="absolute inset-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-amber-500/10 text-amber-600 rounded-3xl flex items-center justify-center mb-4 border border-amber-500/20 animate-bounce">
                <Trophy className="w-10 h-10" />
              </div>
              <h4 className="font-heading font-bold text-xl text-ink-900">Task Completed! 🎉</h4>
              <p className="text-sm text-ink-500 mt-2 max-w-xs leading-relaxed">
                Awesome! You are one step closer to launching your restaurant ordering system. Keep it up!
              </p>
              
              {/* CSS Confetti bits */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-2 h-2 rounded-full animate-float-particle" 
                    style={{
                      backgroundColor: ['#B88A52', '#D4AF37', '#10B981', '#3B82F6', '#EC4899'][i % 5],
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: `${2 + Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#E6E1DA] bg-cream-50/50 flex-shrink-0">
            <button 
              onClick={() => setActiveTab('checklist')}
              className={cn(
                "flex-1 py-3 text-xs font-bold text-ink-500 border-b-2 border-transparent transition-all cursor-pointer",
                activeTab === 'checklist' && "border-[#B88A52] text-[#B88A52] bg-white"
              )}
            >
              Setup Checklist ({completedCount}/{tasks.length})
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn(
                "flex-1 py-3 text-xs font-bold text-[#5A5348] border-b-2 border-transparent transition-all cursor-pointer",
                activeTab === 'chat' && "border-[#B88A52] text-[#B88A52] bg-white"
              )}
            >
              Ask Foody
            </button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#FAF8F5]">
            
            {/* Checklist Tab */}
            {activeTab === 'checklist' && (
              <div className="space-y-3.5">
                {/* Onboarding Progress Card */}
                <div className="bg-white border border-[#E6E1DA] rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-xs text-ink-450 font-bold block">Onboarding Progress</span>
                    <span className="font-heading font-extrabold text-2xl text-ink-900 mt-1 block">
                      {Math.round((completedCount / tasks.length) * 100)}%
                    </span>
                  </div>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#E6E1DA" strokeWidth="4" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#B88A52" strokeWidth="4" 
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - completedCount / tasks.length)} 
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-extrabold text-[#B88A52]">
                      {completedCount}/{tasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-2.5">
                  {tasks.map(task => (
                    <Link
                      key={task.id}
                      href={task.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-start gap-3.5 p-3.5 rounded-2xl border bg-white shadow-xs transition-all duration-200 hover:border-[#B88A52]/30 hover:shadow-md group",
                        task.isCompleted ? "border-emerald-500/10 bg-emerald-500/[0.01]" : "border-[#E6E1DA]"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border mt-0.5 flex-shrink-0 transition-all",
                        task.isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "border-ink-300 group-hover:border-[#B88A52]"
                      )}>
                        {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      
                      <div className="text-left flex-1 min-w-0">
                        <h4 className={cn(
                          "text-sm font-bold transition-all text-ink-900 group-hover:text-[#B88A52]",
                          task.isCompleted && "text-ink-450 line-through decoration-emerald-500/30"
                        )}>
                          {task.title}
                        </h4>
                        <p className={cn(
                          "text-xs mt-0.5 leading-relaxed text-ink-450",
                          task.isCompleted && "text-ink-400"
                        )}>
                          {task.description}
                        </p>
                      </div>

                      {!task.isCompleted && (
                        <ArrowRight className="w-4 h-4 text-ink-350 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full space-y-3.5">
                {/* Messages Bubbles */}
                <div className="flex-1 space-y-3 pr-1 overflow-y-auto">
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex gap-2.5 items-start max-w-[85%]",
                        msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      {msg.sender === 'genie' && (
                        <div className="w-7 h-7 rounded-full bg-white border border-[#E6E1DA] overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <img src="/foody_mascot.png" alt="Foody" className="w-full h-full object-cover scale-115" />
                        </div>
                      )}
                      <div 
                        className={cn(
                          "rounded-2xl p-3 text-xs leading-relaxed font-medium text-left shadow-xs",
                          msg.sender === 'user' 
                            ? "bg-[#B88A52] text-white rounded-tr-none" 
                            : "bg-white border border-[#E6E1DA] text-ink-800 rounded-tl-none"
                        )}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick replies suggestions */}
                <div className="space-y-1.5 flex-shrink-0">
                  <span className="text-[10px] text-ink-400 font-extrabold uppercase tracking-wide block text-left">Quick Questions:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                    {CHAT_KNOWLEDGE_BASE.map((kb, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskQuestion(kb.question)}
                        className="bg-white border border-[#E6E1DA] hover:border-[#B88A52]/30 hover:bg-cream-50 text-ink-600 hover:text-[#B88A52] text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all text-left truncate max-w-full cursor-pointer"
                      >
                        {kb.question}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input block */}
                <div className="flex gap-2 border-t border-[#E6E1DA] pt-3 bg-[#FAF8F5] flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Ask Foody a question..."
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="flex-1 bg-white border border-[#E6E1DA] rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#B88A52] transition-colors font-medium text-ink-800"
                  />
                  <button 
                    onClick={handleSend}
                    className="w-9 h-9 bg-[#B88A52] hover:bg-[#A37844] text-white flex items-center justify-center rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer branding */}
          <div className="bg-cream-50 border-t border-[#E6E1DA] py-2 px-4 flex items-center justify-between text-[10px] text-ink-400 font-bold flex-shrink-0">
            <span>FOODY ONBOARDING WIDGET</span>
            <span>V1.0</span>
          </div>

        </div>
      )}

      {/* Speech bubble floating next to Foody */}
      {!isOpen && (
        <div className="absolute right-22 bottom-4 bg-white border border-[#E6E1DA] text-ink-950 text-xs font-bold px-4.5 py-3 rounded-2xl shadow-xl mr-2 animate-fade-in select-none flex items-center gap-2 max-w-xs leading-relaxed border-l-4 border-l-[#B88A52] whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
          <div className="text-left font-medium">
            <span className="font-extrabold text-[#B88A52] block">Foody is here! 👋</span>
            <span className="text-[11px] text-ink-650 mt-0.5 block">Let's set up your restaurant in under 5 mins!</span>
          </div>
          {/* Arrow pointing to Foody */}
          <div className="absolute top-1/2 -right-2.5 transform -translate-y-1/2 w-0 h-0 border-y-6 border-y-transparent border-l-6 border-l-white" />
          <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-0 h-0 border-y-[7px] border-y-transparent border-l-[7px] border-l-[#E6E1DA] -z-10" />
        </div>
      )}

      {/* ── FLOATING MASCOT TRIGGER BUTTON ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-20 h-20 cursor-pointer select-none transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none z-50 flex items-center justify-center"
      >
        {isOpen ? (
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#B88A52] to-[#D4AF37] border-2 border-white flex items-center justify-center shadow-lg transition-transform duration-300 rotate-90">
            <X className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="relative w-20 h-20 flex items-center justify-center animate-float-character">
            {/* Glowing ring/shadow behind Foody */}
            <div className="absolute w-14 h-14 rounded-full bg-amber-500/20 blur-md -z-10 animate-pulse" />
            
            {/* Mascot Image */}
            <img 
              src="/foody_mascot.png" 
              alt="Foody Mascot" 
              className="w-18 h-18 object-contain drop-shadow-[0_8px_16px_rgba(184,138,82,0.3)] rounded-3xl"
            />
            
            {/* Quick action notification badge */}
            {activeTasksCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-20">
                {activeTasksCount}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Embedded CSS animation helpers */}
      <style jsx global>{`
        @keyframes float-particle {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
        }
        @keyframes float-character {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        .animate-float-particle {
          animation: float-particle 2s ease-out infinite;
        }
        .animate-float-character {
          animation: float-character 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
