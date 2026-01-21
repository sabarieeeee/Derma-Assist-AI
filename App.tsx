import React, { useState, useEffect, useRef } from 'react';
import { analyzeSkinImage } from './geminiService';
import { TimelineEntry, SkinAnalysis, DetailCategory, AnalysisPoint } from './types';
import ProgressionCompare from './ProgressionCompare';

/* ================= UI WIDGETS ================= */

const LiquidGlassButton: React.FC<{ 
  text: string; 
  onClick: () => void; 
  icon?: React.ReactNode; 
  className?: string; 
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}> = ({ text, onClick, icon, className = "", variant = 'primary', disabled = false }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full h-14 rounded-[22px] flex items-center justify-center gap-3 liquid-glass-btn relative group overflow-hidden ${className} ${
      variant === 'primary' ? 'font-extrabold text-slate-800' : 'font-semibold text-slate-500'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    {icon && <span className="opacity-80 group-hover:scale-110 transition-transform duration-300">{icon}</span>}
    <span className="tracking-tight">{String(text)}</span>
  </button>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-center gap-4 p-5 rounded-[28px] bg-white/40 border border-white/60 mb-3 shadow-sm hover:bg-white/60 transition-all duration-300">
    <div className="w-11 h-11 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm text-blue-500 shrink-0">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <h4 className="font-extrabold text-[15px] text-slate-900 leading-tight mb-0.5">{String(title)}</h4>
      <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{String(desc)}</p>
    </div>
  </div>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode; variant?: 'glass' | 'outline' }> = ({ title, children, icon, variant = 'glass' }) => (
  <div className={`rounded-[32px] p-6 mb-5 shadow-sm relative overflow-hidden group ${variant === 'glass' ? 'glass-card' : 'border border-slate-200 bg-white/20'}`}>
    <div className="flex items-center gap-3 mb-4">
      {icon && <div className="text-slate-400">{icon}</div>}
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{String(title)}</h3>
    </div>
    <div className="text-slate-700">{children}</div>
  </div>
);

const NavIconButton: React.FC<{ icon: React.ReactNode; onClick: () => void; active?: boolean }> = ({ icon, onClick, active }) => (
  <button 
    onClick={onClick}
    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
      active 
        ? 'bg-white/90 border border-white shadow-md text-slate-900' 
        : 'bg-white/10 border border-white/20 text-slate-400 hover:text-slate-800 backdrop-blur-md'
    }`}
  >
    {icon}
  </button>
);

const StepRow: React.FC<{ step: string; text: string }> = ({ step, text }) => (
  <div className="flex items-center gap-4 mb-4 last:mb-0">
    <div className="w-7 h-7 rounded-lg bg-white/60 border border-white shadow-sm flex items-center justify-center text-[12px] font-bold text-slate-600">
      {String(step)}
    </div>
    <span className="text-[13px] font-medium text-slate-600 leading-snug">{String(text)}</span>
  </div>
);

/* ================= UTILS (CRITICAL FIX FOR IOS) ================= */

// Helper to downscale images to prevent iOS Memory Crash
const compressImageForUI = (base64Str: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Compress to JPEG 0.7 quality to save memory
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(base64Str); // Fallback to original
  });
};


/* ================= MAIN APP ================= */

type Screen = 'home' | 'preview' | 'analyzing' | 'result' | 'detail' | 'history' | 'compare';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [detailCategory, setDetailCategory] = useState<DetailCategory>(null);
  const [helperIdx, setHelperIdx] = useState(0);
  
  // New State for Comparison Selection
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('derm_history');
    if (saved) try { setEntries(JSON.parse(saved)); } catch (e) {}
  }, []);

  // CRITICAL FIX: Safe LocalStorage Saving
  useEffect(() => {
    try {
      localStorage.setItem('derm_history', JSON.stringify(entries));
    } catch (e) {
      console.warn("Storage Quota Exceeded - History not saved to prevent crash");
      // Optional: You could slice the array here to keep only the last 5 entries
    }
  }, [entries]);

  useEffect(() => {
    let helperInterval: any;
    if (currentScreen === 'analyzing') {
      helperInterval = setInterval(() => setHelperIdx(i => (i + 1) % 3), 4500);
    }
    return () => { if (helperInterval) clearInterval(helperInterval); };
  }, [currentScreen]);

  const navigateTo = (s: Screen) => {
    setCurrentScreen(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (s !== 'compare') setCompareSelection([]);
  };

  const deleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("Delete this scan from history?")) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const toggleCompareSelection = (id: string) => {
    setCompareSelection(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      if (prev.length >= 2) return [prev[1], id]; 
      return [...prev, id];
    });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (re) => {
        const result = re.target?.result;
        if (typeof result === 'string') {
          // CRITICAL FIX: Compress immediately before setting state
          // This prevents the 10MB+ string from crashing React State on iOS
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
    if (!selectedImage) return;
    
    navigateTo('analyzing');
    setAnalysis(null); 

    try {
      // The image is already compressed from handleUpload, so it's safe to send
      const result = await analyzeSkinImage(selectedImage);
      
      if (!result) throw new Error("No data received");

      setAnalysis(result);

      const newEntry: TimelineEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        imageData: selectedImage, // Storing the compressed version is safe
        label: result.diseaseName || (result.isHealthy ? 'Healthy Skin' : 'Analysis'),
        analysis: result
      };
      
      setEntries(prev => [...prev, newEntry]);

      setTimeout(() => {
        navigateTo('result');
      }, 2000);

    } catch (err) {
      alert("Analysis failed. Please try again.");
      console.error(err);
      navigateTo('home');
    }
  };

  // Helper to extract the list based on category
  const getDetailList = (): (AnalysisPoint | string)[] => {
    if (!analysis) return [];
    
    switch (detailCategory) {
      case 'Symptoms':
        return analysis.symptoms && analysis.symptoms.length > 0 ? analysis.symptoms : [{ title: "No Data", details: "No specific symptoms listed." }];
      case 'Causes':
        return analysis.reasons && analysis.reasons.length > 0 ? analysis.reasons : [{ title: "No Data", details: "No specific reasons listed." }];
      case 'Care & Precautions':
        return [...(analysis.precautions || []), ...(analysis.prevention || [])];
      case 'Healing & Tracking':
        const items = [...(analysis.treatments || [])];
        if (analysis.healingPeriod) {
           items.unshift({ title: "Estimated Recovery", details: analysis.healingPeriod });
        }
        return items;
      default:
        return [];
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative bg-[#F8FAFC] overflow-x-hidden antialiased">
       
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-40 bg-[#F8FAFC]/40 backdrop-blur-2xl border-b border-white/20">
        <h1 className="text-[13px] font-black tracking-[0.2em] text-slate-900 uppercase">Derma Assist AI</h1>
        <div className="flex gap-2.5 nav-glass p-1.5 rounded-[22px] shadow-sm">
          <NavIconButton onClick={() => navigateTo('history')} active={currentScreen === 'history'} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <NavIconButton onClick={() => navigateTo('home')} active={currentScreen === 'home'} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
          <NavIconButton onClick={() => navigateTo('compare')} active={currentScreen === 'compare'} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        </div>
      </header>

      <main className="flex-1 relative">
        {currentScreen === 'home' && (
          <div className="px-8 pt-8 pb-32 fade-in-up">
            <div className="mb-10 text-center">
              <h2 className="text-[34px] font-black text-slate-900 leading-[1.1] mb-5 tracking-tight">Smart Skin Condition Analyzer.</h2>
              <p className="text-[14px] text-slate-500 font-medium leading-relaxed max-w-[90%] mx-auto mb-10">
                Identify visual patterns and track your healing journey with AI verification benchmarks.
              </p>

              <div className="space-y-3 mb-12">
                <FeatureCard 
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  title="Pattern Mapping"
                  desc="Visual identification of abnormalities, rashes, and lesions."
                />
                <FeatureCard 
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  title="Care & Treatment"
                  desc="Information on common causes, care, and prevention."
                />
                <FeatureCard 
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                  title="Healing Cycles"
                  desc="Log history to track weekly recovery progress evolution."
                />
              </div>

              <SectionCard title="Workflow">
                <StepRow step="1" text="Capture a clear photo of the skin area" />
                <StepRow step="2" text="AI verification & pattern benchmarking" />
                <StepRow step="3" text="Get comprehensive care report" />
              </SectionCard>

              <div className="mt-8 p-6 rounded-[32px] bg-amber-50/40 border border-amber-100 shadow-sm text-left">
                <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  Important Note
                </h4>
                <p className="text-[11.5px] text-amber-900/70 font-bold leading-relaxed">
                  This tool uses AI for educational guidance and pattern identification only. It is not a substitute for clinical diagnosis. Always consult a certified dermatologist for professional medical advice.
                </p>
              </div>

              <div className="mt-12 mb-4 text-center">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.25em] mb-1">
                  Designed & Developed by
                </p>
                <h4 className="text-[9px] font-black text-slate-400/80 uppercase tracking-[0.15em]">
                  Sabarinath ©
                </h4>
                <p className="text-[8px] font-bold text-slate-300/50 mt-2">
                  v3.1.0 • 2026
                </p>
              </div>

            </div>
          </div>
        )}

        {currentScreen === 'preview' && selectedImage && (
          <div className="p-8 pb-32 fade-in-up">
            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Verification Preview</h3>
            <div className="rounded-[40px] overflow-hidden glass-card p-3 mb-10 shadow-2xl">
              <img src={selectedImage} className="w-full h-full object-cover rounded-[32px] aspect-[4/5]" />
            </div>
            <div className="space-y-4">
              <LiquidGlassButton text="Analyze This Pattern" onClick={startAnalysis} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>} />
              <LiquidGlassButton text="Discard & Retake" onClick={() => setShowUploadSheet(true)} variant="secondary" />
            </div>
          </div>
        )}

        {currentScreen === 'analyzing' && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F8FAFC]">
            <div className="flex items-center justify-center mb-5">
               <div className="w-1 h-1 bg-blue-500 rounded-full animate-soft-pulse shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-2">
                Analyzing
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">
                {['Scanning Texture', 'Checking Pores', 'Verifying Health'][helperIdx]}
              </p>
            </div>
          </div>
        )}

        {currentScreen === 'result' && (
          <div className="p-8 pb-40 fade-in-up">
            {!analysis ? (
               <div className="text-center mt-20">
                 <p className="text-slate-400 font-bold mb-4">Error loading results.</p>
                 <LiquidGlassButton text="Go Home" onClick={() => navigateTo('home')} />
               </div>
            ) : (
            <>
              <div className="glass-card p-6 rounded-[44px] mb-8 relative overflow-hidden flex flex-col items-center text-center">
                <div className="w-full aspect-[4/3] rounded-[32px] overflow-hidden border border-white shadow-sm mb-6 relative group">
                  <img src={selectedImage || ''} className="w-full h-full object-cover" />
                </div>
                <div className="px-2">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.25em] block mb-2">Analysis Result</span>
                  
                  <h3 className="text-[26px] font-black text-slate-900 leading-tight mb-4">
                      {analysis.isHealthy && analysis.diseaseName?.includes("Healthy") 
                        ? "Healthy Skin" 
                        : (analysis.diseaseName || 'Unknown Condition')}
                  </h3>

                  <div className="w-12 h-[2.5px] bg-slate-200 mx-auto mb-6" />
                  <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                    {analysis.description ? String(analysis.description) : "Analysis shows standard texture without critical visual abnormalities."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <LiquidGlassButton text="View Symptoms" onClick={() => { setDetailCategory('Symptoms'); navigateTo('detail'); }} />
                <LiquidGlassButton text="Triggers & Reasons" onClick={() => { setDetailCategory('Causes'); navigateTo('detail'); }} />
                <LiquidGlassButton text="Precaution & Care" onClick={() => { setDetailCategory('Care & Precautions'); navigateTo('detail'); }} />
                <LiquidGlassButton text="Recovery Tracking" onClick={() => { setDetailCategory('Healing & Tracking'); navigateTo('detail'); }} />
              </div>
            </>
            )}
          </div>
        )}

        {currentScreen === 'detail' && analysis && (
          <div className="p-8 pb-32 fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => navigateTo('result')} className="w-10 h-10 liquid-glass-btn flex items-center justify-center rounded-xl">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h3 className="text-[18px] font-black text-slate-900 tracking-tight uppercase">{String(detailCategory)}</h3>
            </div>
            <div className="space-y-4">
              {getDetailList().map((point, i) => (
                <div key={i} className="p-6 glass-card rounded-[28px] border border-white flex gap-4 items-start shadow-sm hover:translate-x-1 transition-transform duration-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0 shadow-sm" />
                  <div className="flex-1">
                    {typeof point === 'string' ? (
                       <p className="text-[14px] text-slate-700 font-bold leading-relaxed">{point}</p>
                    ) : (
                       <>
                         <p className="text-[15px] text-slate-800 font-black leading-tight mb-2">{point.title}</p>
                         <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{point.details}</p>
                       </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentScreen === 'history' && (
          <div className="p-8 pb-32 fade-in-up">
            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Scan Archives</h3>
            {entries.length === 0 ? (
              <div className="py-24 text-center glass-card rounded-[40px] border-dashed border-2">
                <p className="text-slate-300 font-black uppercase tracking-[0.1em] text-[10px]">Your history is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.slice().reverse().map(e => (
                  <div key={e.id} onClick={() => { if (e.analysis) { setAnalysis(e.analysis); setSelectedImage(e.imageData); navigateTo('result'); } }} className="bg-white/40 backdrop-blur-lg p-4 rounded-[30px] border border-white shadow-sm flex gap-5 items-center active:scale-95 transition-all cursor-pointer group relative">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0">
                      <img src={e.imageData} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-[16px] leading-tight mb-1">{String(e.label)}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(e.timestamp).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={(evt) => deleteEntry(e.id, evt)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentScreen === 'compare' && (
          <div className="p-8 pb-32 fade-in-up">
            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Progression Mapping</h3>
            
            <div className="mb-6">
              <p className="text-[11px] font-bold text-slate-400 mb-4 text-center">
                 {compareSelection.length === 2 ? "Ready to Compare" : `Select 2 Scans (${compareSelection.length}/2)`}
              </p>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                 {entries.slice().reverse().map(e => {
                   const isSelected = compareSelection.includes(e.id);
                   return (
                     <div 
                       key={e.id} 
                       onClick={() => toggleCompareSelection(e.id)}
                       className={`p-3 rounded-[24px] border flex items-center gap-4 transition-all cursor-pointer ${
                         isSelected ? 'bg-blue-50 border-blue-400 shadow-md' : 'bg-white/40 border-white hover:bg-white/60'
                       }`}
                     >
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                         {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                       </div>
                       <img src={e.imageData} className="w-10 h-10 rounded-xl object-cover" />
                       <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-[13px]">{e.label}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(e.timestamp).toLocaleDateString()}</p>
                       </div>
                     </div>
                   );
                 })}
              </div>
            </div>

            {compareSelection.length === 2 && (
               <div className="mt-4">
                 <div className="p-4 bg-white/50 rounded-[32px] border border-white shadow-sm mb-6">
                    <h4 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Comparison View</h4>
                    <ProgressionCompare entries={entries.filter(e => compareSelection.includes(e.id))} />
                 </div>
               </div>
            )}
            
            {entries.length < 2 && (
               <div className="text-center p-6 bg-amber-50 rounded-[32px] border border-amber-100">
                  <p className="text-amber-800/60 text-[11px] font-bold">You need at least 2 scans to use comparison.</p>
               </div>
            )}
          </div>
        )}
      </main>

      {(currentScreen === 'home' || currentScreen === 'history' || currentScreen === 'compare' || currentScreen === 'result') && (
        <div className="fixed bottom-0 left-0 right-0 px-8 pb-10 z-[60] pointer-events-none">
          <div className="max-w-[320px] mx-auto pointer-events-auto">
            <LiquidGlassButton 
              text={currentScreen === 'result' ? "Scan Complete" : "Start New Scan"}
              onClick={() => {
                if (currentScreen === 'result') navigateTo('home');
                else setShowUploadSheet(true);
              }}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>}
              className="shadow-2xl"
            />
          </div>
        </div>
      )}

      {showUploadSheet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-slate-900/10 backdrop-blur-[8px]" onClick={() => setShowUploadSheet(false)}>
          <div className="w-full max-w-[320px] bg-white rounded-[56px] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center mb-10">
              <h3 className="text-[11px] font-black tracking-[0.25em] text-slate-400 uppercase">Select Image</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-4 p-7 rounded-[40px] bg-slate-50 border border-slate-100 active:scale-95 transition-all hover:bg-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>
                </div>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Camera</span>
              </button>

              <button 
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center gap-4 p-7 rounded-[40px] bg-slate-50 border border-slate-100 active:scale-95 transition-all hover:bg-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Gallery</span>
              </button>
            </div>

            <button 
              onClick={() => setShowUploadSheet(false)} 
              className="w-full mt-10 py-1 font-black text-slate-300 text-[9px] uppercase tracking-[0.3em] transition-colors"
            >
              Cancel
            </button>

            <input type="file" ref={cameraInputRef} onChange={handleUpload} className="hidden" accept="image/*" capture="environment" />
            <input type="file" ref={galleryInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
          </div>
        </div>
      )}
    </div>
  );
}
