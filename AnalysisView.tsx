import React from 'react';
import { SkinAnalysis } from './types';

interface AnalysisViewProps {
  analysis: SkinAnalysis;
  selectedImage?: string | null;
}

export default function AnalysisView({ analysis, selectedImage }: AnalysisViewProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 font-geist animate-in fade-in duration-300">
      
      {/* Header & Image Section */}
      <div className="liquid-glass-card rounded-[28px] p-6 sm:p-8 flex flex-col md:flex-row gap-6 lg:gap-8 items-start border border-white/10 shadow-2xl">
        {selectedImage && (
          <img 
            src={selectedImage} 
            alt="Scanned telemetry" 
            className="w-full md:w-56 aspect-[4/3] md:aspect-square object-cover rounded-2xl shadow-lg border border-white/10" 
          />
        )}
        <div className="flex-1">
          <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-semibold text-[#c8f542] uppercase tracking-wider mb-3" style={{ border: '1px solid rgba(200,245,66,0.35)', background: 'rgba(200,245,66,0.06)' }}>
            <iconify-icon icon="solar:scanner-linear" width="14"></iconify-icon>
            Pattern Detected
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            {analysis.diseaseName}
          </h2>
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            {analysis.overview}
          </p>
          
          <div className="flex items-center gap-4 bg-black/20 rounded-xl p-3.5 border border-white/10 w-fit">
            <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Severity</span>
            <div className="flex gap-1.5">
              {/* Added explicit typing to 'i' here */}
              {[1, 2, 3, 4, 5].map((i: number) => (
                <div 
                  key={i} 
                  className={`w-8 h-1.5 rounded-full transition-colors ${i <= analysis.severityLevel ? 'bg-[#c8f542] shadow-[0_0_10px_rgba(200,245,66,0.4)]' : 'bg-white/10'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        
        {analysis.causes && analysis.causes.length > 0 && (
          <div className="liquid-glass-card rounded-[24px] p-6 border border-white/10">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#c8f542]/20 flex items-center justify-center">
                <iconify-icon icon="solar:virus-linear" width="16" style={{ color: '#c8f542' }}></iconify-icon>
              </span>
              Causes & Triggers
            </h3>
            <ul className="space-y-3">
              {/* Added explicit typing to 's' and 'i' here */}
              {analysis.causes.map((s: string, i: number) => (
                <li key={i} className="text-sm text-white/70 flex items-start gap-3 leading-relaxed">
                  <span className="text-[#c8f542] mt-0.5 text-lg">•</span> <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.precautions && analysis.precautions.length > 0 && (
          <div className="liquid-glass-card rounded-[24px] p-6 border border-white/10">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#c8f542]/20 flex items-center justify-center">
                <iconify-icon icon="solar:shield-warning-linear" width="16" style={{ color: '#c8f542' }}></iconify-icon>
              </span>
              Precautions
            </h3>
            <ul className="space-y-3">
              {/* Added explicit typing to 's' and 'i' here */}
              {analysis.precautions.map((s: string, i: number) => (
                <li key={i} className="text-sm text-white/70 flex items-start gap-3 leading-relaxed">
                  <span className="text-[#c8f542] mt-0.5 text-lg">•</span> <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="liquid-glass-card rounded-[24px] p-6 border border-white/10 md:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#c8f542]/20 flex items-center justify-center">
                <iconify-icon icon="solar:medical-kit-linear" width="16" style={{ color: '#c8f542' }}></iconify-icon>
              </span>
              Care Protocol & Recommendations
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Added explicit typing to 's' and 'i' here */}
              {analysis.recommendations.map((s: string, i: number) => (
                <li key={i} className="text-sm text-white/70 flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 leading-relaxed">
                  <span className="text-[#c8f542] font-bold mt-0.5 text-base">✓</span> <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}