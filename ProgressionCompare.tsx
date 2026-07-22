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

  return (
    <div className="space-y-8">
      {/* Dual Scan Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <span className="font-geist text-xs font-medium uppercase tracking-widest text-[#c8f542] block text-center">
            Baseline Scan (Older)
          </span>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden coincompass-glass-card p-2 group">
            <img src={entries[idx1].imageData} className="w-full h-full object-cover rounded-xl" alt="Baseline" />
            <select 
              value={idx1} 
              onChange={(e) => setIdx1(Number(e.target.value))}
              className="absolute bottom-4 left-4 right-4 p-2.5 font-geist text-xs font-semibold rounded-full bg-[#0a2a12]/90 text-white border border-white/20 focus:outline-none cursor-pointer text-center"
            >
              {entries.map((e, i) => (
                <option key={e.id} value={i}>
                  {e.label} • {new Date(e.timestamp).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <span className="font-geist text-xs font-medium uppercase tracking-widest text-[#c8f542] block text-center">
            Current Scan (Newer)
          </span>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden coincompass-glass-card p-2 group">
            <img src={entries[idx2].imageData} className="w-full h-full object-cover rounded-xl" alt="Current" />
            <select 
              value={idx2} 
              onChange={(e) => setIdx2(Number(e.target.value))}
              className="absolute bottom-4 left-4 right-4 p-2.5 font-geist text-xs font-semibold rounded-full bg-[#0a2a12]/90 text-white border border-white/20 focus:outline-none cursor-pointer text-center"
            >
              {entries.map((e, i) => (
                <option key={e.id} value={i}>
                  {e.label} • {new Date(e.timestamp).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleCompare}
        disabled={loading || idx1 === idx2}
        className={`w-full py-4 coincompass-action-btn uppercase tracking-wider text-xs flex items-center justify-center gap-3 ${
          loading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-[#12300f] border-t-transparent rounded-full animate-spin" />
            <span>Benchmarking Progression...</span>
          </div>
        ) : (
          <span>Analyze Progression Benchmark</span>
        )}
      </button>

      {/* Comparison Report Box */}
      {report && (
        <div className="coincompass-glass-card p-8 sm:p-10 rounded-[28px] relative overflow-hidden animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <span className="font-geist text-[11px] font-medium tracking-widest text-white/60 uppercase block mb-1">
                Progression Analysis Result
              </span>
              <h4 className="font-geist font-semibold text-2xl uppercase tracking-tight text-white">
                {report.verdict === 'MISMATCH' ? 'Non-Comparable Patterns' : report.verdict}
              </h4>
            </div>
            <span className="coincompass-tag-badge px-4 py-1.5 font-semibold text-xs uppercase">
              {report.verdict}
            </span>
          </div>

          <div className="space-y-6 font-inter text-xs text-white/80">
            <div>
              <h5 className="font-geist text-xs font-semibold text-[#c8f542] uppercase tracking-wider mb-3">
                Key Visual Benchmark Differences
              </h5>
              <div className="space-y-3">
                {report.changes.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-[#c8f542] mt-1.5 shrink-0" />
                    <p className="leading-relaxed">{c}</p>
                  </div>
                ))}
              </div>
            </div>

            {report.recommendation && (
              <div className="p-5 rounded-xl bg-[#c8f542]/10 border border-[#c8f542]/30">
                <span className="font-geist text-[11px] font-semibold text-[#c8f542] uppercase tracking-wider block mb-1">
                  Clinical Recommendation
                </span>
                <p className="font-inter text-white font-medium leading-relaxed">
                  {report.recommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressionCompare;
