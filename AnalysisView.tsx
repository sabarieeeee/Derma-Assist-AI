
import React, { useState } from 'react';
import { SkinAnalysis, DetailCategory } from './types';

interface NavCardProps {
  title: string;
  icon: React.ReactNode;
  points: string[];
  onClick: () => void;
}

const NavCard: React.FC<NavCardProps> = ({ title, icon, points, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full text-left bg-white p-5 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-indigo-300 transition-all group"
  >
    <div className="flex items-center gap-4 mb-3">
      <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
        {icon}
      </div>
      <h4 className="font-bold text-slate-800">{title}</h4>
    </div>
    <ul className="space-y-1 mb-3">
      {points.slice(0, 3).map((p, i) => (
        <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
          <span className="text-indigo-400">•</span> {p}
        </li>
      ))}
    </ul>
    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-500">Tap to view more details</span>
  </button>
);

const DetailModal: React.FC<{ category: DetailCategory; analysis: SkinAnalysis; onClose: () => void }> = ({ category, analysis, onClose }) => {
  if (!category) return null;

  let content: string[] = [];
  let title = category;

  switch(category) {
    case 'Symptoms': content = analysis.symptoms; break;
    case 'Causes': content = analysis.reasons; break;
    case 'Care & Precautions': content = [...analysis.precautions, ...analysis.prevention]; break;
    case 'Healing & Tracking': content = [analysis.healingPeriod || 'Standard recovery time', ...analysis.treatments]; break;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">&times;</button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {content.map((item, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-700 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl">Close</button>
        </div>
      </div>
    </div>
  );
};

const AnalysisView: React.FC<{ analysis: SkinAnalysis }> = ({ analysis }) => {
  const [selectedCategory, setSelectedCategory] = useState<DetailCategory>(null);

  if (!analysis.isSkin) {
    return (
      <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-amber-900 mb-2">Non-Skin Image Detected</h3>
        <p className="text-amber-700">The AI could not identify human skin in this photo. Please upload a clear image focusing on the affected skin area.</p>
      </div>
    );
  }

  if (analysis.isHealthy) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] text-center">
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-xl font-bold text-emerald-900 mb-2">Healthy Skin</h3>
        <p className="text-emerald-700">Your skin appears healthy based on visual inspection. No significant rashes or diseases were detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2 block">Detected Condition</span>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{analysis.diseaseName}</h2>
        <p className="text-slate-500 leading-relaxed max-w-md mx-auto">{analysis.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NavCard 
          title="Symptoms" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          points={analysis.symptoms}
          onClick={() => setSelectedCategory('Symptoms')}
        />
        <NavCard 
          title="Causes" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.282a2 2 0 01-1.808 0l-.628-.282a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l-.34.34a2 2 0 000 2.828l1.245 1.245A9 9 0 0021 13V4a2 2 0 00-2-2H5a2 2 0 00-2-2v9a9 9 0 005.182 8.12l1.245-1.245a2 2 0 000-2.828l-.34-.34z" /></svg>}
          points={analysis.reasons}
          onClick={() => setSelectedCategory('Causes')}
        />
        <NavCard 
          title="Care & Precautions" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
          points={analysis.precautions}
          onClick={() => setSelectedCategory('Care & Precautions')}
        />
        <NavCard 
          title="Healing & Tracking" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          points={[analysis.healingPeriod || 'Standard Recovery']}
          onClick={() => setSelectedCategory('Healing & Tracking')}
        />
      </div>

      <div className="bg-slate-100 p-6 rounded-3xl text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
          Medical Disclaimer: This AI diagnostic tool is for educational guidance only and does not replace professional medical advice or clinical diagnosis.
        </p>
      </div>

      <DetailModal 
        category={selectedCategory} 
        analysis={analysis} 
        onClose={() => setSelectedCategory(null)} 
      />
    </div>
  );
};

export default AnalysisView;
