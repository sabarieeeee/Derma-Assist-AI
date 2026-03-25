import React from 'react';

interface LiquidButtonProps {
  text: string;
  onClick: () => void;
  isLoading?: boolean;
  primary?: boolean;
}

const LiquidButton: React.FC<LiquidButtonProps> = ({ text, onClick, isLoading, primary }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`relative w-full h-16 overflow-hidden rounded-[24px] border backdrop-blur-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group ${
        primary 
          ? 'bg-slate-900/90 dark:bg-amber-500 border-slate-800 dark:border-amber-400 text-white dark:text-black dark:hover:bg-amber-400 dark:shadow-[0_0_30px_rgba(245,158,11,0.3)]' 
          : 'bg-white/40 dark:bg-white/5 border-white/80 dark:border-white/10 text-slate-900 dark:text-white dark:hover:bg-white/10'
      }`}
    >
      {/* Gloss effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 dark:from-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {isLoading ? (
        <div className={`w-6 h-6 border-2 rounded-full animate-spin ${primary ? 'border-white/20 border-t-white dark:border-black/20 dark:border-t-black' : 'border-slate-300 border-t-slate-800 dark:border-white/20 dark:border-t-white'}`} />
      ) : (
        <span className="font-bold text-[16px] tracking-tight">{text}</span>
      )}
    </button>
  );
};

export default LiquidButton;
