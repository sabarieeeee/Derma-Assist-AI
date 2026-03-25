import React, { useState } from 'react';
import { SkinAnalysis, DetailCategory, AnalysisPoint } from './types';

interface NavCardProps {
  title: string;
  icon: React.ReactNode;
  points: (string | AnalysisPoint)[];
  onClick: () => void;
}

const NavCard: React.FC<NavCardProps> = ({ title, icon, points, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full text-left bg-white dark:bg-white/5 p-5 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/10 hover:border-indigo-300 dark:hover:border-amber-500/50 transition-all group"
  >
    <div className="flex items-center gap-4 mb-3">
      <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-amber-500/10 group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      <h4 className="font-bold text-slate-800 dark:text-slate-200">{title}</h4>
    </div>
    <ul className="space-y-1 mb-3">
      {points && points.slice(0, 3).map((p, i) => (
        <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <span className="text-indigo-400 dark:text-amber-500/60">•</span> 
          <span className="line-clamp-1">
            {typeof p === 'string' ? p : p.title}
          </span>
        </li>
      ))}
    </ul>
    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-amber-500/80 transition-colors">Tap to view</span>
  </button>
);

const DetailModal: React.FC<{ category: DetailCategory; analysis: SkinAnalysis; onClose: () => void }> = ({ category, analysis, onClose }) => {
  if (!category) return null;

  let content: (string | AnalysisPoint)[] = [];
  let title = category;

  switch(category) {
    case 'Symptoms': content = analysis.symptoms || []; break;
    case 'Causes': content = analysis.reasons || []; break;
    case 'Care & Precautions': content = [...(analysis.precautions || []), ...(analysis.prevention || [])]; break;
    case 'Healing & Tracking': 
      content = [...(analysis.treatments || [])];
      if (analysis.healingPeriod) {
         content.unshift({ title: "Estimated Recovery", details: analysis.healingPeriod });
      }
      break;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-transparent dark:border-white/10 animate-in slide-in-from-bottom-10 duration-500">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">&times;</button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {content.map((item, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
              {typeof item === 'string' ? (
                 <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</p>
              ) : (
                 <>
                   <p className="text-[15px] text-slate-800 dark:text-slate-200 font-black leading-tight mb-2">{item.title}</p>
                   <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.details}</p>
                 </>
              )}
            </div>
          ))}
          {content.length === 0 && (
             <p className="text-slate-500 dark:text-slate-500 text-center italic">No details available.</p>
          )}
        </div>
        <div className="mt-8">
          <button onClick={onClose} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

const AnalysisView: React.FC<{ analysis: SkinAnalysis }> = ({ analysis }) => {
  const [selectedCategory, setSelectedCategory] = useState<DetailCategory>(null);

  if (!analysis.isSkin) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 p-8 rounded-[2.5rem] text-center transition-colors duration-500">
        <div className="text-4xl mb-4 dark:opacity-80">⚠️</div>
        <h3 className="text-xl font-bold text-amber-900 dark:text-amber-500 mb-2">Non-Skin Image Detected</h3>
        <p className="text-amber-700 dark:text-amber-200/60">The AI could not identify human skin in this photo. Please upload a clear image focusing on the affected skin area.</p>
      </div>
    );
  }

  if (analysis.isHealthy) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 p-8 rounded-[2.5rem] text-center transition-colors duration-500">
        <div className="text-4xl mb-4 dark:opacity-80">✨</div>
        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-400 mb-2">Healthy Skin</h3>
        <p className="text-emerald-700 dark:text-emerald-200/60">Your skin appears healthy based on visual inspection. No significant rashes or diseases were detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/10 text-center relative overflow-hidden transition-colors duration-500">
        <div className="hidden dark:block absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
        <span className="text-[10px] font-bold text-indigo-500 dark:text-amber-500 uppercase tracking-widest mb-2 block">Detected Condition</span>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 dark:drop-shadow-md">{analysis.diseaseName}</h2>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">{analysis.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NavCard 
          title="Symptoms" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          points={analysis.symptoms || []}
          onClick={() => setSelectedCategory('Symptoms')}
        />
        <NavCard 
          title="Causes" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.282a2 2 0 01-1.808 0l-.628-.282a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l-.34.34a2 2 0 000 2.828l1.245 1.245A9 9 0 0021 13V4a2 2 0 00-2-2H5a2 2 0 00-2-2v9a9 9 0 005.182 8.12l1.245-1.245a2 2 0 000-2.828l-.34-.34z" /></svg>}
          points={analysis.reasons || []}
          onClick={() => setSelectedCategory('Causes')}
        />
        <NavCard 
          title="Care & Precautions" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
          points={analysis.precautions || []}
          onClick={() => setSelectedCategory('Care & Precautions')}
        />
        <NavCard 
          title="Healing & Tracking" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          points={analysis.healingPeriod ? [analysis.healingPeriod] : []}
          onClick={() => setSelectedCategory('Healing & Tracking')}
        />
      </div>

      <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-3xl text-center border border-transparent dark:border-white/5 transition-colors duration-500">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-loose">
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
