import React, { useState, useEffect } from 'react';
import { TimelineEntry, ComparisonResult } from './types';

interface ProgressionCompareProps {
  entries: TimelineEntry[];
  onStartNewScan?: () => void;
}

const ProgressionCompare: React.FC<ProgressionCompareProps> = ({ entries, onStartNewScan }) => {
  const [idx1, setIdx1] = useState(0);
  const [idx2, setIdx2] = useState(entries.length - 1);
  const [report, setReport] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entries.length >= 2) {
      setIdx1(0);
      setIdx2(entries.length - 1);
    }
  }, [entries]);

  const handleCompare = async () => {
    if (idx1 === idx2) return;
    setLoading(true);
    setReport(null);
    
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
      if (!apiKey) throw new Error("Missing API Key");

      // Strict Qwen Integration for Comparison
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'qwen-2.5-32b',
          messages: [
            {
              role: 'system',
              content: 'You are a clinical progression analyzer. Compare the two provided dermatological descriptions/contexts and return a strict JSON output matching this structure: {"verdict": "IMPROVED" | "WORSENED" | "STABLE" | "MISMATCH", "changes": ["change 1", "change 2"], "recommendation": "your recommendation"}'
            },
            {
              role: 'user',
              content: `Baseline Scan Diagnosis: ${entries[idx1].label}. Current Scan Diagnosis: ${entries[idx2].label}. Analyze the progression between these two states.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        })
      });

      if (!response.ok) throw new Error("API Request Failed");
      
      const data = await response.json();
      const parsedResult = JSON.parse(data.choices[0].message.content);
      
      setReport({
        verdict: parsedResult.verdict || 'STABLE',
        changes: parsedResult.changes || ['No significant visual differences detected.'],
        recommendation: parsedResult.recommendation || 'Continue current maintenance routine.'
      });
      
    } catch (e) {
      console.error(e);
      alert("Comparison failed. Ensure your Groq API key is valid and has sufficient quota.");
    } finally {
      setLoading(false);
    }
  };

  // EMPTY STATE UI
  if (entries.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center coincompass-glass-card rounded-3xl border border-white/10 shadow-2xl bg-black/20">
         <iconify-icon icon="solar:scanner-linear" width="48" style={{ color: '#c8f542', marginBottom: '16px' }}></iconify-icon>
         <h3 className="font-geist text-xl font-semibold text-white mb-2">Scan to Compare</h3>
         <p className="font-inter text-sm text-white/50 max-w-md mb-6">You need at least two saved scans in your archive to benchmark progression and generate an AI clinical comparison report.</p>
         {onStartNewScan && (
           <button 
             onClick={onStartNewScan} 
             className="rounded-full px-6 py-3 text-xs font-semibold text-[#12300f] uppercase tracking-wider transition-all hover:scale-105"
             style={{ backgroundColor: '#c8f542', boxShadow: '0 8px 24px -6px rgba(200,245,66,0.4)' }}
           >
             Capture New Scan
           </button>
         )}
      </div>
    );
  }

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
        className={`w-full py-4 coincompass-action-btn uppercase tracking-wider text-xs flex items-center justify-center gap-3 bg-white/10 text-white rounded-full font-geist font-semibold border border-white/20 hover:bg-white/20 transition-all ${
          loading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Benchmarking Progression...</span>
          </div>
        ) : (
          <span>Analyze Progression Benchmark</span>
        )}
      </button>

      {/* Comparison Report Box */}
      {report && (
        <div className="coincompass-glass-card p-8 sm:p-10 rounded-[28px] relative overflow-hidden animate-in fade-in duration-500 bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <span className="font-geist text-[11px] font-medium tracking-widest text-white/60 uppercase block mb-1">
                Progression Analysis Result
              </span>
              <h4 className="font-geist font-semibold text-2xl uppercase tracking-tight text-white">
                {report.verdict === 'MISMATCH' ? 'Non-Comparable Patterns' : report.verdict}
              </h4>
            </div>
            <span className="px-4 py-1.5 font-semibold text-xs uppercase bg-[#c8f542] text-[#12300f] rounded-full tracking-widest">
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