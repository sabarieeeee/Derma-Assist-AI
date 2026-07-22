import React, { useState } from 'react';
import Logo from './Logo';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      const userObj = { email, name: name || email.split('@')[0], isLoggedIn: true, token: 'demo_jwt_' + Date.now() };
      localStorage.setItem('derm_user', JSON.stringify(userObj));
      onSuccess(email);
    }
  };

  const handleSocialAuth = (provider: string) => {
    const mockEmail = `${provider.toLowerCase()}.user@dermaassist.ai`;
    const userObj = { email: mockEmail, name: `${provider} User`, isLoggedIn: true, token: 'demo_jwt_' + Date.now() };
    localStorage.setItem('derm_user', JSON.stringify(userObj));
    onSuccess(mockEmail);
  };

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#041408]/90 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md liquid-glass-card p-8 sm:p-10 rounded-[28px] shadow-2xl relative animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Logo size={24} />
              <span className="font-geist text-xs font-semibold text-white tracking-tight">Derma Assist AI</span>
            </div>
            <h3 className="font-geist font-semibold text-2xl text-white">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 flex items-center justify-center font-bold text-lg transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-white/5 border border-white/10 mb-6 font-geist text-xs">
          <button 
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`py-2 rounded-full font-medium transition-all ${!isSignUp ? 'bg-white text-[#12300f] shadow-sm' : 'text-white/70 hover:text-white'}`}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`py-2 rounded-full font-medium transition-all ${isSignUp ? 'bg-white text-[#12300f] shadow-sm' : 'text-white/70 hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>

        {/* Social Authentication Buttons */}
        <div className="space-y-3 mb-6 font-geist text-xs">
          <button 
            type="button"
            onClick={() => handleSocialAuth('Google')}
            className="w-full p-3.5 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 flex items-center justify-center gap-3 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button 
            type="button"
            onClick={() => handleSocialAuth('Apple')}
            className="w-full p-3.5 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 flex items-center justify-center gap-3 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.12-1.96.99-3.1-.97.04-2.15.65-2.85 1.47-.63.73-1.18 1.9-.1 0 3.06 1.08-.04 2.16-.67 2.86-1.43z"/>
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-geist text-[10px] text-white/40 uppercase tracking-widest">Or Email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-geist text-xs">
          {isSignUp && (
            <div>
              <label className="block text-white/70 font-medium mb-1">Full Name</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c8f542]"
              />
            </div>
          )}

          <div>
            <label className="block text-white/70 font-medium mb-1">Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@derma-assist.ai"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c8f542]"
            />
          </div>

          <div>
            <label className="block text-white/70 font-medium mb-1">Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c8f542]"
            />
          </div>

          {!isSignUp && (
            <div className="flex justify-between items-center text-white/60 text-[11px] pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-[#c8f542]" />
                <span>Remember me</span>
              </label>
              <a href="#" className="hover:text-[#c8f542] transition-colors">Forgot Password?</a>
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-3.5 rounded-full font-medium text-[#12300f] hover:brightness-105 transition-all uppercase tracking-wider text-xs mt-6"
            style={{ backgroundColor: '#c8f542', boxShadow: '0 8px 24px -6px rgba(200,245,66,0.4)' }}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
