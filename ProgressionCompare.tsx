import React, { useState, useEffect } from 'react';
import { TimelineEntry } from './types'; // Fixed: removed ".."
import { compareProgression } from './geminiService'; // Fixed: removed ".."

interface ProgressionCompareProps {
  entries: TimelineEntry[];
}

const ProgressionCompare: React.FC<ProgressionCompareProps> = ({ entries }) => {
  const [idx1, setIdx1] = useState(0);
  const [idx2, setIdx2] = useState(entries.length - 1);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (idx1 === idx2) return;
    setLoading(true);
    try {
      const result = await compareProgression(entries[idx1].imageData, entries[idx2].imageData);
      setReport(result);
    } catch (e) {
      setReport("Comparison failed. Please try again with clearer photos.");
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

  if (entries.length < 2) return (
    <div className="text-center py-20 px-8 glass-card rounded-[40px] border border-white border-dashed">
      <div className="w-16 h-16 bg-white/60 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] leading-relaxed">Capture at least two photos to track evolution.</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-16">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Baseline</label>
          <div className="relative aspect-square rounded-[28px] overflow-hidden glass-card p-2 shadow-lg">
            <img src={entries[idx1].imageData} className="w-full h-full object-cover rounded-[20px]" />
            <select 
              value={idx1} 
              onChange={(e) => setIdx1(Number(e.target.value))}
              className="absolute bottom-3 left-3 right-3 p-2 text-[10px] font-black rounded-xl bg-white/70 backdrop-blur-md text-slate-900 border border-white shadow-xl focus:outline-none appearance-none text-center"
            >
              {entries.map((e, i) => <option key={e.id} value={i}>{new Date(e.timestamp).toLocaleDateString()}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Current</label>
          <div className="relative aspect-square rounded-[28px] overflow-hidden glass-card p-2 shadow-lg">
            <img src={entries[idx2].imageData} className="w-full h-full object-cover rounded-[20px]" />
            <select 
              value={idx2} 
              onChange={(e) => setIdx2(Number(e.target.value))}
              className="absolute bottom-3 left-3 right-3 p-2 text-[10px] font-black rounded-xl bg-white/70 backdrop-blur-md text-slate-900 border border-white shadow-xl focus:outline-none appearance-none text-center"
            >
              {entries.map((e, i) => <option key={e.id} value={i}>{new Date(e.timestamp).toLocaleDateString()}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button 
        onClick={handleCompare}
        disabled={loading || idx1 === idx2}
        className={`w-full h-16 rounded-[24px] liquid-glass-btn flex items-center justify-center gap-3 transition-all duration-400 active:scale-[0.96] shadow-xl ${
          loading ? 'opacity-60 cursor-not-allowed' : 'text-slate-800'
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
            <span className="font-extrabold text-[13px] uppercase tracking-widest">Comparing</span>
          </div>
        ) : (
          <span className="font-extrabold text-[14px] uppercase tracking-widest">Analyze Progress</span>
        )}
      </button>

      {report && (
        <div className="glass-card p-8 rounded-[36px] animate-in fade-in duration-800 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <h3 className="text-[16px] font-black text-slate-900 tracking-tight uppercase">Progress Log</h3>
          </div>
          <p className="text-[14px] text-slate-600 font-bold leading-relaxed">{report}</p>
        </div>
      )}
    </div>
  );
};

export default ProgressionCompare;
