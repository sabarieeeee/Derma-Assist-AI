import React, { useState, useEffect } from 'react';
import { TimelineEntry, ComparisonResult } from './types';
import { compareProgression } from './geminiservices'; 

interface ProgressionCompareProps {
  entries: TimelineEntry[];
}

const ProgressionCompare: React.FC<ProgressionCompareProps> = ({ entries }) => {
  const [idx1, setIdx1] = useState(0);
  const [idx2, setIdx2] = useState(entries.length - 1);
  const [report, setReport] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (idx1 === idx2) return;
    setLoading(true);
    setReport(null);
    try {
      const result = await compareProgression(entries[idx1].imageData, entries[idx2].imageData);
      setReport(result);
    } catch (e) {
      alert("Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entries.length >= 2) {
      setIdx1(0);
      setIdx2(entries.length - 1);
    }
  }, [entries]);

  if (entries.length < 2) return null;

  // Helper to choose colors based on verdict (Updated for Glassy Look)
  const getVerdictStyles = (v: string) => {
    if (v === 'IMPROVED') return {
      container: 'border-green-200 bg-green-50/50',
      text: 'text-green-600',
      icon: 'text-green-500'
    };
    if (v === 'WORSENED') return {
      container: 'border-red-200 bg-red-50/50',
      text: 'text-red-500',
      icon: 'text-red-500'
    };
    return {
      container: 'border-slate-200 bg-slate-50/50',
      text: 'text-slate-500',
      icon: 'text-slate-400'
    };
  };

  const getIcon = (v: string) => {
    if (v === 'IMPROVED') return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
    if (v === 'WORSENED') return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
    return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>;
  }

  const styles = report ? getVerdictStyles(report.verdict) : { container: '', text: '', icon: '' };

  return (
    <div className="space-y-8">
      {/* Image Selection Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Baseline</label>
          <div className="relative aspect-square rounded-[24px] overflow-hidden glass-card p-1.5 shadow-sm">
            <img src={entries[idx1].imageData} className="w-full h-full object-cover rounded-[18px]" />
            <select 
              value={idx1} 
              onChange={(e) => setIdx1(Number(e.target.value))}
              className="absolute bottom-2 left-2 right-2 p-1.5 text-[9px] font-bold rounded-lg bg-white/80 backdrop-blur-md text-slate-900 border border-white shadow-sm focus:outline-none appearance-none text-center"
            >
              {entries.map((e, i) => <option key={e.id} value={i}>{new Date(e.timestamp).toLocaleDateString()}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Current</label>
          <div className="relative aspect-square rounded-[24px] overflow-hidden glass-card p-1.5 shadow-sm">
            <img src={entries[idx2].imageData} className="w-full h-full object-cover rounded-[18px]" />
            <select 
              value={idx2} 
              onChange={(e) => setIdx2(Number(e.target.value))}
              className="absolute bottom-2 left-2 right-2 p-1.5 text-[9px] font-bold rounded-lg bg-white/80 backdrop-blur-md text-slate-900 border border-white shadow-sm focus:outline-none appearance-none text-center"
            >
              {entries.map((e, i) => <option key={e.id} value={i}>{new Date(e.timestamp).toLocaleDateString()}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Compare Button */}
      <button 
        onClick={handleCompare}
        disabled={loading || idx1 === idx2}
        className={`w-full h-14 rounded-[20px] liquid-glass-btn flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg ${
          loading ? 'opacity-70 cursor-not-allowed' : 'text-slate-800'
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
            <span className="font-bold text-[12px] uppercase tracking-widest">Analyzing...</span>
          </div>
        ) : (
          <span className="font-black text-[12px] uppercase tracking-widest">Analyze Progression</span>
        )}
      </button>

      {/* LIQUID GLASS REPORT CARD */}
      {report && (
        <div className="glass-card p-8 rounded-[40px] shadow-2xl border border-white/60 relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          {/* Ambient Glow Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 blur-[80px] rounded-full pointer-events-none -mr-32 -mt-32" />

          {/* Verdict Header */}
          <div className="flex items-center gap-5 mb-8 relative z-10">
            <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border-2 shadow-sm backdrop-blur-md ${styles.container} ${styles.icon}`}>
               {getIcon(report.verdict)}
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Verdict</h3>
              <p className={`text-[22px] font-black uppercase tracking-tight leading-none ${styles.text}`}>
                {report.verdict}
              </p>
            </div>
          </div>

          {/* Observable Changes List */}
          <div className="mb-8 relative z-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-1">Observable Changes</h4>
            <div className="space-y-3">
              {report.changes.map((change, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="w-6 h-6 rounded-full bg-white/60 border border-white shadow-sm flex items-center justify-center mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-[14px] text-slate-700 font-bold leading-relaxed">{change}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendation Box - Glassy & Floating */}
          <div className="relative z-10 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md rounded-[28px] p-6 border border-white/60 shadow-lg">
             <div className="flex items-center gap-2 mb-3">
               <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
               <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Recommendation</h4>
             </div>
             <p className="text-[13px] text-slate-600 font-bold leading-relaxed">
               {report.recommendation}
             </p>
          </div>

        </div>
      )}
    </div>
  );
};

export default ProgressionCompare;
