'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  UtensilsCrossed, QrCode, ChefHat, Star, ArrowRight, Smartphone, 
  BarChart3, Shield, BookOpen, ShoppingCart, Zap, Scan, ConciergeBell, 
  TrendingUp, X, Check, Heart, User, ClipboardList, Lock, Users, 
  Cookie, Store, History, Mail, FileText, Cloud, AlertTriangle, Bell,
  Copyright, Scale, RotateCw, ShieldCheck, Phone, Send 
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ========================================================================= */
/* ✨ Next-Level Network Constellation Particle System                        */
/* ========================================================================= */
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse state
    let mouseX = 0;
    let mouseY = 0;
    let mouseActive = false;

    // Harmonious gold-beige palette matching QRestro's premium branding
    const COLORS = [
      { r: 184, g: 138, b: 82  },  // Brand Gold
      { r: 212, g: 175, b: 55  },  // Metallic Gold
      { r: 236, g: 201, b: 136 },  // Soft Amber
      { r: 254, g: 243, b: 199 },  // Champagne Warmth
      { r: 255, g: 255, b: 255 },  // Pure White Star
    ];

    // Subtle click sparkle class
    class Sparkle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: { r: number; g: number; b: number };
      alpha: number;
      life: number;
      maxLife: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 1.5 + 0.5;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.alpha = 0.8;
        this.maxLife = Math.random() * 20 + 15;
        this.life = this.maxLife;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life--;
        this.alpha = Math.max(this.life / this.maxLife, 0);
      }

      draw(ctx: CanvasRenderingContext2D) {
        const { r, g, b } = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.65})`;
        ctx.fill();
      }
    }

    // ── Elegant Slow Drifting Star Node ──
    class Node {
      x: number; y: number;
      vx: number; vy: number;
      r: number;
      color: { r: number; g: number; b: number };
      alpha: number;
      pulseSpeed: number;
      pulsePhase: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        
        // Whisper slow velocity for parallax feel (0.05 to 0.18)
        const speed = Math.random() * 0.13 + 0.05;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Subtle sizes (0.4px to 1.3px)
        this.r = Math.random() * 0.9 + 0.4;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.alpha = Math.random() * 0.35 + 0.25;
        this.pulseSpeed = Math.random() * 0.015 + 0.005;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      update(time: number) {
        // Very gentle mouse repulsion to keep landing text readable
        if (mouseActive) {
          const dx = this.x - mouseX;
          const dy = this.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (150 - dist) / 150;
            // Pushes particles slightly away from mouse
            this.x += (dx / dist) * force * 0.6;
            this.y += (dy / dist) * force * 0.6;
          }
        }

        this.x += this.vx;
        this.y += this.vy;

        // Wrap edges smoothly
        if (this.x < -10) this.x = width + 10;
        if (this.x > width + 10) this.x = -10;
        if (this.y < -10) this.y = height + 10;
        if (this.y > height + 10) this.y = -10;

        // Elegant twinkling pulsing
        this.alpha = 0.3 + Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.2;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const { r, g, b } = this.color;

        // Outer ambient glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.08})`;
        ctx.fill();

        // Star core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.8})`;
        ctx.fill();
      }
    }

    // ── Rare Shooting Star ──
    class Streak {
      x: number; y: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      color: { r: number; g: number; b: number };

      constructor() {
        this.x = Math.random() * (width * 0.6);
        this.y = Math.random() * (height * 0.4);
        
        // Rapid angled path
        const angle = Math.PI / 6 + (Math.random() - 0.5) * 0.2; // roughly 30 degrees
        const speed = Math.random() * 4 + 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.maxLife = Math.random() * 30 + 15;
        this.life = this.maxLife;
        this.color = COLORS[Math.floor(Math.random() * (COLORS.length - 1))];
      }

      update() { 
        this.x += this.vx; 
        this.y += this.vy; 
        this.life--; 
      }
      
      get dead() { return this.life <= 0; }

      draw(ctx: CanvasRenderingContext2D) {
        const progress = this.life / this.maxLife;
        const { r, g, b } = this.color;
        const alpha = progress * 0.45;
        const tailX = this.x - this.vx * 5;
        const tailY = this.y - this.vy * 5;

        const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    }

    // ── Whisper-thin connections between close stars ──
    const MAX_DIST = 90;
    function drawConnections(ctx: CanvasRenderingContext2D, nodes: Node[]) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const t = 1 - dist / MAX_DIST;
            const { r, g, b } = nodes[i].color;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${t * t * 0.07})`; // Whisper thin, barely visible
            ctx.lineWidth = t * 0.45;
            ctx.stroke();
          }
        }
      }
    }

    // ── Init elements (Dense, yet very soft and minimal) ──
    const numNodes = Math.min(Math.floor((width * height) / 8000), 110); // High density, extremely elegant
    const nodes: Node[] = Array.from({ length: numNodes }, () => new Node());
    const streaks: Streak[] = [];
    const sparkles: Sparkle[] = [];
    let lastStreakTime = Date.now();

    const handleResize = () => { 
      width = canvas.width = window.innerWidth; 
      height = canvas.height = window.innerHeight; 
    };
    
    const handleMouseMove = (e: MouseEvent) => { 
      mouseX = e.clientX; 
      mouseY = e.clientY; 
      mouseActive = true; 
    };
    
    const handleMouseLeave = () => { 
      mouseActive = false; 
    };
    
    const handleMouseClick = (e: MouseEvent) => {
      // Small elegant sparkle burst (5 tiny stars)
      for (let i = 0; i < 5; i++) {
        sparkles.push(new Sparkle(e.clientX, e.clientY));
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleMouseClick);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const time = Date.now();

      // Rare streaks (calm interval: spawn max 1 streak at a time, every 7-12 seconds)
      if (streaks.length < 1 && time - lastStreakTime > 7000 + Math.random() * 5000) {
        streaks.push(new Streak());
        lastStreakTime = time;
      }

      // 1. Draw rare streaks behind
      for (let i = streaks.length - 1; i >= 0; i--) {
        streaks[i].update();
        streaks[i].draw(ctx);
        if (streaks[i].dead) streaks.splice(i, 1);
      }

      // 2. Draw connections
      drawConnections(ctx, nodes);

      // 3. Draw stars
      for (const node of nodes) {
        node.update(time);
        node.draw(ctx);
      }

      // 4. Draw click sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        sparkles[i].update();
        sparkles[i].draw(ctx);
        if (sparkles[i].life <= 0) sparkles.splice(i, 1);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleMouseClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 15 }}
    />
  );
}


interface PortalIntroSequenceProps {
  onEnter: () => void;
  isExiting: boolean;
}

function PortalIntroSequence({ onEnter, isExiting }: PortalIntroSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoVisible, setLogoVisible] = useState(false);
  const [btnVisible, setBtnVisible] = useState(false);

  // 1. UI animation fade-in sequence
  useEffect(() => {
    const timeouts = [
      setTimeout(() => setLogoVisible(true), 300),
      setTimeout(() => setBtnVisible(true), 1100),
    ];

    return () => timeouts.forEach(t => clearTimeout(t));
  }, []);

  // 2. Warp-speed Starfield Vortex canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const cx = width / 2;
    const cy = height / 2;

    const numStars = 180;
    const stars: { x: number; y: number; z: number; color: string }[] = [];

    // Colors matching QRestro's premium gold theme
    const colors = ['#B88A52', '#D4AF37', '#FEEBC8', '#FFFFFF', '#ECCFA0'];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 1500,
        y: (Math.random() - 0.5) * 1500,
        z: Math.random() * width,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Speed starts fast and decelerates as title loads, then accelerates at enter!
    let speed = 25;

    const animate = () => {
      // Very slight translucent clearing for faint trailing warp streaks
      ctx.fillStyle = 'rgba(7, 7, 8, 0.16)';
      ctx.fillRect(0, 0, width, height);

      // Adjust speed dynamically based on states
      if (isExiting) {
        speed += 1.8; // Warp burst out on enter!
      } else if (logoVisible && speed > 5) {
        speed -= 0.18; // Soft deceleration as UI shows
      }

      for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        star.z -= speed;

        // Reset stars passing the screen view depth
        if (star.z <= 0) {
          star.z = width;
          star.x = (Math.random() - 0.5) * 1500;
          star.y = (Math.random() - 0.5) * 1500;
        }

        // Project 3D vector onto 2D viewport
        const k = 600 / star.z;
        const px = cx + star.x * k;
        const py = cy + star.y * k;

        // Project trailing coordinates
        const prevK = 600 / (star.z + speed * 1.5);
        const prevPx = cx + star.x * prevK;
        const prevPy = cy + star.y * prevK;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha = Math.min(1.0, 1 - star.z / width);
          const size = Math.max(0.4, (1 - star.z / width) * 2.8);

          // Draw warp path lines
          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = star.color;
          ctx.lineWidth = size * 0.8;
          ctx.stroke();

          // Draw star core dot
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [logoVisible, isExiting]);

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] bg-[#070708] flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out",
      isExiting && "scale-[1.12] opacity-0 blur-md pointer-events-none"
    )}>
      {/* 🌌 Intro Warp Vortex Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Brand & Loading Info Centered Container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-lg">
        {/* Glowing QRestro Cloche Logo */}
        <div className={cn(
          "mb-6 transform scale-90 transition-all duration-1000 ease-out",
          logoVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8"
        )}>
          <div className="w-20 h-20 bg-gradient-to-br from-[#B88A52] to-[#8C6028] rounded-2xl flex items-center justify-center shadow-2xl shadow-gold-500/35 border border-[#B88A52]/20 relative group">
            {/* Ambient golden halo glow around logo */}
            <div className="absolute inset-0 bg-[#B88A52]/20 blur-xl rounded-full -z-10 group-hover:scale-110 transition-transform duration-300" />
            
            <svg className="w-14 h-14 text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              {/* Clover / Crown Knob at top */}
              <path d="M 45 38 C 42 38, 38 35, 41 30 C 44 25, 48 29, 50 32 C 50 29, 54 25, 57 30 C 60 35, 56 38, 53 38 Q 50 42 50 44 Z M 50 44 L 50 48" strokeWidth="2.8" fill="none" />
              <circle cx="50" cy="27" r="3.5" fill="currentColor" stroke="none" />
              
              {/* Cloche Dome */}
              <path d="M 12 76 A 38 38 0 0 1 88 76 Z" strokeWidth="4" />
              
              {/* Inner Left Highlight Glint */}
              <path d="M 20 70 A 30 30 0 0 1 36 49" strokeWidth="2.5" opacity="0.6" />
              
              {/* Platter / Tray Base */}
              <rect x="5" y="76" width="90" height="5" rx="2.5" fill="currentColor" stroke="none" />
              <path d="M 12 83 Q 50 86 88 83" strokeWidth="3" />
              
              {/* Inner Realistic QR Code */}
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
          </div>
        </div>

        {/* Brand Name with Golden glow */}
        <h1 className={cn(
          "font-heading text-4xl md:text-5xl font-bold tracking-tight text-white mb-2 transition-all duration-1000 delay-200 ease-out drop-shadow-[0_0_25px_rgba(184,138,82,0.35)]",
          logoVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          QRestro
        </h1>
        
        <p className={cn(
          "text-[10px] tracking-[0.25em] font-bold text-[#B88A52] uppercase mb-6 transition-all duration-1000 delay-300 ease-out",
          logoVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          Smart QR Dining Portal
        </p>

        {/* Enter Trigger Button */}
        <div className="h-14 mt-8 flex items-center justify-center">
          {btnVisible && (
            <button
              onClick={onEnter}
              className="px-6 py-2.5 bg-gradient-to-r from-[#B88A52] to-[#8C6028] hover:from-[#d4a86c] hover:to-[#a67520] text-white text-xs tracking-widest font-extrabold uppercase rounded-xl shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-[#B88A52]/20 cursor-pointer animate-fade-in"
            >
              Enter Restaurant Portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


export default function HomePage() {
  const [portalEntered, setPortalEntered] = useState(false);
  const [showPortalIntro, setShowPortalIntro] = useState(true);

  const [aboutOpen, setAboutOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      _subject: `New QRestro Contact Inquiry: ${formData.get('subject')}`,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        try {
          const inquiries = JSON.parse(localStorage.getItem('qrestro_contact_inquiries') || '[]');
          inquiries.unshift({
            id: `inq-${Date.now()}`,
            name: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message,
            status: 'pending',
            created_at: new Date().toISOString()
          });
          localStorage.setItem('qrestro_contact_inquiries', JSON.stringify(inquiries));
        } catch (err) {
          console.error('Error writing to contact inquiries:', err);
        }
        setSubmitSuccess(true);
        e.currentTarget.reset();
      } else {
        alert("Something went wrong. Please try again or contact us directly at supportqrestro@gmail.com");
      }
    } catch (error) {
      alert("Something went wrong. Please try again or contact us directly at supportqrestro@gmail.com");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {showPortalIntro && (
        <PortalIntroSequence 
          onEnter={() => {
            setPortalEntered(true);
            setTimeout(() => {
              setShowPortalIntro(false);
            }, 1000);
          }} 
          isExiting={portalEntered}
        />
      )}

      <div className={cn(
        "min-h-screen bg-[#070708] text-gray-100 font-body relative overflow-x-hidden selection:bg-purple-500/30 selection:text-white transition-all duration-1000 ease-in-out",
        !portalEntered && "opacity-0 scale-95 blur-sm pointer-events-none"
      )}>
        {/* 🌠 Active Hyperspace Starfield background */}
        <Starfield />

      {/* Background Ambient Radial Glow Pools (Sci-Fi Aesthetic) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-[#B88A52]/5 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-[-5%] w-[45%] h-[45%] bg-indigo-900/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* ========================================================================= */}
      {/* 🧭 Navigation Header                                                      */}
      {/* ========================================================================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#070708]/65 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-12 h-12 bg-gradient-to-br from-[#B88A52] to-[#8C6028] rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/15 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-9 h-9 text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Clover / Crown Knob at top */}
                <path d="M 45 38 C 42 38, 38 35, 41 30 C 44 25, 48 29, 50 32 C 50 29, 54 25, 57 30 C 60 35, 56 38, 53 38 Q 50 42 50 44 Z M 50 44 L 50 48" strokeWidth="2.8" fill="none" />
                <circle cx="50" cy="27" r="3.5" fill="currentColor" stroke="none" />
                
                {/* Cloche Dome */}
                <path d="M 12 76 A 38 38 0 0 1 88 76 Z" strokeWidth="4" />
                
                {/* Inner Left Highlight Glint */}
                <path d="M 20 70 A 30 30 0 0 1 36 49" strokeWidth="2.5" opacity="0.6" />
                
                {/* Platter / Tray Base */}
                <rect x="5" y="76" width="90" height="5" rx="2.5" fill="currentColor" stroke="none" />
                <path d="M 12 83 Q 50 86 88 83" strokeWidth="3" />
                
                {/* Inner Realistic QR Code */}
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
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-white group-hover:text-gold-400 transition-colors">QRestro</span>
          </Link>
          <div className="flex items-center gap-1.5 md:gap-3 z-10">
            <button 
              onClick={() => setAboutOpen(true)}
              className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all cursor-pointer outline-none"
            >
              About Us
            </button>
            <button 
              onClick={() => setContactOpen(true)}
              className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all cursor-pointer outline-none"
            >
              Contact
            </button>
            <Link 
              href="/auth/login" 
              className="px-4 py-2 text-sm font-semibold text-gold-400 hover:text-gold-300 transition-all"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-5 py-2.5 bg-gradient-to-r from-[#B88A52] to-[#a67520] hover:from-[#c59a5c] hover:to-[#b8852c] text-white text-sm font-bold rounded-xl shadow-lg shadow-gold-500/10 hover:shadow-[0_0_20px_rgba(184,138,82,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 🚀 Hero Section                                                           */}
      {/* ========================================================================= */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden min-h-[92vh] flex items-center z-10">
        {/* Seamlessly Fused Right-Hand Visual */}
        <div 
          className="absolute inset-y-0 right-0 left-0 lg:left-[43%] z-0 pointer-events-none"
          style={{
            maskImage: 'radial-gradient(ellipse at 80% 50%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 80% 50%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 80%)'
          }}
        >
          <div className="w-full h-full relative">
            <img 
              src="/hero-visual-v9.png" 
              alt="QRestro Premium Dashboard Mockup" 
              className="w-full h-full object-cover object-center opacity-85"
            />
            {/* Blends image seamlessly into dark space theme */}
            <div className="absolute inset-y-0 left-0 w-80 bg-gradient-to-r from-[#070708] via-[#070708]/90 to-transparent hidden lg:block" />
            <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#070708] via-[#070708]/85 to-transparent lg:hidden" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070708] to-transparent" />
            <div className="absolute inset-0 bg-[#070708]/15 lg:hidden" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Sci-Fi Styling */}
            <div className="lg:col-span-7 flex flex-col items-start text-left animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-[#B88A52]/10 border border-[#B88A52]/20 px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-gold-400 uppercase mb-6 shadow-sm">
                <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
                Next-Gen Dining Technology
              </div>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6.5xl font-bold text-white leading-[1.08] mb-6 tracking-tight">
                Elegant Dining,
                <br />
                <span className="bg-gradient-to-r from-gold-400 via-gold-500 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(184,138,82,0.2)] animate-pulse" style={{ animationDuration: '4s' }}>Effortless</span> Ordering
              </h1>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed font-body max-w-xl mb-10">
                Transform your restaurant with smart QR-powered ordering. Guests scan, explore your menu in stunning detail, 
                and place orders in real-time — all directly from their table. Turn every table into an automated visual experience.
              </p>

              {/* 4 Feature Circles Row */}
              <div className="grid grid-cols-4 gap-4 w-full max-w-lg pt-8 border-t border-white/[0.08]">
                {[
                  { icon: <Scan className="w-5 h-5" />, title: 'Scan & Order' },
                  { icon: <Smartphone className="w-5 h-5" />, title: 'Explore Menu' },
                  { icon: <ConciergeBell className="w-5 h-5" />, title: 'Live Update' },
                  { icon: <TrendingUp className="w-5 h-5" />, title: 'Grow Sales' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gold-400 mb-3 group-hover:bg-gradient-to-br group-hover:from-gold-500 group-hover:to-purple-600 group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-md">
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-bold text-gray-300 group-hover:text-white transition-colors tracking-wide leading-tight">
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Space Placeholder to let the visual show through */}
            <div className="lg:col-span-5 h-[280px] sm:h-[380px] lg:h-[500px] w-full" />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ⚡ Features Grid                                                          */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 px-6 relative z-10 bg-[#070708]/40 border-y border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Everything Your Restaurant Needs
            </h2>
            <p className="text-gold-400 text-base md:text-lg font-semibold max-w-xl mx-auto tracking-wider uppercase">
              Unified ecosystem from QR codes to live operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {[
              {
                icon: <QrCode className="w-6 h-6" />,
                title: 'Table QR Ordering',
                desc: 'Generate gorgeous unique QR stands for each dining table. Customers scan and place orders instantly — completely app-free.',
              },
              {
                icon: <UtensilsCrossed className="w-6 h-6" />,
                title: 'Visual Menu Manager',
                desc: 'Organize menu items, categories, pricing, veg/non-veg tags, popularity badges, and real-time availability toggles.',
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: 'POS Billing & Invoicing',
                desc: 'Calculate custom tax rates (CGST, SGST, service charges), print thermal-style invoices, and download bills as PDF.',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Instant UPI Settlements',
                desc: 'Collect customer payments directly to your restaurant bank account via auto-generated dynamic UPI QR codes.',
              },
              {
                icon: <ChefHat className="w-6 h-6" />,
                title: 'Kitchen Display (KDS)',
                desc: 'Real-time order preparation queues for chefs with status colors, item detail expansions, and preparation timers.',
              },
              {
                icon: <ClipboardList className="w-6 h-6" />,
                title: 'Inventory & Wastage Logs',
                desc: 'Monitor raw material stock levels, log kitchen food wastage, and organize vendor purchase orders.',
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: 'Recipe & Ingredient Mapping',
                desc: 'Map ingredients and raw materials to specific menu items, list required quantities, and maintain prep guides.',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Staff Directory & Payroll',
                desc: 'Register staff members, assign user roles (Admin, Waiter, Chef), and track salaries, bonuses, and payout history.',
              },
              {
                icon: <Scale className="w-6 h-6" />,
                title: 'Operating Expenses',
                desc: 'Track non-food overhead costs like rent, utility bills, employee payroll, marketing, and general maintenance.',
              },
              {
                icon: <User className="w-6 h-6" />,
                title: 'Guest Directory Ledger',
                desc: 'Build customer contact lists capturing visit histories, order counts, and lifetime spending statistics.',
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: 'Guest Review Analytics',
                desc: 'Allow dining guests to rate food and service from 1 to 5 stars, submit suggestions, and review feedback trends.',
              },
              {
                icon: <Lock className="w-6 h-6" />,
                title: 'Custom Admin Controls',
                desc: 'Configure custom currency symbols, address headers, default tax rates, and secure kitchen/chef login credentials.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-[#0E0D10]/45 backdrop-blur-md border border-white/[0.06] hover:border-gold-500/40 hover:bg-[#121115]/65 transition-all duration-500 group shadow-lg hover:shadow-[0_0_30px_rgba(184,138,82,0.08)] hover:-translate-y-1.5 relative overflow-hidden"
              >
                {/* Ambient dynamic backlight glow blur pool */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold-500/10 via-purple-500/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                {/* Interactive premium stardust border halo on hover */}
                <div className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-gold-500/0 via-gold-500/30 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ margin: '-1px' }} />
                
                {/* Radial backdrop overlay */}
                <div className="absolute inset-0 bg-radial-gradient from-gold-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                {/* Premium Icon Container with scale, rotation, and custom glow */}
                <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center text-gold-400 mb-6 group-hover:bg-gradient-to-br group-hover:from-gold-500 group-hover:to-purple-500 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_0_20px_rgba(184,138,82,0.4)] transition-all duration-300">
                  {feature.icon}
                </div>
                
                <h3 className="font-heading text-xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-400 text-sm leading-relaxed font-body group-hover:text-gray-200 transition-colors duration-300">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🪐 How It Works Section                                                   */}
      {/* ========================================================================= */}
      <section className="py-28 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Interactive Flow
            </h2>
            <p className="text-[#8C6028] text-base md:text-lg font-bold tracking-widest uppercase">
              Four simple steps to absolute transformation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 relative">
            {[
              {
                icon: <QrCode className="w-8 h-8" />,
                title: '1. Scan QR Code',
                desc: 'Guests scan the unique table QR stand with their camera.',
              },
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: '2. Explore Details',
                desc: 'Browse dishes with photos, labels, and customized notes.',
              },
              {
                icon: <ShoppingCart className="w-8 h-8" />,
                title: '3. Instant Checkout',
                desc: 'Place the order which routes directly to the kitchen display.',
              },
              {
                icon: <ChefHat className="w-8 h-8" />,
                title: '4. Enjoy Dining',
                desc: 'Wait at the table as dishes are served steaming hot.',
              },
            ].map((item, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group cursor-default">
                {/* Horizontal flow connectors */}
                {i < 3 && (
                  <div className="hidden md:flex items-center justify-center absolute top-12 left-[calc(50%+3.5rem)] right-[calc(-50%+3.5rem)] z-0">
                    <ArrowRight className="w-5 h-5 text-white/[0.1] group-hover:text-gold-500/50 transition-colors duration-300" />
                  </div>
                )}

                {/* Glassmorphic Container with purple glow */}
                <div className="relative z-10 w-24 h-24 mb-6 rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center group-hover:border-gold-500/40 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(184,138,82,0.1)] group-hover:scale-105">
                  <div className="w-20 h-20 rounded-full border border-white/[0.04] flex items-center justify-center bg-white/[0.01] text-gold-400 group-hover:bg-gradient-to-br group-hover:from-[#B88A52] group-hover:to-[#7C3AED] group-hover:text-white transition-all duration-300">
                    {item.icon}
                  </div>
                </div>

                <h3 className="font-heading text-lg font-bold text-white mb-2 group-hover:text-gold-400 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed font-body">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🔮 CTA / Glow Banner Section                                              */}
      {/* ========================================================================= */}
      <section className="py-24 px-6 relative z-10 bg-[#070708]/30">
        <div className="max-w-5xl mx-auto">
          {/* Custom style tag for responsive CTA image mask */}
          <style dangerouslySetInnerHTML={{ __html: `
            .cta-image-mask {
              mask-image: linear-gradient(to bottom, transparent 0%, black 20%);
              -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%);
            }
            @media (min-width: 768px) {
              .cta-image-mask {
                mask-image: linear-gradient(to right, transparent 0%, black 28%);
                -webkit-mask-image: linear-gradient(to right, transparent 0%, black 28%);
              }
            }
          `}} />

          <div className="bg-gradient-to-br from-[#121115] via-[#0A090B] to-[#0A090A] border border-white/[0.08] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row items-center relative group">
            {/* Ambient Radial background highlights inside CTA */}
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none group-hover:scale-105 transition-all duration-500" />
            <div className="absolute top-0 left-0 w-60 h-60 bg-gold-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Left Column */}
            <div className="flex-1 p-10 md:p-16 text-left z-10 relative">
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                Ready to Upgrade<br />Your Operations?
              </h2>
              <p className="text-gray-300 text-base md:text-lg mb-10 max-w-md leading-relaxed font-body">
                Join hundreds of restaurants leveraging QRestro to unlock faster table turns, reviews, and delighted guests.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/auth/signup" 
                  className="px-8 py-4 bg-gradient-to-r from-[#B88A52] to-[#a67520] hover:from-[#c59a5c] hover:to-[#b8852c] text-white font-bold rounded-2xl transition-all shadow-lg shadow-gold-500/15 hover:scale-[1.02] active:scale-[0.98] text-center inline-block"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Right Column (Visual) with Responsive Mask to Fuse Image into Card Background */}
            <div className="w-full md:w-[48%] h-80 md:h-[460px] relative overflow-hidden self-stretch">
              <img 
                src="/cta-restaurant-scene.png" 
                alt="Cozy restaurant dining table with QRestro QR Code" 
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-102 transition-transform duration-700 cta-image-mask"
              />
              <div className="absolute inset-0 bg-[#070708]/10 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🪐 Footer Section                                                         */}
      {/* ========================================================================= */}
      <footer className="bg-[#070708] text-gray-400 py-16 px-6 relative z-10 border-t border-white/[0.06]">
        {/* Soft starlight highlight */}
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-gold-500/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#B88A52] to-[#8C6028] rounded-xl flex items-center justify-center shadow-md shadow-gold-500/10 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-11 h-11 text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Clover / Crown Knob at top */}
                  <path d="M 45 38 C 42 38, 38 35, 41 30 C 44 25, 48 29, 50 32 C 50 29, 54 25, 57 30 C 60 35, 56 38, 53 38 Q 50 42 50 44 Z M 50 44 L 50 48" strokeWidth="2.8" fill="none" />
                  <circle cx="50" cy="27" r="3.5" fill="currentColor" stroke="none" />
                  
                  {/* Cloche Dome */}
                  <path d="M 12 76 A 38 38 0 0 1 88 76 Z" strokeWidth="4" />
                  
                  {/* Inner Left Highlight Glint */}
                  <path d="M 20 70 A 30 30 0 0 1 36 49" strokeWidth="2.5" opacity="0.6" />
                  
                  {/* Platter / Tray Base */}
                  <rect x="5" y="76" width="90" height="5" rx="2.5" fill="currentColor" stroke="none" />
                  <path d="M 12 83 Q 50 86 88 83" strokeWidth="3" />
                  
                  {/* Inner Realistic QR Code */}
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
              </div>
              <span className="font-heading text-2xl font-bold text-white">QRestro</span>
            </Link>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed font-body">
              Automated dining and interactive menu systems for modern restaurants.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-2 md:col-start-7">
            <h3 className="font-heading text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-bold text-sm tracking-widest uppercase">Product</h3>
            <div className="w-8 h-[2px] bg-gradient-to-r from-[#B88A52] to-transparent mt-2 mb-5 rounded-full" />
            <ul className="space-y-3.5 text-sm font-body">
              <li>
                <a href="#features" className="group flex items-center gap-2 hover:translate-x-1.5 transition-all duration-300 ease-out text-gray-400 hover:text-white outline-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A52] scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out shadow-[0_0_6px_rgba(184,138,82,0.8)] shrink-0" />
                  <span>Features</span>
                </a>
              </li>
              <li>
                <Link href="/order/the-golden-plate/table-1" className="group flex items-center gap-2 hover:translate-x-1.5 transition-all duration-300 ease-out text-gray-400 hover:text-white outline-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A52] scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out shadow-[0_0_6px_rgba(184,138,82,0.8)] shrink-0" />
                  <span>Live Demo Menu</span>
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => setChangelogOpen(true)}
                  className="group flex items-center gap-2 hover:translate-x-1.5 transition-all duration-300 ease-out text-gray-400 hover:text-white cursor-pointer text-sm text-left focus:outline-none outline-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A52] scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out shadow-[0_0_6px_rgba(184,138,82,0.8)] shrink-0" />
                  <span>Changelog</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-heading text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-bold text-sm tracking-widest uppercase">Company</h3>
            <div className="w-8 h-[2px] bg-gradient-to-r from-[#B88A52] to-transparent mt-2 mb-5 rounded-full" />
            <ul className="space-y-3.5 text-sm font-body">
              <li>
                <button 
                  onClick={() => setAboutOpen(true)}
                  className="group flex items-center gap-2 hover:translate-x-1.5 transition-all duration-300 ease-out text-gray-400 hover:text-white cursor-pointer text-sm text-left focus:outline-none outline-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A52] scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out shadow-[0_0_6px_rgba(184,138,82,0.8)] shrink-0" />
                  <span>About Us</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setBlogOpen(true)}
                  className="group flex items-center gap-2 hover:translate-x-1.5 transition-all duration-300 ease-out text-gray-400 hover:text-white cursor-pointer text-sm text-left focus:outline-none outline-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A52] scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out shadow-[0_0_6px_rgba(184,138,82,0.8)] shrink-0" />
                  <span>Blog</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setContactOpen(true)}
                  className="group flex items-center gap-2 hover:translate-x-1.5 transition-all duration-300 ease-out text-gray-400 hover:text-white cursor-pointer text-sm text-left focus:outline-none outline-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A52] scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out shadow-[0_0_6px_rgba(184,138,82,0.8)] shrink-0" />
                  <span>Contact</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-heading text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-bold text-sm tracking-widest uppercase">Legal</h3>
            <div className="w-8 h-[2px] bg-gradient-to-r from-[#B88A52] to-transparent mt-2 mb-5 rounded-full" />
            <ul className="space-y-3.5 text-sm font-body">
              <li>
                <button 
                  onClick={() => setPrivacyOpen(true)}
                  className="group flex items-center gap-2 hover:translate-x-1.5 transition-all duration-300 ease-out text-gray-400 hover:text-white cursor-pointer text-sm text-left focus:outline-none outline-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A52] scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out shadow-[0_0_6px_rgba(184,138,82,0.8)] shrink-0" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setTermsOpen(true)}
                  className="group flex items-center gap-2 hover:translate-x-1.5 transition-all duration-300 ease-out text-gray-400 hover:text-white cursor-pointer text-sm text-left focus:outline-none outline-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A52] scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out shadow-[0_0_6px_rgba(184,138,82,0.8)] shrink-0" />
                  <span>Terms of Service</span>
                </button>
              </li>

            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-xs z-10 relative">
          <p>© {new Date().getFullYear()} QRestro. All rights reserved.</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 🔮 Interactive Modals in Futuristic Glass Mode                            */}
      {/* ========================================================================= */}

      {/* 1. About Us Modal */}
      {aboutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0 cursor-default" onClick={() => setAboutOpen(false)} />
          
          <div className="relative bg-[#0E0D10]/95 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto z-10 animate-scale-in">
            <button 
              onClick={() => setAboutOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-gold-400 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">About QRestro</h2>
              <p className="text-gold-400 text-sm md:text-base font-semibold tracking-wider uppercase">Empowering hospitality with modern science</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-10">
              <div className="space-y-4 text-gray-300 text-sm md:text-base leading-relaxed font-body">
                <p>QRestro is a unified dining ecosystem designed to automate operations, reduce table wait cycles, and delight guests with visual menus.</p>
                <p>We blend robust database architecture with stunning, interactive UI interfaces, turning your local dining tables into real-time hubs.</p>
              </div>
              <div className="relative rounded-[2rem] overflow-hidden shadow-lg border border-white/[0.08] aspect-[3/2] bg-[#17161A]">
                <img src="/about-restaurant.png" alt="QRestro Premium Restaurant Dining" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2rem] p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-left">
                <h3 className="font-heading text-xl md:text-2xl font-bold text-white mb-2">Our Mission</h3>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed font-body">To help restaurants deliver beautiful guest experiences, accelerate checkout flows, and maximize revenue with elegant technology.</p>
              </div>
              <div className="w-full sm:w-[180px] flex justify-center shrink-0">
                <img src="/about-mission.png" alt="QRestro Dining Mission" className="w-full max-w-[140px] h-auto object-contain opacity-90" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Changelog Modal */}
      {changelogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0 cursor-default" onClick={() => setChangelogOpen(false)} />
          
          <div className="relative bg-[#0E0D10]/95 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto z-10 animate-scale-in">
            <button 
              onClick={() => setChangelogOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-gold-400 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">Changelog</h2>
              <p className="text-gray-400 text-sm md:text-base font-semibold">Stay updated with our latest core innovations.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2rem] p-8 shadow-sm flex flex-col sm:flex-row items-center gap-8 mb-6 hover:bg-white/[0.04] transition-colors duration-300">
              <div className="shrink-0 flex justify-center">
                <svg className="w-24 h-24 text-gold-500" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="40" fill="#c8913a" fillOpacity="0.08" stroke="#c8913a" strokeWidth="1" strokeOpacity="0.15" />
                  <path d="M22 35 L25 38 M25 35 L22 38" stroke="#c8913a" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M75 28 L78 31 M78 28 L75 31" stroke="#c8913a" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M38 72 C35 70 30 72 32 75 C34 78 38 78 40 76 C42 78 46 78 48 76 Z" stroke="#8a7d6d" strokeWidth="1.5" fill="#17161A" />
                  <path d="M46 68 L50 76 L54 68 Z" fill="#c8913a" fillOpacity="0.3" stroke="#c8913a" strokeWidth="1.5" />
                  <path d="M50 20 C42 35 40 50 42 66 L58 66 C60 50 58 35 50 20 Z" fill="#1a1208" stroke="#8a7d6d" strokeWidth="2" />
                  <circle cx="50" cy="42" r="5" fill="#faf6f0" stroke="#8a7d6d" strokeWidth="2" />
                </svg>
              </div>

              <div className="flex-1 text-left w-full font-body">
                <span className="inline-block px-3 py-1 bg-gold-500/10 border border-gold-500/20 rounded-full text-gold-400 font-semibold text-xs tracking-wider uppercase mb-3">v1.0.0</span>
                <h3 className="font-heading text-2xl font-bold text-white mb-2">Initial Launch</h3>
                <div className="w-12 h-0.5 bg-gold-500/40 mb-4" />
                <ul className="space-y-3">
                  {['Interactive QR menu routing', 'Full cart operations', 'Owner live performance hub', 'Kitchen display queues'].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gold-500/15 flex items-center justify-center text-gold-400 shrink-0">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="text-gray-300 font-medium text-sm md:text-base">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2rem] p-8 text-center shadow-sm flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400 mb-2">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <h4 className="font-heading text-lg font-bold text-white">We are just getting started.</h4>
              <p className="text-gray-400 text-sm font-body">Stay tuned for future analytics modules and starlight designs.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Privacy Policy Modal */}
      {privacyOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0 cursor-default" onClick={() => setPrivacyOpen(false)} />
          
          <div className="relative bg-[#0E0D10]/95 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto z-10 animate-scale-in">
            <button 
              onClick={() => setPrivacyOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-gold-400 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h2>
              <div className="flex items-center justify-center gap-2 text-gold-400 mb-3">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold tracking-wider uppercase font-body">Last Updated: May 2026</span>
              </div>
              <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto font-body">QRestro is committed to protecting your privacy. This policy explains how we collect, use, store, and protect your information when you use our platform.</p>
            </div>

            <div className="space-y-4 font-body">
              {[
                {
                  icon: <User className="w-5 h-5" />,
                  title: '1. Information We Collect',
                  desc: 'We collect the following categories of information: (a) Account Information — name, email address, and password when you register; (b) Restaurant Data — menu items, pricing, table configurations, and business name provided by restaurant owners; (c) Order Data — items ordered, table number, order timestamps, and order status; (d) Usage Data — pages visited, features used, browser type, IP address, and device information; (e) Communication Data — messages sent via our Contact form or support channels.'
                },
                {
                  icon: <ClipboardList className="w-5 h-5" />,
                  title: '2. How We Use Your Information',
                  desc: 'Your information is used to: provide and operate the QRestro platform; authenticate and manage user accounts; process and display orders in real-time on the kitchen display; send transactional emails (order confirmations, account updates); improve platform performance and fix bugs; respond to support requests and inquiries; comply with legal obligations; and prevent fraud or abuse of the platform.'
                },
                {
                  icon: <Lock className="w-5 h-5" />,
                  title: '3. Data Segregation & Security',
                  desc: 'Each restaurant account is isolated in its own secure data environment — no data mixing or cross-access between restaurants. We use industry-standard encryption (TLS/SSL) for all data in transit and AES-256 encryption for sensitive data at rest. Access to backend systems is restricted to authorized personnel only, and all access is logged and audited.'
                },
                {
                  icon: <FileText className="w-5 h-5" />,
                  title: '4. Cookies & Tracking Technologies',
                  desc: 'We use cookies and similar technologies to: maintain your login session; remember your preferences; analyze how the platform is used (via anonymized analytics). We use only essential and functional cookies. We do not use cookies for advertising or sell cookie data to third parties. You can control cookies via your browser settings, though disabling them may affect platform functionality.'
                },
                {
                  icon: <Store className="w-5 h-5" />,
                  title: '5. Data Sharing & Third Parties',
                  desc: 'We do not sell, rent, or trade your personal information. We may share data with: (a) Service Providers — trusted vendors who assist in operating our infrastructure (e.g., Supabase for database hosting, email delivery services) under strict confidentiality agreements; (b) Legal Authorities — when required by law, court order, or to protect rights and safety; (c) Business Transfers — in the event of a merger or acquisition, your data may be transferred as part of that transaction, with prior notice given.'
                },
                {
                  icon: <Star className="w-5 h-5" />,
                  title: '6. Data Retention',
                  desc: 'We retain your personal data only as long as necessary: Active account data is kept for the duration of your account. Order history is retained for up to 2 years for analytics and dispute resolution. If you delete your account, your personal data is permanently purged within 30 days, except where retention is required by law (e.g., financial records for 7 years).'
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: '7. Your Rights',
                  desc: 'Depending on your location, you may have the following rights: Right to Access — request a copy of the data we hold about you. Right to Correction — update inaccurate personal information. Right to Deletion — request deletion of your account and associated data. Right to Portability — receive your data in a machine-readable format. Right to Withdraw Consent — opt out of non-essential data processing at any time. To exercise any of these rights, contact us at supportqrestro@gmail.com.'
                },
                {
                  icon: <TrendingUp className="w-5 h-5" />,
                  title: '8. Children\'s Privacy',
                  desc: 'QRestro is not directed at children under the age of 13. We do not knowingly collect personal information from children. If we discover that a child under 13 has provided us with personal information, we will delete it immediately. If you believe a child has submitted data to us, please contact us at supportqrestro@gmail.com.'
                },
                {
                  icon: <Bell className="w-5 h-5" />,
                  title: '9. Changes to This Policy',
                  desc: 'We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date at the top of this page. For significant changes, we will notify registered restaurant owners via email. Continued use of QRestro after changes constitutes acceptance of the updated policy.'
                },
                {
                  icon: <Mail className="w-5 h-5" />,
                  title: '10. Contact Us',
                  desc: 'For any privacy-related questions, requests, or concerns, please contact our Privacy Officer at: Email: supportqrestro@gmail.com. We aim to respond to all inquiries within 5 business days.'
                },
              ].map((card, i) => (
                <div key={i} className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] rounded-[1.8rem] p-6 shadow-sm flex items-start gap-5 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gold-400 shrink-0">
                    {card.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="font-heading text-lg font-bold text-white mb-2">{card.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Terms of Service Modal */}
      {termsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0 cursor-default" onClick={() => setTermsOpen(false)} />
          
          <div className="relative bg-[#0E0D10]/95 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto z-10 animate-scale-in">
            <button 
              onClick={() => setTermsOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-gold-400 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">Terms of Service</h2>
              <div className="flex items-center justify-center gap-2 text-gold-400 mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold tracking-wider uppercase font-body">Last Updated: May 2026</span>
              </div>
              <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto font-body">Please read these Terms carefully before using QRestro. By accessing or using our platform, you agree to be bound by these Terms.</p>
            </div>

            <div className="space-y-4 text-left font-body">
              {[
                {
                  icon: <FileText className="w-5 h-5" />,
                  title: '1. Acceptance of Terms',
                  desc: 'By creating an account, scanning a QR code, or otherwise accessing QRestro, you confirm that you have read, understood, and agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the platform. These Terms apply to all users — restaurant owners, kitchen staff, and dining guests.'
                },
                {
                  icon: <User className="w-5 h-5" />,
                  title: '2. Eligibility',
                  desc: 'You must be at least 18 years of age to create a restaurant owner account on QRestro. By registering, you represent and warrant that you are 18 or older and have the legal authority to enter into binding agreements on behalf of yourself or your restaurant business. Guest diners (those using the QR ordering system) have no age restriction.'
                },
                {
                  icon: <Store className="w-5 h-5" />,
                  title: '3. Account Registration & Security',
                  desc: 'You are responsible for maintaining the confidentiality of your account credentials (email and password). You must not share your login with unauthorized individuals. You agree to notify us immediately at supportqrestro@gmail.com if you suspect unauthorized access to your account. QRestro is not liable for losses resulting from unauthorized access due to your failure to protect your credentials.'
                },
                {
                  icon: <ClipboardList className="w-5 h-5" />,
                  title: '4. Restaurant Owner Obligations',
                  desc: 'Restaurant owners agree to: (a) provide accurate and up-to-date menu information including item names, descriptions, prices, and availability; (b) fulfill all orders placed through the platform in a timely manner; (c) maintain accurate table configurations and QR code assignments; (d) not use the platform to offer illegal, unsafe, or restricted food items; (e) comply with all applicable local food safety, hygiene, and business licensing regulations.'
                },
                {
                  icon: <TrendingUp className="w-5 h-5" />,
                  title: '5. Payments, Pricing & Refunds',
                  desc: 'QRestro itself does not process payments between diners and restaurants — all payment settlements are handled directly between the restaurant and the customer. Restaurant owners are solely responsible for setting accurate prices. Any disputes regarding overcharging, incorrect bills, or refunds must be resolved directly between the restaurant and the customer. QRestro is not a party to any payment transaction.'
                },
                {
                  icon: <Lock className="w-5 h-5" />,
                  title: '6. Prohibited Use',
                  desc: 'You agree not to: (a) use the platform for any unlawful purpose or in violation of any regulations; (b) attempt to gain unauthorized access to other accounts, servers, or systems; (c) scrape, copy, or reproduce platform content without written permission; (d) upload malicious code, viruses, or harmful content; (e) impersonate any person or entity; (f) use automated bots to interact with the platform; (g) interfere with the proper functioning of the service for other users.'
                },
                {
                  icon: <Star className="w-5 h-5" />,
                  title: '7. Intellectual Property',
                  desc: 'All content, branding, design, code, and features of QRestro — including the logo, UI design, and software — are the exclusive intellectual property of QRestro and its developers. You are granted a limited, non-exclusive, non-transferable license to use the platform for its intended purpose. You may not copy, modify, distribute, sell, or create derivative works without explicit written consent from QRestro.'
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: '8. Limitation of Liability',
                  desc: 'QRestro is provided "as is" without warranties of any kind. To the maximum extent permitted by law, QRestro and its team shall not be liable for: loss of revenue or profits; data loss or corruption; service interruptions or downtime; errors in menu data or orders caused by restaurant owners; or any indirect, incidental, or consequential damages. Our total liability to you shall not exceed the amount you paid us in the 3 months preceding the claim.'
                },
                {
                  icon: <Bell className="w-5 h-5" />,
                  title: '9. Termination',
                  desc: 'We reserve the right to suspend or terminate your account at any time if you violate these Terms, engage in fraudulent activity, or cause harm to other users or the platform. You may also delete your account at any time from the Settings page. Upon termination, your right to use the platform ceases immediately, and your data will be handled per our Privacy Policy.'
                },
                {
                  icon: <Mail className="w-5 h-5" />,
                  title: '10. Governing Law & Disputes',
                  desc: 'These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of QRestro shall first be attempted to be resolved amicably. If unresolved within 30 days, disputes shall be submitted to binding arbitration under the Arbitration and Conciliation Act, 1996. For questions about these Terms, contact us at supportqrestro@gmail.com.'
                },
              ].map((card, i) => (
                <div key={i} className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] rounded-[1.8rem] p-6 shadow-sm flex items-start gap-5 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gold-400 shrink-0">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white mb-1">{card.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Blog Modal */}
      {blogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0 cursor-default" onClick={() => setBlogOpen(false)} />
          
          <div className="relative bg-[#0E0D10]/95 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto z-10 animate-scale-in text-center flex flex-col items-center">
            <button 
              onClick={() => setBlogOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-gold-400 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="px-4 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-full inline-flex items-center gap-2 text-gold-400 font-bold text-xs tracking-wider uppercase mb-4">
              <FileText className="w-3.5 h-3.5" />
              Blog
            </div>

            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-2">Coming Soon!</h2>
            <div className="flex items-center justify-center gap-1.5 my-4">
              <div className="w-10 h-1 bg-gold-500 rounded-full" />
              <div className="w-2.5 h-2.5 bg-gold-500 rounded-full" />
              <div className="w-16 h-1 bg-white/20 rounded-full" />
            </div>

            <p className="text-gray-300 text-base md:text-lg max-w-md mx-auto leading-relaxed mb-6 font-body">We are building guides on streamlining kitchen prep steps, mess metrics, and automated ordering.</p>
            <div className="relative w-full max-w-md aspect-square rounded-[2rem] overflow-hidden border border-white/[0.08] shadow-md bg-white/[0.02] p-2">
              <img src="/blog-coming-soon.png" alt="Blog Coming Soon Illustration" className="w-full h-full object-cover rounded-[1.8rem] opacity-90" />
            </div>
            <p className="mt-6 text-white font-bold text-base tracking-wide font-heading">Stay tuned!</p>
          </div>
        </div>
      )}

      {/* 6. Contact Us Modal */}
      {contactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0 cursor-default" onClick={() => setContactOpen(false)} />
          
          <div className="relative bg-[#0E0D10]/95 border border-white/[0.08] rounded-[2.5rem] p-6 md:p-10 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto z-10 animate-scale-in flex flex-col items-center">
            <button 
              onClick={() => setContactOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-gold-400 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="px-4 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-full inline-flex items-center gap-2 text-gold-400 font-bold text-xs tracking-wider uppercase mb-3">Contact Us</div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2 text-center">We would Love to Hear From You</h2>
            <p className="text-gray-400 text-sm md:text-base text-center max-w-xl mx-auto leading-relaxed mb-8 font-body">Have suggestions, Mess integration query or custom restaurant feature request? Drop us a line.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full relative">
              {/* Form Column */}
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-[2rem] p-6 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-xl font-bold text-white mb-1">Get in Touch</h3>
                  <p className="text-gray-400 text-xs mb-5 font-body">Fill out the form and our crew will get back to you rapidly.</p>

                  {submitSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 text-xs font-semibold mb-4 text-center font-body animate-fade-in">
                      ✨ Message routed cleanly to the support crew! We will contact you soon.
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input 
                          type="text" name="name" required disabled={isSubmitting} placeholder="Your Name" 
                          className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm w-full outline-none focus:border-gold-500 font-body transition-colors text-white disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <input 
                          type="email" name="email" required disabled={isSubmitting} placeholder="Email Address" 
                          className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm w-full outline-none focus:border-gold-500 font-body transition-colors text-white disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div>
                      <input 
                        type="text" name="subject" required disabled={isSubmitting} placeholder="Subject" 
                        className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm w-full outline-none focus:border-gold-500 font-body transition-colors text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <textarea 
                        name="message" required disabled={isSubmitting} placeholder="Your Message" rows={4}
                        className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm w-full outline-none focus:border-gold-500 font-body transition-colors text-white resize-none disabled:opacity-50"
                      />
                    </div>

                    <button 
                      type="submit" disabled={isSubmitting}
                      className="bg-gradient-to-r from-[#B88A52] to-[#a67520] hover:from-[#c59a5c] hover:to-[#b8852c] text-white font-bold py-2.5 px-6 rounded-xl w-full flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-sm font-heading active:scale-[0.98] disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Info Column */}
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-[2rem] p-6 text-left flex flex-col justify-start">
                <h3 className="font-heading text-xl font-bold text-white mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gold-400 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-white text-sm mb-0.5">Email Us</h4>
                      <a href="mailto:supportqrestro@gmail.com" className="text-gold-400 hover:text-gold-300 font-bold text-sm font-body transition-colors">supportqrestro@gmail.com</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gold-400 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-white text-sm mb-0.5">Call Us</h4>
                      <a href="tel:+918252373767" className="text-gold-400 hover:text-gold-300 font-bold text-sm font-body transition-colors">+91 82523 73767</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-6 text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gold-400 shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="font-body">
                  <h4 className="font-heading text-lg font-bold text-white">Join QRestro</h4>
                  <p className="text-gray-400 text-xs">Unlock next-generation visual menus for your local dining spot today.</p>
                </div>
              </div>
              <Link 
                href="/auth/signup" onClick={() => setContactOpen(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-gold-500/10 to-gold-600/10 hover:bg-gold-500/20 border border-gold-500/40 text-gold-400 font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-[0.98] text-center"
              >
                Join QRestro
              </Link>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
