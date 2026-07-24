import React, { useState } from 'react';
import Logo from './Logo';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (email: string, name: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const finalName = name || email.split('@')[0];
        onSuccess(userCredential.user.email!, finalName);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onSuccess(userCredential.user.email!, email.split('@')[0]);
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onSuccess(result.user.email!, result.user.displayName || result.user.email!.split('@')[0]);
    } catch (err: any) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#041408]/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0a2a12] border border-[#1d4a25] p-8 sm:p-10 rounded-[28px] shadow-2xl relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Logo size={24} />
              <span className="font-geist text-xs font-semibold text-white tracking-tight">Derma Assist AI</span>
            </div>
            <h3 className="font-geist font-semibold text-2xl text-white">{isSignUp ? 'Create Account' : 'Welcome Back'}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-white/5 border border-white/10 mb-6 font-geist text-xs">
          <button type="button" onClick={() => setIsSignUp(false)} className={`py-2 rounded-full font-medium transition-all ${!isSignUp ? 'bg-[#c8f542] text-[#12300f] shadow-sm' : 'text-white/70 hover:text-white'}`}>Sign In</button>
          <button type="button" onClick={() => setIsSignUp(true)} className={`py-2 rounded-full font-medium transition-all ${isSignUp ? 'bg-[#c8f542] text-[#12300f] shadow-sm' : 'text-white/70 hover:text-white'}`}>Sign Up</button>
        </div>

        <button type="button" onClick={handleGoogleAuth} disabled={loading} className="w-full p-3.5 mb-6 rounded-full bg-white text-[#12300f] font-semibold hover:bg-white/90 flex items-center justify-center gap-3 transition-all font-geist text-xs">
          <iconify-icon icon="logos:google-icon" width="16"></iconify-icon>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-geist text-[10px] text-white/40 uppercase tracking-widest">Or Email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {error && <p className="text-red-400 text-[11px] mb-4 text-center font-geist p-2 bg-red-500/10 rounded-lg border border-red-500/20">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 font-geist text-xs">
          {isSignUp && (
            <div>
              <label className="block text-white/70 font-medium mb-1">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter Your Full Name" className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#c8f542] outline-none" />
            </div>
          )}
          <div>
            <label className="block text-white/70 font-medium mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter Your Email Address" className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#c8f542] outline-none" />
          </div>
          <div>
            <label className="block text-white/70 font-medium mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter Your Password" className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#c8f542] outline-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-full font-bold text-[#12300f] hover:scale-[1.02] transition-all uppercase tracking-wider text-xs mt-6" style={{ backgroundColor: '#c8f542' }}>
            {loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;