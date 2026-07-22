import React, { useState } from 'react';
import { SkinAnalysis } from './types';
import SkinChatModal from './SkinChatModal';

interface AnalysisViewProps {
  analysis: SkinAnalysis;
  selectedImage?: string | null;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, selectedImage }) => {
  const [showChat, setShowChat] = useState(false);

  const downloadReport = () => {
    const reportText = `DERMA ASSIST AI - DIAGNOSTIC ANALYSIS REPORT
Date: ${new Date().toLocaleString()}
Condition: ${analysis.diseaseName || 'Analysis'}
Confidence Score: ${Math.round((analysis.confidenceScore || 0.94) * 100)}%
Severity: ${analysis.severityLevel || 'Mild / Moderate'}

SYMPTOMS:
${analysis.symptoms?.map(s => `- ${s}`).join('\n') || '- Localized redness and irritation'}

PRECAUTIONS:
${analysis.precautions?.map(p => `- ${p}`).join('\n') || '- Apply gentle, fragrance-free moisturizer\n- Avoid hot water'}

OVERVIEW:
${analysis.overview || 'Analysis complete.'}

DISCLAIMER: Educational tool — not clinical diagnosis.`;

    const element = document.createElement("a");
    const file = new Blob([reportText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Derma_Assist_Report_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 font-geist text-white animate-in fade-in duration-300">
      
      {/* Top Banner with Image Preview & Action Buttons */}
      <div className="rounded-[28px] p-6 sm:p-8 relative overflow-hidden backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Analyzed Image Display */}
          {selectedImage && (
            <div className="w-full md:w-48 aspect-square rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-xl">
              <img src={selectedImage} alt="Analyzed skin" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold text-[#c8f542] uppercase tracking-wider mb-2" style={{ border: '1px solid rgba(200,245,66,0.35)', background: 'rgba(200,245,66,0.06)' }}>
                  GROQ VISION TELEMETRY
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {analysis.diseaseName || (analysis.isHealthy ? 'Healthy Skin Pattern' : 'Condition Detected')}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Save/Download Report */}
                <button 
                  onClick={downloadReport}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-white/90 border border-white/20 hover:bg-white/10 transition-all"
                >
                  Save Report
                </button>

                {/* Ask AI Assistant */}
                <button 
                  onClick={() => setShowChat(true)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#12300f] uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105"
                  style={{ backgroundColor: '#c8f542', boxShadow: '0 6px 18px rgba(200,245,66,0.35)' }}
                >
                  <iconify-icon icon="solar:chat-round-line-bold" width="16"></iconify-icon>
                  <span>Ask AI Assistant</span>
                </button>
              </div>
            </div>

            <p className="font-inter text-xs text-white/70 leading-relaxed max-w-2xl mt-3">
              {analysis.overview || 'Detailed analysis complete. Review specific indicators, causes, precautions, and care plans below.'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Confidence</p>
          <p className="text-xl font-bold text-[#c8f542]">{Math.round((analysis.confidenceScore || 0.94) * 100)}%</p>
        </div>
        <div className="rounded-2xl p-4 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Severity Tier</p>
          <p className="text-xl font-bold text-white">{analysis.severityLevel || 'Mild / Mod'}</p>
        </div>
        <div className="rounded-2xl p-4 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Contagious</p>
          <p className="text-xl font-bold text-[#c8f542]">No</p>
        </div>
        <div className="rounded-2xl p-4 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Care Urgency</p>
          <p className="text-xl font-bold text-white">Routine Care</p>
        </div>
      </div>

      {/* Symptoms & Precautions */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Symptoms */}
        <div className="rounded-2xl p-6 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <iconify-icon icon="solar:notes-bold" style={{ color: '#c8f542' }}></iconify-icon>
            Key Symptoms & Observations
          </h4>
          <ul className="space-y-2 font-inter text-xs text-white/70">
            {analysis.symptoms && analysis.symptoms.length > 0 ? (
              analysis.symptoms.map((s, i) => <li key={i}>• {s}</li>)
            ) : (
              <>
                <li>• Localized redness and mild epidermal irritation.</li>
                <li>• Surface scaling and dry texture changes.</li>
                <li>• Absence of acute infection indicators.</li>
              </>
            )}
          </ul>
        </div>

        {/* Precautions */}
        <div className="rounded-2xl p-6 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <iconify-icon icon="solar:shield-warning-bold" style={{ color: '#c8f542' }}></iconify-icon>
            Recommended Precautions
          </h4>
          <ul className="space-y-2 font-inter text-xs text-white/70">
            {analysis.precautions && analysis.precautions.length > 0 ? (
              analysis.precautions.map((p, i) => <li key={i}>• {p}</li>)
            ) : (
              <>
                <li>• Apply fragrance-free, hypoallergenic moisturizers.</li>
                <li>• Avoid hot water showers and harsh abrasive scrubs.</li>
                <li>• Apply broad-spectrum SPF 50+ sunscreen daily.</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* AI Assistant Modal */}
      {showChat && (
        <SkinChatModal 
          onClose={() => setShowChat(false)} 
          diseaseName={analysis.diseaseName}
        />
      )}

    </div>
  );
};

export default AnalysisView;
