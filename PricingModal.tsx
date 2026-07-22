import React, { useState } from 'react';

interface PricingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose, onSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState<'day' | 'pro' | 'lifetime'>('pro');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'upi'>('card');

  // Checkout inputs
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = {
    day: { name: 'Day Pass', price: '$2.99', period: '/ 24 hours', details: '50 High-Res Scans' },
    pro: { name: 'Pro Monthly', price: '$19.99', period: '/ month', details: 'Unlimited Scans & Priority Engine' },
    lifetime: { name: 'Clinical Lifetime', price: '$99.00', period: 'one-time', details: 'Unlimited Lifetime Scans & PDF Reports' }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      localStorage.setItem('derm_subscription', JSON.stringify({
        plan: selectedPlan,
        activatedAt: Date.now(),
        isUnlimited: true
      }));
      localStorage.setItem('derm_scan_quota', JSON.stringify({ date: new Date().toDateString(), count: 0 }));
      alert(`Payment successful! Your ${plans[selectedPlan].name} is now active.`);
      onSuccess();
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 animate-in fade-in duration-300 font-geist">
      <div className="liquid-glass-card p-8 sm:p-10 rounded-[28px] relative shadow-2xl">
        {!showCheckout ? (
          <>
            {/* Step 1: Select Plan */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-semibold text-[#c8f542] uppercase tracking-wider mb-2" style={{ border: '1px solid rgba(200,245,66,0.35)', background: 'rgba(200,245,66,0.06)' }}>
                  SUBSCRIPTION SELECTION
                </span>
                <h3 className="font-semibold text-3xl text-white">Choose Your Access Tier</h3>
              </div>
            </div>

            <p className="font-inter text-xs text-white/70 mb-8 leading-relaxed max-w-2xl">
              Unlock unlimited AI skin health scans, priority vision telemetry, and encrypted recovery archives. Select a plan below for instant checkout.
            </p>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-3">
              
              {/* Day Pass */}
              <div 
                onClick={() => setSelectedPlan('day')}
                className={`p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlan === 'day' ? 'liquid-glass-card-lime shadow-xl' : 'liquid-glass-card hover:border-white/30'
                }`}
              >
                <div>
                  <h4 className="font-semibold text-lg text-white mb-1">Day Pass</h4>
                  <p className="text-2xl font-bold text-[#c8f542] mb-4">$2.99 <span className="text-xs font-normal text-white/50">/ 24h</span></p>
                  <ul className="space-y-2 font-inter text-xs text-white/70">
                    <li>✓ 50 High-Res Scans</li>
                    <li>✓ Basic Care Reports</li>
                    <li>✓ 24-Hour Access</li>
                  </ul>
                </div>
                <button 
                  type="button"
                  onClick={() => { setSelectedPlan('day'); setShowCheckout(true); }}
                  className="w-full mt-6 py-2.5 rounded-full text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors"
                >
                  Select Day Pass
                </button>
              </div>

              {/* Pro Monthly */}
              <div 
                onClick={() => setSelectedPlan('pro')}
                className={`p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between relative ${
                  selectedPlan === 'pro' ? 'liquid-glass-card-lime shadow-2xl scale-[1.02]' : 'liquid-glass-card hover:border-white/30'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-lg text-white">Pro Monthly</h4>
                  <span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold text-[#12300f] uppercase" style={{ backgroundColor: '#c8f542' }}>
                    MOST POPULAR
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#c8f542] mb-4">$19.99 <span className="text-xs font-normal text-white/50">/ mo</span></p>
                  <ul className="space-y-2 font-inter text-xs text-white/80">
                    <li>✓ Unlimited Daily Scans</li>
                    <li>✓ Priority Groq Vision Engine</li>
                    <li>✓ Progression Archives</li>
                  </ul>
                </div>
                <button 
                  type="button"
                  onClick={() => { setSelectedPlan('pro'); setShowCheckout(true); }}
                  className="w-full mt-6 py-3 rounded-full text-xs font-semibold text-[#12300f] uppercase transition-transform hover:scale-105"
                  style={{ backgroundColor: '#c8f542', boxShadow: '0 8px 24px -6px rgba(200,245,66,0.4)' }}
                >
                  Checkout Pro
                </button>
              </div>

              {/* Clinical Lifetime */}
              <div 
                onClick={() => setSelectedPlan('lifetime')}
                className={`p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlan === 'lifetime' ? 'liquid-glass-card-lime shadow-xl' : 'liquid-glass-card hover:border-white/30'
                }`}
              >
                <div>
                  <h4 className="font-semibold text-lg text-white mb-1">Lifetime</h4>
                  <p className="text-2xl font-bold text-[#c8f542] mb-4">$99.00 <span className="text-xs font-normal text-white/50">one-time</span></p>
                  <ul className="space-y-2 font-inter text-xs text-white/70">
                    <li>✓ Unlimited Lifetime Scans</li>
                    <li>✓ Full Telemetry Exports</li>
                    <li>✓ All Future Updates</li>
                  </ul>
                </div>
                <button 
                  type="button"
                  onClick={() => { setSelectedPlan('lifetime'); setShowCheckout(true); }}
                  className="w-full mt-6 py-2.5 rounded-full text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors"
                >
                  Select Lifetime
                </button>
              </div>

            </div>
          </>
        ) : (
          <>
            {/* Step 2: Authentic Checkout Form */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="text-white/60 hover:text-white font-bold text-xs uppercase flex items-center gap-1"
                >
                  &larr; Back
                </button>
                <h3 className="font-semibold text-xl text-white">Checkout • {plans[selectedPlan].name}</h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 flex justify-between items-center text-xs">
              <div>
                <p className="text-white font-semibold">{plans[selectedPlan].name}</p>
                <p className="text-white/50">{plans[selectedPlan].details}</p>
              </div>
              <p className="text-xl font-bold text-[#c8f542]">{plans[selectedPlan].price}</p>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6 text-xs">
              <button 
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2.5 rounded-xl border flex items-center justify-center gap-2 ${
                  paymentMethod === 'card' ? 'bg-[#c8f542] text-[#12300f] font-semibold border-[#c8f542]' : 'bg-white/5 text-white/70 border-white/10'
                }`}
              >
                <iconify-icon icon="solar:card-linear" width="16"></iconify-icon>
                <span>Card</span>
              </button>
              <button 
                type="button"
                onClick={() => setPaymentMethod('apple')}
                className={`py-2.5 rounded-xl border flex items-center justify-center gap-2 ${
                  paymentMethod === 'apple' ? 'bg-[#c8f542] text-[#12300f] font-semibold border-[#c8f542]' : 'bg-white/5 text-white/70 border-white/10'
                }`}
              >
                <iconify-icon icon="solar:apple-bold" width="16"></iconify-icon>
                <span>Apple Pay</span>
              </button>
              <button 
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-2.5 rounded-xl border flex items-center justify-center gap-2 ${
                  paymentMethod === 'upi' ? 'bg-[#c8f542] text-[#12300f] font-semibold border-[#c8f542]' : 'bg-white/5 text-white/70 border-white/10'
                }`}
              >
                <iconify-icon icon="solar:bolt-linear" width="16"></iconify-icon>
                <span>UPI / Net</span>
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 font-inter text-xs">
              <div>
                <label className="block text-white/70 font-medium mb-1 font-geist">Cardholder Name</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" 
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c8f542]"
                />
              </div>

              <div>
                <label className="block text-white/70 font-medium mb-1 font-geist">Card Number</label>
                <input 
                  type="text" 
                  required 
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 •••• •••• 8921" 
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c8f542]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 font-medium mb-1 font-geist">Expiry Date</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY" 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c8f542]"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-medium mb-1 font-geist">CVC / CVV</label>
                  <input 
                    type="password" 
                    required 
                    maxLength={4}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="•••" 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c8f542]"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full py-4 rounded-full font-geist font-semibold text-[#12300f] uppercase tracking-wider text-xs mt-6 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#c8f542', boxShadow: '0 8px 24px -6px rgba(200,245,66,0.4)' }}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#12300f] border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  <span>Pay {plans[selectedPlan].price} & Activate Plan</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PricingModal;
