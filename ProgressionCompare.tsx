import React, { useState, useEffect } from 'react';
import { TimelineEntry, ComparisonResult } from './types';
import { compareProgression } from './geminiService'; 

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

  // Handles styling for Light & Dark mode states
  const getVerdictStyles = (v: string) => {
    if (v === 'IMPROVED') return {
      container: 'border-green-200 bg-green-50/50 dark:border-green-500/20 dark:bg-green-900/10',
      text: 'text-green-600 dark:text-green-400',
      icon: 'text-green-500 dark:text-green-400'
    };
    if (v === 'WORSENED') return {
      container: 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-900/10',
      text: 'text-red-500 dark:text-red-400',
      icon: 'text-red-500 dark:text-red-400'
    };
    if (v === 'MISMATCH') return {
      container: 'border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-900/10',
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'text-amber-500 dark:text-amber-400'
    };
    return {
      container: 'border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-white/5',
      text: 'text-slate-500 dark:text-slate-400',
      icon: 'text-slate-400 dark:text-slate-500'
    };
  };

  const getIcon = (v: string) => {
    if (v === 'IMPROVED') return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
    if (v === 'WORSENED') return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
    if (v === 'MISMATCH') return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>;
  }

  const styles = report ? getVerdictStyles(report.verdict) : { container: '', text: '', icon: '' };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-center">Baseline</label>
          <div className="relative aspect-square rounded-[24px] overflow-hidden glass-card dark:bg-white/5 dark:border-white/5 p-1.5 shadow-sm transition-colors duration-500">
            <img src={entries[idx1].imageData} className="w-full h-full object-cover rounded-[18px] dark:opacity-80" />
            <select 
              value={idx1} 
              onChange={(e) => setIdx1(Number(e.target.value))}
              className="absolute bottom-2 left-2 right-2 p-1.5 text-[9px] font-bold rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-md text-slate-900 dark:text-white border border-white dark:border-white/10 shadow-sm dark:shadow-lg focus:outline-none appearance-none text-center transition-colors"
            >
              {entries.map((e, i) => <option key={e.id} value={i} className="dark:bg-black">{new Date(e.timestamp).toLocaleDateString()}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-center">Current</label>
          <div className="relative aspect-square rounded-[24px] overflow-hidden glass-card dark:bg-white/5 dark:border-white/5 p-1.5 shadow-sm transition-colors duration-500">
            <img src={entries[idx2].imageData} className="w-full h-full object-cover rounded-[18px] dark:opacity-80" />
            <select 
              value={idx2} 
              onChange={(e) => setIdx2(Number(e.target.value))}
              className="absolute bottom-2 left-2 right-2 p-1.5 text-[9px] font-bold rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-md text-slate-900 dark:text-white border border-white dark:border-white/10 shadow-sm dark:shadow-lg focus:outline-none appearance-none text-center transition-colors"
            >
              {entries.map((e, i) => <option key={e.id} value={i} className="dark:bg-black">{new Date(e.timestamp).toLocaleDateString()}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button 
        onClick={handleCompare}
        disabled={loading || idx1 === idx2}
        className={`w-full h-14 rounded-[20px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg border ${
          loading 
            ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-white/5 border-transparent dark:border-white/5 text-slate-400 dark:text-slate-500' 
            : 'bg-white/40 dark:bg-white/5 border-white/80 dark:border-white/10 text-slate-800 dark:text-white hover:bg-white/60 dark:hover:bg-white/10'
        } backdrop-blur-md`}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-400 dark:border-slate-500 border-t-slate-800 dark:border-t-white rounded-full animate-spin" />
            <span className="font-bold text-[12px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Analyzing...</span>
          </div>
        ) : (
          <span className="font-black text-[12px] uppercase tracking-widest">Analyze Progression</span>
        )}
      </button>

      {report && (
        <div className="glass-card dark:bg-white/5 p-8 rounded-[40px] shadow-2xl border border-white/60 dark:border-white/10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 transition-colors duration-500">
          
          <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full pointer-events-none -mr-32 -mt-32 ${
            report.verdict === 'IMPROVED' ? 'bg-green-400/20' : 
            report.verdict === 'WORSENED' ? 'bg-red-400/20' : 'bg-blue-400/10 dark:bg-amber-500/20'
          }`} />

          {/* Verdict Header */}
          <div className="flex items-center gap-5 mb-8 relative z-10">
            <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border-2 shadow-sm backdrop-blur-md transition-colors ${styles.container} ${styles.icon}`}>
               {getIcon(report.verdict)}
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">AI Verdict</h3>
              <p className={`text-[22px] font-black uppercase tracking-tight leading-none transition-colors ${styles.text}`}>
                {report.verdict === 'MISMATCH' ? 'Not Comparable' : report.verdict}
              </p>
            </div>
          </div>

          {/* Observable Changes List */}
          <div className="mb-8 relative z-10">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 pl-1">
               {report.verdict === 'MISMATCH' ? 'Analysis Notes' : 'Observable Changes'}
            </h4>
            <div className="space-y-3">
              {report.changes.map((change, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className={`w-6 h-6 rounded-full bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 shadow-sm flex items-center justify-center mt-0.5 shrink-0 ${report.verdict === 'MISMATCH' ? 'text-amber-500' : 'text-blue-500 dark:text-amber-500'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-[14px] text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{change}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation Box */}
          <div className={`relative z-10 backdrop-blur-md rounded-[28px] p-6 border shadow-lg transition-colors ${
              report.verdict === 'MISMATCH' 
                ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-500/20' 
                : 'bg-gradient-to-br from-white/60 to-white/30 border-white/60 dark:from-black/40 dark:to-black/20 dark:border-white/5'
            }`}>
             <div className="flex items-center gap-2 mb-3">
               <svg className={`w-4 h-4 ${report.verdict === 'MISMATCH' ? 'text-amber-500' : 'text-blue-500 dark:text-amber-500'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
               <h4 className={`text-[10px] font-black uppercase tracking-widest ${report.verdict === 'MISMATCH' ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-amber-500'}`}>Recommendation</h4>
             </div>
             <p className="text-[13px] text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
               {report.recommendation}
             </p>
          </div>

        </div>
      )}
    </div>
  );
};

export default ProgressionCompare;
