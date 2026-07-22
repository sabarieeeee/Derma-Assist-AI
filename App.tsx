import React, { useState, useEffect, useRef } from 'react';
import { analyzeSkinImage } from './geminiService';
import { TimelineEntry, SkinAnalysis } from './types';
import ProgressionCompare from './ProgressionCompare';
import AnalysisView from './AnalysisView';
import SplashScreen from './SplashScreen';
import AuroraCanvas from './AuroraCanvas';
import LoginModal from './LoginModal';
import PricingModal from './PricingModal';
import SkinChatModal from './SkinChatModal';
import UserProfileModal from './UserProfileModal';
import Logo from './Logo';

declare const Lenis: any;
declare const gsap: any;
declare const ScrollTrigger: any;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'preview' | 'analyzing' | 'result' | 'history' | 'compare' | 'pricing' | 'busy'>('home');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  
  // Modals & User States
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Daily Scan Quota Logic (15 Scans / Day)
  const [scanCount, setScanCount] = useState<number>(0);
  const [quotaLimit] = useState<number>(15);

  const [showIntro, setShowIntro] = useState(true);
  const [introFade, setIntroFade] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const ethBarsRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  // Splash Screen timer
  useEffect(() => {
    const timer1 = setTimeout(() => setIntroFade(true), 2000); 
    const timer2 = setTimeout(() => setShowIntro(false), 2600); 
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  // Initialize Lenis, GSAP, ETH Bars, Floating Cards
  useEffect(() => {
    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
      }
    }

    if (ethBarsRef.current && ethBarsRef.current.children.length === 0) {
      const heights = [30, 55, 40, 70, 45, 85, 60, 95, 50, 75, 65, 90, 42, 68];
      heights.forEach((h, i) => {
        const b = document.createElement('div');
        b.style.width = '4px';
        b.style.borderRadius = '2px';
        b.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)';
        b.style.height = h + '%';
        ethBarsRef.current?.appendChild(b);
        b.animate(
          [{ height: h + '%' }, { height: Math.min(100, h + 14) + '%' }, { height: h + '%' }],
          { duration: 1800 + i * 140, iterations: Infinity, easing: 'ease-in-out', delay: i * 120 }
        );
      });
    }

    document.querySelectorAll('[data-float]').forEach(function(el) {
      const i = parseInt(el.getAttribute('data-float') || '1', 10);
      el.animate(
        [{ transform: 'translateY(0px)' }, { transform: 'translateY(-' + (6 + (i % 3) * 3) + 'px)' }, { transform: 'translateY(0px)' }],
        { duration: 4200 + i * 600, iterations: Infinity, easing: 'ease-in-out', delay: i * 350 }
      );
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      const mainEl = document.querySelector('main');

      gsap.to('#glCanvas', {
        yPercent: 22, ease: 'none',
        scrollTrigger: { trigger: mainEl, start: 'top top', end: 'bottom top', scrub: 0.6 }
      });

      gsap.fromTo('header', { opacity: 0, y: -18, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', delay: 0.15 });

      document.querySelectorAll('[data-fade]').forEach(function(el) {
        gsap.fromTo(el, { opacity: 0, y: 30, filter: 'blur(7px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });

      document.querySelectorAll('[data-stagger]').forEach(function(group) {
        gsap.fromTo(group.children, { opacity: 0, y: 34, scale: 0.94, filter: 'blur(9px)' },
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out', stagger: 0.09,
            scrollTrigger: { trigger: group, start: 'top 88%', once: true } });
      });
    }
  }, [currentScreen]);

  // Load user, history & quota
  useEffect(() => {
    const savedUser = localStorage.getItem('derm_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.isLoggedIn) {
          setIsLoggedIn(true);
          setUserEmail(parsed.email);
          setUserName(parsed.name || parsed.email.split('@')[0]);
        }
      } catch (e) {}
    }

    const storedProfile = localStorage.getItem('derm_patient_profile');
    if (storedProfile) {
      try {
        const parsedProf = JSON.parse(storedProfile);
        if (parsedProf.name) setUserName(parsedProf.name);
      } catch (e) {}
    }

    const saved = localStorage.getItem('derm_history');
    if (saved) try { setEntries(JSON.parse(saved)); } catch (e) {}

    const today = new Date().toDateString();
    const storedQuota = localStorage.getItem('derm_scan_quota');
    if (storedQuota) {
      try {
        const parsed = JSON.parse(storedQuota);
        if (parsed.date === today) {
          setScanCount(parsed.count || 0);
        } else {
          localStorage.setItem('derm_scan_quota', JSON.stringify({ date: today, count: 0 }));
          setScanCount(0);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('derm_history', JSON.stringify(entries));
    } catch (e) {}
  }, [entries]);

  const updateScanQuota = () => {
    const today = new Date().toDateString();
    const newCount = scanCount + 1;
    setScanCount(newCount);
    localStorage.setItem('derm_scan_quota', JSON.stringify({ date: today, count: newCount }));
  };

  const checkQuotaAndOpenUpload = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const sub = localStorage.getItem('derm_subscription');
    let isUnlimited = false;
    if (sub) {
      try { isUnlimited = JSON.parse(sub).isUnlimited; } catch (e) {}
    }

    if (!isUnlimited && scanCount >= quotaLimit) {
      navigateTo('pricing');
    } else {
      setShowUploadSheet(true);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    if (currentScreen !== 'home') {
      setCurrentScreen('home');
      setTimeout(() => {
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } else {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigateTo = (s: typeof currentScreen) => {
    setCurrentScreen(s);
    scrollToTop();
  };

  const handleLogout = () => {
    localStorage.removeItem('derm_user');
    setIsLoggedIn(false);
    setUserEmail('');
    setUserName('');
  };

  const deleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEntries(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = () => {
    if (confirm("Are you sure you want to clear all scan history?")) {
      setEntries([]);
      localStorage.removeItem('derm_history');
    }
  };

  const compressImageForUI = (base64Str: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (re) => {
        const result = re.target?.result;
        if (typeof result === 'string') {
          const compressed = await compressImageForUI(result);
          setSelectedImage(compressed);
          setShowUploadSheet(false);
          setCurrentScreen('preview');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!selectedImage) {
      alert("Please select a valid image before running analysis.");
      navigateTo('home');
      return;
    }

    const sub = localStorage.getItem('derm_subscription');
    let isUnlimited = false;
    if (sub) {
      try { isUnlimited = JSON.parse(sub).isUnlimited; } catch (e) {}
    }

    if (!isUnlimited && scanCount >= quotaLimit) {
      navigateTo('pricing');
      return;
    }
    
    navigateTo('analyzing');
    setAnalysis(null); 

    try {
      const result = await analyzeSkinImage(selectedImage);
      if (!result || !result.diseaseName) {
        throw new Error("Groq Vision API returned incomplete analysis.");
      }

      setAnalysis(result);
      updateScanQuota();

      const newEntry: TimelineEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        imageData: selectedImage, 
        label: result.diseaseName || 'Skin Analysis',
        analysis: result
      };
      
      setEntries(prev => [...prev, newEntry]);
      setTimeout(() => navigateTo('result'), 1600);

    } catch (err: any) {
      console.error(err);
      alert(`Skin telemetry error: ${err?.message || "Could not analyze skin pattern with AI. Please check your Groq API key."}`);
      navigateTo('home');
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-10 min-h-screen">
      
      {/* Intro Splash Screen Overlay */}
      {showIntro && <SplashScreen fadeOut={introFade} />}

      {/* DERMA ASSIST AI MAIN CANVAS */}
      <main 
        className={`relative w-full rounded-[28px] overflow-hidden flex flex-col justify-between transition-all duration-300 ${
          currentScreen === 'home' ? 'min-h-screen' : 'min-h-[70vh]'
        }`} 
        style={{ background: 'linear-gradient(160deg,#0a2a12 0%,#0d3617 45%,#0a2a12 100%)', boxShadow: '0 40px 80px -20px rgba(10,42,18,0.45)' }}
      >
        
        <div>
          {/* Radiant Aurora backdrop */}
          <AuroraCanvas />

          {/* Diagonal hatch overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(115deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 56px)' }} aria-hidden="true"></div>

          {/* NAV */}
          <header className="relative z-10 flex items-center justify-between gap-4 px-5 sm:px-8 lg:px-12 pt-6 lg:pt-7">
            <div onClick={() => navigateTo('home')} className="flex items-center gap-2.5 group cursor-pointer" aria-label="Derma Assist AI home">
              <Logo size={28} />
              <span className="text-white font-medium text-sm sm:text-base font-geist tracking-tight">
                Derma Assist AI
              </span>
            </div>

            {/* Nav Buttons (Ungrouped Pills) */}
            <nav className="hidden md:flex items-center gap-2" aria-label="Primary">
              <button 
                onClick={() => navigateTo('home')} 
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium font-geist transition-all duration-150 hover:scale-[1.04] ${
                  currentScreen === 'home' ? 'bg-white text-[#0d3617]' : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
                style={currentScreen !== 'home' ? { border: '1px solid rgba(255,255,255,0.18)' } : {}}
              >
                <iconify-icon icon="solar:home-2-linear" width="14" style={{ strokeWidth: 1.5 }}></iconify-icon>
                Home
              </button>

              <button 
                onClick={() => navigateTo('compare')} 
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium font-geist transition-all duration-150 hover:scale-[1.04] ${
                  currentScreen === 'compare' ? 'bg-white text-[#0d3617]' : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
                style={currentScreen !== 'compare' ? { border: '1px solid rgba(255,255,255,0.18)' } : {}}
              >
                <iconify-icon icon="solar:notebook-linear" width="14" style={{ strokeWidth: 1.5 }}></iconify-icon>
                Progression
              </button>

              <button 
                onClick={() => navigateTo('history')} 
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium font-geist transition-all duration-150 hover:scale-[1.04] ${
                  currentScreen === 'history' ? 'bg-white text-[#0d3617]' : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
                style={currentScreen !== 'history' ? { border: '1px solid rgba(255,255,255,0.18)' } : {}}
              >
                <iconify-icon icon="solar:book-bookmark-linear" width="14" style={{ strokeWidth: 1.5 }}></iconify-icon>
                History ({entries.length})
              </button>

              {/* AI Assistant Nav Item */}
              <button 
                onClick={() => setShowChatModal(true)} 
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors duration-150 font-geist" 
                style={{ border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <iconify-icon icon="solar:chat-round-line-linear" width="14" style={{ strokeWidth: 1.5 }}></iconify-icon>
                AI Assistant
              </button>

              {/* Subscription Nav Tab */}
              <button 
                onClick={() => navigateTo('pricing')} 
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium font-geist transition-all duration-150 hover:scale-[1.04] ${
                  currentScreen === 'pricing' ? 'bg-white text-[#0d3617]' : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
                style={currentScreen !== 'pricing' ? { border: '1px solid rgba(255,255,255,0.18)' } : {}}
              >
                <iconify-icon icon="solar:chart-2-linear" width="14" style={{ strokeWidth: 1.5 }}></iconify-icon>
                Subscription
              </button>

              <a 
                href="#about" 
                onClick={() => navigateTo('home')}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors duration-150 font-geist" 
                style={{ border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <iconify-icon icon="solar:info-circle-linear" width="14" style={{ strokeWidth: 1.5 }}></iconify-icon>
                About
              </a>
            </nav>

            {/* Top Right Header Button */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium font-geist text-white bg-white/10 hover:bg-white/20 transition-all border border-white/18 shadow-sm"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#c8f542]" />
                    <span>{userName || userEmail.split('@')[0]}</span>
                    <iconify-icon icon="solar:user-bold" width="12" style={{ color: '#c8f542' }}></iconify-icon>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="px-3 py-2 text-xs text-white/50 hover:text-white font-geist transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)} 
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-[#12300f] hover:brightness-105 transition-all duration-150 hover:scale-[1.04] font-geist" 
                  style={{ backgroundColor: '#c8f542' }}
                >
                  <iconify-icon icon="solar:user-bold" width="14" style={{ strokeWidth: 1.5 }}></iconify-icon>
                  Sign In / Account
                </button>
              )}
            </div>
          </header>

          {/* MAIN BODY VIEWS */}
          {currentScreen === 'home' && (
            <div>
              {/* HERO */}
              <section id="hero" className="relative z-10 grid lg:grid-cols-2 gap-10 items-center px-5 sm:px-8 lg:px-12 pt-12 lg:pt-16 pb-8 min-h-[80vh]">
                <div className="max-w-xl">
                  {/* How It Works Button Smooth Scrolls */}
                  <span 
                    onClick={scrollToHowItWorks}
                    className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/90 mb-7 font-geist transition-colors duration-150 hover:bg-[rgba(200,245,66,0.12)] cursor-pointer" 
                    style={{ border: '1px solid rgba(200,245,66,0.35)', background: 'rgba(200,245,66,0.06)' }}
                  >
                    <iconify-icon icon="solar:play-circle-linear" width="15" style={{ strokeWidth: 1.5, color: '#c8f542' }}></iconify-icon>
                    How it works
                  </span>
                  
                  <h1 className="text-white text-4xl sm:text-5xl lg:text-[3.4rem] font-geist tracking-tighter" style={{ lineHeight: 1.12 }} data-reveal-words="">
                    Your Trusted Compass for
                    <span style={{ color: '#c8f542' }}> AI Skin Health</span>
                  </h1>
                  <p className="mt-6 text-sm text-white/60 leading-relaxed max-w-md font-geist" data-fade="">
                    Track skin health patterns, learn key indicators and monitor recovery progress with confidence — one clean dashboard built for patients and pros alike.
                  </p>
                  
                  {/* Hero Only "Scan Now" Button */}
                  <div className="mt-8">
                    <button 
                      onClick={checkQuotaAndOpenUpload} 
                      data-fade="" 
                      className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-[#12300f] hover:brightness-105 transition-all duration-150 hover:scale-[1.03] active:scale-[0.98] font-geist" 
                      style={{ backgroundColor: '#c8f542', boxShadow: '0 8px 24px -6px rgba(200,245,66,0.4)' }}
                    >
                      <span className="inline-flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: 'rgba(18,48,15,0.15)' }}>
                        <iconify-icon icon="solar:arrow-right-up-linear" width="12" style={{ strokeWidth: 1.5 }}></iconify-icon>
                      </span>
                      Scan Now
                    </button>
                  </div>
                </div>

                {/* Right Floating Cards */}
                <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 lg:block lg:h-[440px]">
                  
                  {/* Card 1: Daily Quota Interactive Slider */}
                  <div data-float="1" className="rounded-2xl p-4 lg:absolute lg:-top-3 lg:left-2 lg:w-60 liquid-glass-card transition-transform duration-300 hover:!scale-[1.03]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/75 font-geist">Daily Scans</span>
                      <span className="text-white font-medium font-geist">{scanCount} / {quotaLimit}</span>
                    </div>
                    <div className="mt-3 relative h-1.5 rounded-full overflow-visible" style={{ background: 'rgba(255,255,255,0.15)' }} role="slider">
                      <div id="sliderFill" className="absolute left-0 top-0 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (scanCount / quotaLimit) * 100))}%`, backgroundColor: '#c8f542' }}></div>
                      <div id="sliderKnob" className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-500" style={{ left: `${Math.min(100, Math.max(0, (scanCount / quotaLimit) * 100))}%`, width: 14, height: 14, background: '#fff', border: '3px solid #c8f542', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', marginLeft: -7 }}></div>
                    </div>
                    <p className="mt-2 text-[10px] text-[#c8f542] text-right font-geist font-medium">15 Free Scans Active</p>
                  </div>

                  {/* Card 2: Telemetry Stats */}
                  <div data-float="2" className="rounded-2xl p-3.5 lg:absolute lg:top-24 lg:left-16 lg:w-72 liquid-glass-card transition-transform duration-300 hover:!scale-[1.03]">
                    <div className="flex items-center justify-between rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: 'rgba(200,245,66,0.15)' }}>
                          <iconify-icon icon="solar:arrow-right-up-linear" width="14" style={{ strokeWidth: 1.5, color: '#c8f542' }}></iconify-icon>
                        </span>
                        <div>
                          <p className="text-xs font-medium text-white font-geist">Scan Telemetry:</p>
                          <p className="text-xs text-white/50 font-geist">Micro-Pores Active</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-white font-geist">480 Points</p>
                        <p className="text-xs text-white/50 font-geist">98.4% Accuracy</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: 'rgba(200,245,66,0.15)' }}>
                          <iconify-icon icon="solar:arrow-left-down-linear" width="14" style={{ strokeWidth: 1.5, color: '#c8f542' }}></iconify-icon>
                        </span>
                        <div>
                          <p className="text-xs font-medium text-white font-geist">AI Benchmark:</p>
                          <p className="text-xs text-white/50 font-geist">Pattern Verified</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-white font-geist">Groq Vision</p>
                        <p className="text-xs text-white/50 font-geist">v3.6 Model</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Connected Status */}
                  <div data-float="3" className="rounded-2xl p-5 text-center lg:absolute lg:-top-8 lg:right-0 lg:w-40 liquid-glass-card transition-transform duration-300 hover:!scale-[1.03]">
                    <div className="mx-auto flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: 'rgba(200,245,66,0.15)' }}>
                      <iconify-icon icon="solar:check-circle-linear" width="18" style={{ strokeWidth: 1.5, color: '#c8f542' }}></iconify-icon>
                    </div>
                    <p className="mt-2.5 text-xs font-medium text-white font-geist">Connected</p>
                    <p className="text-xs text-white/50 font-geist">Groq Engine</p>
                  </div>

                  {/* Card 4: Spectrum Height Bars */}
                  <div data-float="4" className="rounded-2xl p-4 lg:absolute lg:top-40 lg:right-2 lg:w-44 liquid-glass-card transition-transform duration-300 hover:!scale-[1.03]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.12)' }}>
                        <iconify-icon icon="solar:bolt-linear" width="14" style={{ strokeWidth: 1.5, color: '#ffffff' }}></iconify-icon>
                      </span>
                      <div>
                        <p className="text-xs font-medium text-white font-geist">Spectrum</p>
                        <p className="text-xs text-white/50 font-geist">Recovery Rate</p>
                      </div>
                    </div>
                    <div ref={ethBarsRef} className="mt-3 flex items-end gap-1 h-12" aria-hidden="true"></div>
                    <p className="mt-3 text-xs font-medium text-white font-geist">1,842.10 SCORE</p>
                  </div>

                  {/* Card 5: Star Rating */}
                  <div data-float="5" className="rounded-2xl px-5 py-3.5 lg:absolute lg:bottom-16 lg:left-0 lg:w-48 liquid-glass-card transition-transform duration-300 hover:!scale-[1.03]">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        <iconify-icon icon="solar:star-bold" width="12" style={{ color: '#c8f542' }}></iconify-icon>
                        <iconify-icon icon="solar:star-bold" width="12" style={{ color: '#c8f542' }}></iconify-icon>
                        <iconify-icon icon="solar:star-bold" width="12" style={{ color: '#c8f542' }}></iconify-icon>
                        <iconify-icon icon="solar:star-bold" width="12" style={{ color: '#c8f542' }}></iconify-icon>
                        <iconify-icon icon="solar:star-bold" width="12" style={{ color: '#c8f542' }}></iconify-icon>
                      </div>
                      <span className="text-xs font-medium text-white font-geist">4.9</span>
                    </div>
                    <p className="mt-1 text-xs text-white/50 font-geist">&gt; 24,000 reviews</p>
                  </div>

                  {/* Card 6: Health Pass Card */}
                  <div data-float="6" className="rounded-2xl p-4 lg:absolute lg:bottom-8 lg:left-56 lg:w-52 liquid-glass-card transition-transform duration-300 hover:!scale-[1.03]">
                    <span className="inline-flex items-center justify-center rounded-lg" style={{ width: 32, height: 24, background: 'rgba(255,255,255,0.15)' }}>
                      <iconify-icon icon="solar:card-linear" width="15" style={{ strokeWidth: 1.5, color: '#ffffff' }}></iconify-icon>
                    </span>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-xs font-medium text-white font-geist">Derma Pass</p>
                        <p className="text-xs text-white/50 font-geist">7231 ••••</p>
                      </div>
                      <p className="text-xs text-white/50 font-geist">09/28</p>
                    </div>
                  </div>

                </div>
              </section>

              {/* HEALTH LOGOS STRIP */}
              <div className="relative z-10 px-5 sm:px-8 lg:px-12 pb-10 pt-2">
                <ul className="flex items-center justify-center gap-8 sm:gap-12 lg:gap-16 flex-wrap font-geist text-xs uppercase tracking-widest text-white/40">
                  <li className="flex items-center gap-2">
                    <iconify-icon icon="solar:health-bold" width="24" style={{ color: 'rgba(200,245,66,0.6)' }}></iconify-icon>
                    <span>Health Telemetry</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <iconify-icon icon="solar:dna-bold" width="24" style={{ color: 'rgba(255,255,255,0.35)' }}></iconify-icon>
                    <span>Genomic Micro-Pores</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <iconify-icon icon="solar:medical-kit-bold" width="24" style={{ color: 'rgba(255,255,255,0.35)' }}></iconify-icon>
                    <span>Clinical Vision</span>
                  </li>
                  <li className="hidden sm:flex items-center gap-2">
                    <iconify-icon icon="solar:heart-pulse-bold" width="24" style={{ color: 'rgba(255,255,255,0.35)' }}></iconify-icon>
                    <span>Recovery Rates</span>
                  </li>
                  <li className="hidden md:flex items-center gap-2">
                    <iconify-icon icon="solar:stethoscope-bold" width="24" style={{ color: 'rgba(255,255,255,0.35)' }}></iconify-icon>
                    <span>Care Protocol</span>
                  </li>
                </ul>
              </div>

              {/* FEATURES */}
              <section id="features" className="relative z-10 px-5 sm:px-8 lg:px-12 py-16 lg:py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/90 mb-6 font-geist" style={{ border: '1px solid rgba(200,245,66,0.35)', background: 'rgba(200,245,66,0.06)' }}>
                    <iconify-icon icon="solar:compass-linear" width="15" style={{ strokeWidth: 1.5, color: '#c8f542' }}></iconify-icon>
                    Why Derma Assist AI
                  </span>
                  <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-geist tracking-tighter" style={{ lineHeight: 1.15 }} data-reveal-words="">
                    Everything you need to
                    <span style={{ color: '#c8f542' }}> navigate skin health</span>
                    with clarity
                  </h2>
                  <p className="mt-5 text-sm text-white/60 leading-relaxed max-w-md font-geist" data-fade="">
                    Clear visual guidance tools that turn a complex condition into a readable recovery map.
                  </p>
                </div>

                <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-stagger="">
                  <div className="rounded-2xl p-6 liquid-glass-card transition-all duration-300 hover:-translate-y-1.5 group">
                    <span className="flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ width: 40, height: 40, background: 'rgba(200,245,66,0.15)' }}>
                      <iconify-icon icon="solar:chart-2-linear" width="20" style={{ strokeWidth: 1.5, color: '#c8f542' }}></iconify-icon>
                    </span>
                    <h3 className="mt-5 text-base font-medium text-white font-geist tracking-tight">Live pattern intelligence</h3>
                    <p className="mt-2 text-sm text-white/55 leading-relaxed font-geist">Real-time texture benchmarks and pore signals — so you understand changes before they escalate.</p>
                  </div>

                  <div className="rounded-2xl p-6 liquid-glass-card transition-all duration-300 hover:-translate-y-1.5 group">
                    <span className="flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ width: 40, height: 40, background: 'rgba(200,245,66,0.15)' }}>
                      <iconify-icon icon="solar:book-bookmark-linear" width="20" style={{ strokeWidth: 1.5, color: '#c8f542' }}></iconify-icon>
                    </span>
                    <h3 className="mt-5 text-base font-medium text-white font-geist tracking-tight">Guides that actually teach</h3>
                    <p className="mt-2 text-sm text-white/55 leading-relaxed font-geist">Plain-language care paths from symptoms and causes to precautions — no jargon, no hype, no shortcuts.</p>
                  </div>

                  <div className="rounded-2xl p-6 liquid-glass-card transition-all duration-300 hover:-translate-y-1.5 group">
                    <span className="flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ width: 40, height: 40, background: 'rgba(200,245,66,0.15)' }}>
                      <iconify-icon icon="solar:shield-check-linear" width="20" style={{ strokeWidth: 1.5, color: '#c8f542' }}></iconify-icon>
                    </span>
                    <h3 className="mt-5 text-base font-medium text-white font-geist tracking-tight">Privacy by default</h3>
                    <p className="mt-2 text-sm text-white/55 leading-relaxed font-geist">Encrypted local storage, client-side image compression, and zero third-party data sharing.</p>
                  </div>
                </div>
              </section>

              {/* HOW IT WORKS SECTION */}
              <section id="how-it-works" ref={howItWorksRef} className="relative z-10 px-5 sm:px-8 lg:px-12 py-16 lg:py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="max-w-2xl mx-auto text-center mb-12">
                  <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/90 mb-6 font-geist" style={{ border: '1px solid rgba(200,245,66,0.35)', background: 'rgba(200,245,66,0.06)' }}>
                    <iconify-icon icon="solar:play-circle-linear" width="15" style={{ strokeWidth: 1.5, color: '#c8f542' }}></iconify-icon>
                    Architecture & Flow
                  </span>
                  <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-geist tracking-tighter" style={{ lineHeight: 1.15 }} data-reveal-words="">
                    How <span style={{ color: '#c8f542' }}>Derma Assist AI</span> Works
                  </h2>
                  <p className="mt-5 text-sm text-white/60 leading-relaxed max-w-lg mx-auto font-geist" data-fade="">
                    A seamless 4-step workflow combining high-resolution visual capture, Groq Vision Models, and live AI clinical consultation.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto" data-stagger="">
                  
                  <div className="rounded-2xl p-6 liquid-glass-card">
                    <span className="w-8 h-8 rounded-full bg-[#c8f542]/20 text-[#c8f542] flex items-center justify-center font-bold text-xs mb-4 font-geist">01</span>
                    <h3 className="text-base font-semibold text-white mb-2 font-geist">Photo Capture</h3>
                    <p className="text-xs text-white/60 leading-relaxed font-geist">Snap a photo via your camera or gallery. Images are compressed client-side for ultra-fast processing and privacy.</p>
                  </div>

                  <div className="rounded-2xl p-6 liquid-glass-card">
                    <span className="w-8 h-8 rounded-full bg-[#c8f542]/20 text-[#c8f542] flex items-center justify-center font-bold text-xs mb-4 font-geist">02</span>
                    <h3 className="text-base font-semibold text-white mb-2 font-geist">Groq AI Vision</h3>
                    <p className="text-xs text-white/60 leading-relaxed font-geist">The image is analyzed using Groq Qwen/Llama multimodal vision intelligence to detect textures, scaling, and skin indicators.</p>
                  </div>

                  <div className="rounded-2xl p-6 liquid-glass-card">
                    <span className="w-8 h-8 rounded-full bg-[#c8f542]/20 text-[#c8f542] flex items-center justify-center font-bold text-xs mb-4 font-geist">03</span>
                    <h3 className="text-base font-semibold text-white mb-2 font-geist">Live AI Assistant</h3>
                    <p className="text-xs text-white/60 leading-relaxed font-geist">Chat directly with the AI dermatological assistant to inquire about specific precautions, contagiousness, and routine care.</p>
                  </div>

                  <div className="rounded-2xl p-6 liquid-glass-card">
                    <span className="w-8 h-8 rounded-full bg-[#c8f542]/20 text-[#c8f542] flex items-center justify-center font-bold text-xs mb-4 font-geist">04</span>
                    <h3 className="text-base font-semibold text-white mb-2 font-geist">Progression Mapping</h3>
                    <p className="text-xs text-white/60 leading-relaxed font-geist">Save reports to your encrypted scan archives and compare recovery milestones side-by-side over time.</p>
                  </div>

                </div>
              </section>

              {/* ABOUT (DEVELOPER SHOWCASE) */}
              <section id="about" className="relative z-10 px-5 sm:px-8 lg:px-12 py-16 lg:py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="max-w-2xl mx-auto text-center">
                  <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/90 mb-6 font-geist" style={{ border: '1px solid rgba(200,245,66,0.35)', background: 'rgba(200,245,66,0.06)' }}>
                    <iconify-icon icon="solar:users-group-rounded-linear" width="15" style={{ strokeWidth: 1.5, color: '#c8f542' }}></iconify-icon>
                    About us
                  </span>
                  <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-geist tracking-tighter" style={{ lineHeight: 1.15 }} data-reveal-words="">
                    The crew behind the
                    <span style={{ color: '#c8f542' }}> compass</span>
                  </h2>
                  <p className="mt-5 text-sm text-white/60 leading-relaxed max-w-lg mx-auto font-geist" data-fade="">
                    Engineers, analysts and educators united by one mission: make skin healthcare legible and accessible for everyone.
                  </p>
                </div>

                {/* 4 Developer Cards */}
                <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto" data-stagger="">
                  
                  {/* Dev 1: Sabarinath */}
                  <div className="rounded-2xl p-6 text-center liquid-glass-card transition-all duration-300 hover:-translate-y-1.5 group">
                    <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-[#c8f542]/20 text-[#c8f542] font-geist font-bold text-2xl group-hover:scale-105 transition-transform" style={{ border: '2px solid rgba(200,245,66,0.4)' }}>
                      S
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white font-geist">Sabarinath</p>
                    <p className="text-xs font-geist mt-0.5" style={{ color: '#c8f542' }}>Developer Lead</p>
                    <p className="mt-2 text-xs text-white/50 leading-relaxed font-geist">Front-End & Back-End Lead</p>
                  </div>

                  {/* Dev 2: Sanjay Krishnan */}
                  <div className="rounded-2xl p-6 text-center liquid-glass-card transition-all duration-300 hover:-translate-y-1.5 group">
                    <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-[#c8f542]/20 text-[#c8f542] font-geist font-bold text-2xl group-hover:scale-105 transition-transform" style={{ border: '2px solid rgba(200,245,66,0.4)' }}>
                      SK
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white font-geist">Sanjay Krishnan</p>
                    <p className="text-xs font-geist mt-0.5" style={{ color: '#c8f542' }}>AI Engineer</p>
                    <p className="mt-2 text-xs text-white/50 leading-relaxed font-geist">Vision Model Architect</p>
                  </div>

                  {/* Dev 3: Sreyas */}
                  <div className="rounded-2xl p-6 text-center liquid-glass-card transition-all duration-300 hover:-translate-y-1.5 group">
                    <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-[#c8f542]/20 text-[#c8f542] font-geist font-bold text-2xl group-hover:scale-105 transition-transform" style={{ border: '2px solid rgba(200,245,66,0.4)' }}>
                      SR
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white font-geist">Sreyas</p>
                    <p className="text-xs font-geist mt-0.5" style={{ color: '#c8f542' }}>Data Analyst</p>
                    <p className="mt-2 text-xs text-white/50 leading-relaxed font-geist">Health Telemetry Specialist</p>
                  </div>

                  {/* Dev 4: Vinush */}
                  <div className="rounded-2xl p-6 text-center liquid-glass-card transition-all duration-300 hover:-translate-y-1.5 group">
                    <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-[#c8f542]/20 text-[#c8f542] font-geist font-bold text-2xl group-hover:scale-105 transition-transform" style={{ border: '2px solid rgba(200,245,66,0.4)' }}>
                      V
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white font-geist">Vinush</p>
                    <p className="text-xs font-geist mt-0.5" style={{ color: '#c8f542' }}>Testing & Finance</p>
                    <p className="mt-2 text-xs text-white/50 leading-relaxed font-geist">QA & Subscription Integration</p>
                  </div>

                </div>
              </section>
            </div>
          )}

          {/* PREVIEW SCREEN */}
          {currentScreen === 'preview' && selectedImage && (
            <div className="max-w-xl mx-auto py-12 px-6 relative z-10 animate-in fade-in">
              <h3 className="font-geist font-medium text-xl text-white mb-6 text-center">Verification Preview</h3>
              <div className="liquid-glass-card p-3 rounded-2xl mb-8">
                <img src={selectedImage} className="w-full aspect-[4/3] object-cover rounded-xl" alt="Preview" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 font-geist">
                <button onClick={startAnalysis} className="flex-1 py-3.5 rounded-full font-medium text-[#12300f] text-xs uppercase tracking-wider transition-all hover:scale-[1.02]" style={{ backgroundColor: '#c8f542', boxShadow: '0 8px 24px -6px rgba(200,245,66,0.4)' }}>
                  Analyze Pattern Now
                </button>
                <button onClick={checkQuotaAndOpenUpload} className="px-6 py-3.5 rounded-full font-medium text-white/80 text-xs uppercase tracking-wider transition-all hover:text-white border border-white/18">
                  Retake Photo
                </button>
              </div>
            </div>
          )}

          {/* ANALYZING SCREEN */}
          {currentScreen === 'analyzing' && (
            <div className="py-28 text-center flex flex-col items-center justify-center relative z-10 font-geist">
              <div className="w-16 h-16 rounded-full border-4 border-[#c8f542]/30 border-t-[#c8f542] animate-spin mb-6" />
              <p className="font-medium text-white uppercase tracking-widest text-sm">
                Analyzing Skin Telemetry via Groq Vision AI...
              </p>
            </div>
          )}

          {/* RESULT SCREEN */}
          {currentScreen === 'result' && analysis && (
            <div className="max-w-4xl mx-auto py-8 px-6 relative z-10 animate-in fade-in">
              <AnalysisView analysis={analysis} selectedImage={selectedImage} />
            </div>
          )}

          {/* HISTORY SCREEN */}
          {currentScreen === 'history' && (
            <div className="max-w-4xl mx-auto py-8 px-6 relative z-10 animate-in fade-in">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-geist font-medium text-2xl text-white">Scan Archives</h3>
                  <p className="text-xs text-white/50 font-geist mt-1">{entries.length} scans saved locally</p>
                </div>

                <div className="flex items-center gap-3">
                  {entries.length > 0 && (
                    <button onClick={clearAllHistory} className="px-4 py-2 rounded-full text-xs font-geist text-white/60 hover:text-white border border-white/10 hover:border-white/30 transition-all">
                      Clear Archives
                    </button>
                  )}
                  <button onClick={checkQuotaAndOpenUpload} className="rounded-full px-5 py-2 text-xs font-medium text-[#12300f] font-geist uppercase" style={{ backgroundColor: '#c8f542' }}>
                    New Scan
                  </button>
                </div>
              </div>

              {entries.length === 0 ? (
                <div className="py-20 text-center rounded-2xl liquid-glass-card">
                  <p className="font-geist text-xs text-white/50 uppercase tracking-widest">Scan archive is currently empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {entries.slice().reverse().map(e => (
                    <div 
                      key={e.id} 
                      onClick={() => { if (e.analysis) { setAnalysis(e.analysis); setSelectedImage(e.imageData); navigateTo('result'); } }} 
                      className="liquid-glass-card rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-white/30 transition-all group" 
                    >
                      <div className="flex items-center gap-4">
                        <img src={e.imageData} className="w-16 h-16 rounded-xl object-cover" alt="Scan" />
                        <div>
                          <h4 className="font-geist font-medium text-white text-sm">{e.label}</h4>
                          <p className="font-geist text-xs text-white/50">{new Date(e.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <button 
                        onClick={(ev) => deleteEntry(e.id, ev)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors"
                        title="Delete Scan"
                      >
                        <iconify-icon icon="solar:trash-bin-trash-bold" width="16"></iconify-icon>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMPARE SCREEN */}
          {currentScreen === 'compare' && (
            <div className="max-w-4xl mx-auto py-8 px-6 relative z-10 animate-in fade-in">
              <h3 className="font-geist font-medium text-2xl text-white mb-8 text-center">Progression Mapping</h3>
              <ProgressionCompare entries={entries} />
            </div>
          )}

          {/* SUBSCRIPTION NATIVE PAGE VIEW */}
          {currentScreen === 'pricing' && (
            <div className="max-w-4xl mx-auto py-8 px-6 relative z-10 animate-in fade-in">
              <PricingModal 
                onClose={() => navigateTo('home')}
                onSuccess={() => {
                  setScanCount(0);
                  navigateTo('home');
                }}
              />
            </div>
          )}
        </div>

        {/* DETAILED FOOTER - ONLY RENDERED ON HOME SCREEN */}
        {currentScreen === 'home' && (
          <div>
            {/* BOTTOM CTA CONTAINER */}
            <section id="cta" className="relative z-10 px-5 sm:px-8 lg:px-12 py-16 lg:py-20">
              <div className="rounded-[28px] p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden liquid-glass-card-lime">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(200,245,66,0.15) 0%,transparent 60%)' }} aria-hidden="true"></div>
                <h2 className="relative text-white text-3xl sm:text-4xl lg:text-5xl font-geist tracking-tighter max-w-2xl mx-auto" style={{ lineHeight: 1.15 }} data-reveal-words="">
                  Ready to monitor your
                  <span style={{ color: '#c8f542' }}> skin health</span>
                  ?
                </h2>
                <p className="relative mt-5 text-sm text-white/60 leading-relaxed max-w-md mx-auto font-geist" data-fade="">
                  Join 24,000+ users. Free for your daily tracking — clear visual guidance, no guesswork.
                </p>
                <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3" data-fade="">
                  <button 
                    onClick={checkQuotaAndOpenUpload}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-[#12300f] hover:brightness-105 transition-all duration-150 hover:scale-[1.03] active:scale-[0.98] font-geist" 
                    style={{ backgroundColor: '#c8f542', boxShadow: '0 8px 24px -6px rgba(200,245,66,0.4)' }}
                  >
                    <iconify-icon icon="solar:arrow-right-up-linear" width="15" style={{ strokeWidth: 1.5 }}></iconify-icon>
                    Start Free Scan
                  </button>

                  <button 
                    onClick={scrollToTop}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white/85 hover:text-white hover:bg-white/5 transition-colors duration-150 font-geist" 
                    style={{ border: '1px solid rgba(255,255,255,0.18)' }}
                  >
                    <iconify-icon icon="solar:play-circle-linear" width="15" style={{ strokeWidth: 1.5 }}></iconify-icon>
                    Back to Top
                  </button>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="relative z-10 px-5 sm:px-8 lg:px-12 pt-14 pb-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.15)' }}>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-2">
                  <div onClick={() => navigateTo('home')} className="flex items-center gap-2.5 cursor-pointer">
                    <Logo size={28} />
                    <span className="text-white font-medium text-base font-geist tracking-tight">
                      Derma Assist AI
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs font-geist">
                    Your trusted AI dermatological analysis companion. Clarity over hype, since 2026.
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                    <a href="#" aria-label="Follow on X" className="flex items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 hover:scale-110" style={{ width: 34, height: 34, border: '1px solid rgba(255,255,255,0.18)' }}>
                      <iconify-icon icon="simple-icons:x" width="13" style={{ color: 'rgba(255,255,255,0.7)' }}></iconify-icon>
                    </a>
                    <a href="#" aria-label="Join Discord" className="flex items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 hover:scale-110" style={{ width: 34, height: 34, border: '1px solid rgba(255,255,255,0.18)' }}>
                      <iconify-icon icon="simple-icons:discord" width="14" style={{ color: 'rgba(255,255,255,0.7)' }}></iconify-icon>
                    </a>
                    <a href="#" aria-label="View GitHub" className="flex items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 hover:scale-110" style={{ width: 34, height: 34, border: '1px solid rgba(255,255,255,0.18)' }}>
                      <iconify-icon icon="simple-icons:github" width="14" style={{ color: 'rgba(255,255,255,0.7)' }}></iconify-icon>
                    </a>
                    <a href="#" aria-label="Watch on YouTube" className="flex items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 hover:scale-110" style={{ width: 34, height: 34, border: '1px solid rgba(255,255,255,0.18)' }}>
                      <iconify-icon icon="simple-icons:youtube" width="14" style={{ color: 'rgba(255,255,255,0.7)' }}></iconify-icon>
                    </a>
                  </div>
                </div>

                <nav aria-label="Product">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40 font-geist">Product</p>
                  <ul className="mt-4 space-y-2.5 text-sm font-geist">
                    <li><button onClick={() => navigateTo('history')} className="text-white/60 hover:text-white transition-colors">Scan Archives</button></li>
                    <li><button onClick={() => navigateTo('compare')} className="text-white/60 hover:text-white transition-colors">Progression Mapping</button></li>
                    <li><button onClick={() => navigateTo('pricing')} className="text-white/60 hover:text-white transition-colors">Subscription</button></li>
                    <li><button onClick={checkQuotaAndOpenUpload} className="text-white/60 hover:text-white transition-colors">New Scan</button></li>
                  </ul>
                </nav>

                <nav aria-label="Learn">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40 font-geist">Learn</p>
                  <ul className="mt-4 space-y-2.5 text-sm font-geist">
                    <li><a href="#features" className="text-white/60 hover:text-white transition-colors">Symptoms Guide</a></li>
                    <li><a href="#features" className="text-white/60 hover:text-white transition-colors">Causes & Triggers</a></li>
                    <li><a href="#features" className="text-white/60 hover:text-white transition-colors">Care Plans</a></li>
                    <li><a href="#features" className="text-white/60 hover:text-white transition-colors">Glossary</a></li>
                  </ul>
                </nav>

                <nav aria-label="Company">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40 font-geist">Company</p>
                  <ul className="mt-4 space-y-2.5 text-sm font-geist">
                    <li><a href="#about" onClick={() => navigateTo('home')} className="text-white/60 hover:text-white transition-colors">About Us</a></li>
                    <li><a href="#about" onClick={() => navigateTo('home')} className="text-white/60 hover:text-white transition-colors">Developers</a></li>
                    <li><a href="mailto:support@derma-assist.ai" className="text-white/60 hover:text-white transition-colors">support@derma-assist.ai</a></li>
                  </ul>
                </nav>
              </div>

              <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs text-white/40 font-geist">
                  © 2026 Derma Assist AI Labs. Educational tool — not clinical diagnosis.
                </p>
                <div className="flex items-center gap-5 text-xs font-geist">
                  <a href="#" className="text-white/40 hover:text-white/80 transition-colors">Privacy</a>
                  <a href="#" className="text-white/40 hover:text-white/80 transition-colors">Terms</a>
                  <a href="#" className="text-white/40 hover:text-white/80 transition-colors">Cookies</a>
                </div>
              </div>
            </footer>
          </div>
        )}

      </main>

      {/* CLIENT LOGIN MODAL */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
          onSuccess={(email) => {
            setUserEmail(email);
            setIsLoggedIn(true);
            setShowLoginModal(false);

            // Fetch name from user object or profile
            const savedUser = localStorage.getItem('derm_user');
            if (savedUser) {
              try {
                const parsed = JSON.parse(savedUser);
                if (parsed.name) setUserName(parsed.name);
              } catch (e) {}
            }
          }}
        />
      )}

      {/* USER ENCRYPTED HEALTH PROFILE MODAL */}
      {showProfileModal && (
        <UserProfileModal
          onClose={() => setShowProfileModal(false)}
          userEmail={userEmail}
          onLogout={handleLogout}
          onProfileUpdate={(newName) => setUserName(newName)}
        />
      )}

      {/* UPLOAD SHEET MODAL */}
      {showUploadSheet && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#041408]/90 animate-in fade-in" onClick={() => setShowUploadSheet(false)}>
          <div className="w-full max-w-sm liquid-glass-card rounded-[28px] p-8 relative shadow-2xl animate-in zoom-in-95 duration-300 font-geist" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-semibold text-[#c8f542] uppercase tracking-wider mb-2" style={{ border: '1px solid rgba(200,245,66,0.35)', background: 'rgba(200,245,66,0.06)' }}>
                IMAGE SELECTION
              </span>
              <h3 className="font-semibold text-xl text-white">Capture or Upload</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#c8f542]/10 hover:border-[#c8f542]/40 transition-all active:scale-95 group"
              >
                <iconify-icon icon="solar:camera-bold" width="36" height="36" style={{ color: '#c8f542' }}></iconify-icon>
                <span className="text-xs font-semibold text-white uppercase">Camera</span>
              </button>

              <button 
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#c8f542]/10 hover:border-[#c8f542]/40 transition-all active:scale-95 group"
              >
                <iconify-icon icon="solar:gallery-wide-bold" width="36" height="36" style={{ color: '#c8f542' }}></iconify-icon>
                <span className="text-xs font-semibold text-white uppercase">Gallery</span>
              </button>
            </div>

            <button 
              onClick={() => setShowUploadSheet(false)} 
              className="w-full mt-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>

            <input type="file" ref={cameraInputRef} onChange={handleUpload} className="hidden" accept="image/*" capture="environment" />
            <input type="file" ref={galleryInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
          </div>
        </div>
      )}

      {/* AI VISION LIVE CHAT MODAL */}
      {showChatModal && (
        <SkinChatModal 
          onClose={() => setShowChatModal(false)}
        />
      )}

    </div>
  );
}
