
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
      className={`relative w-full h-16 overflow-hidden rounded-[24px] border backdrop-blur-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${
        primary 
          ? 'bg-slate-900/90 border-slate-800 text-white' 
          : 'bg-white/40 border-white/80 text-slate-900'
      }`}
    >
      {/* Gloss effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
      
      {isLoading ? (
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      ) : (
        <span className="font-bold text-[16px] tracking-tight">{text}</span>
      )}
    </button>
  );
};

export default LiquidButton;
