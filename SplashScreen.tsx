import React from 'react';
import Logo from './Logo';

interface SplashScreenProps {
  fadeOut: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ fadeOut }) => {
  return (
    <div 
      className={`fixed inset-0 z-[300] flex flex-col justify-between items-center py-20 px-6 transition-all duration-700 select-none ${
        fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'linear-gradient(180deg, #031006 0%, #0a2a12 50%, #0a2610 100%)'
      }}
    >
      {/* Top Spacer */}
      <div className="w-full" />

      {/* Center Branding */}
      <div className="flex flex-col items-center justify-center text-center -mt-6">
        <div className="mb-6 p-4 rounded-3xl bg-[#c8f542]/10 border border-[#c8f542]/30 shadow-[0_0_50px_rgba(200,245,66,0.2)] animate-pulse">
          <Logo size={48} />
        </div>

        <h1 className="text-3xl sm:text-5xl font-geist font-extrabold text-white tracking-[0.2em] uppercase leading-tight mb-2">
          DERMA ASSIST AI
        </h1>

        <div className="h-0.5 w-16 bg-[#c8f542] my-4 rounded-full" />

        <p className="text-xs sm:text-sm font-geist font-medium text-[#c8f542] uppercase tracking-[0.35em]">
          INTELLIGENT SKIN HEALTH TELEMETRY
        </p>
      </div>

      {/* Bottom Footer */}
      <div className="text-center space-y-1.5">
        <p className="text-xs font-geist font-semibold text-white/60 uppercase tracking-[0.25em]">
          COPYRIGHT © 2026 • DERMA ASSIST LABS
        </p>
        <p className="text-[10px] font-geist font-bold text-[#c8f542] uppercase tracking-[0.3em]">
          SYSTEM ACTIVE • V3.3.0
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
