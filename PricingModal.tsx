import React, { useState } from 'react';

interface PricingModalProps {
  onClose: () => void;
  onSuccess: (planId: 'day' | 'pro' | 'annual') => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose, onSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState<'day' | 'pro' | 'annual'>('pro');
  const [coupon, setCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // NEW: State for our custom in-app success popup
  const [successMsg, setSuccessMsg] = useState('');

  const plans = {
    day: { id: 'day', name: 'Day Pass', price: 99, period: '/ 24 hours', scans: 15, details: '+15 High-Res Scans' },
    pro: { id: 'pro', name: 'Pro Monthly', price: 2599, period: '/ month', scans: 100, details: '+100 Premium Scans' },
    annual: { id: 'annual', name: 'Clinical Annual', price: 19999, period: '/ year', scans: 1300, details: '+1300 Premium Scans' }
  };

  // Helper to trigger the floating toast and clear it after 3.5 seconds
  const showToast = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => {
      setSuccessMsg('');
    }, 3500);
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (code === 'DERMAPREMIUM') {
      setDiscountPercent(1.0);
      setErrorMsg('');
      showToast('Premium Access Granted! 100% Off Applied.');
    } else if (code === 'DERMANEW') {
      setDiscountPercent(0.15);
      setErrorMsg('');
      showToast('Welcome Offer Applied! 15% Off.');
    } else if (code === 'FLAT90') {
      setDiscountPercent(0.90);
      setErrorMsg('');
      showToast('Test Mode: 90% Off Applied!');
    } else {
      setDiscountPercent(0);
      setSuccessMsg('');
      setErrorMsg('Invalid Coupon Code');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayCheckout = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    const currentPlan = plans[selectedPlan];
    const finalAmount = Math.round(currentPlan.price * (1 - discountPercent));

    // 100% Discount Bypass
    if (finalAmount === 0) {
      setTimeout(() => {
        onSuccess(selectedPlan);
        setIsProcessing(false);
      }, 1000); 
      return;
    }

    const res = await loadRazorpayScript();
    
    if (!res) {
      setErrorMsg('Razorpay SDK failed to load. Please check your connection.');
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create Order on Backend
      const orderResponse = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount * 100 }) // Send paise
      });
      
      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to create secure order');
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Derma Assist AI',
        description: currentPlan.name,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // 3. Verify Signature on Backend
            const verifyResponse = await fetch('/.netlify/functions/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              onSuccess(selectedPlan);
            } else {
              setErrorMsg('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            setErrorMsg('Network error during verification.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: 'Patient Name',
          email: 'patient@example.com',
        },
        theme: {
          color: '#c8f542',
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            setErrorMsg('Payment cancelled.');
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      
      paymentObject.on('payment.failed', function (response: any) {
        setErrorMsg(`Payment Failed: ${response.error.description}`);
        setIsProcessing(false);
      });

      paymentObject.open();

    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Checkout failed to initialize.');
      setIsProcessing(false);
    }
  };

  const currentPlan = plans[selectedPlan];
  const finalPrice = Math.round(currentPlan.price * (1 - discountPercent));

  return (
    <div className="w-full max-w-4xl mx-auto py-6 animate-in fade-in duration-300 font-geist relative">
      <div className="bg-[#0a2a12] border border-[#1d4a25] p-8 sm:p-10 rounded-[28px] relative shadow-2xl overflow-hidden">
        
        {/* NEW: Custom Floating Success Toast Popup */}
        {successMsg && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#c8f542]/20 border border-[#c8f542]/40 shadow-[0_4px_24px_rgba(200,245,66,0.2)] backdrop-blur-md">
              <iconify-icon icon="solar:check-circle-bold" width="18" style={{ color: '#c8f542' }}></iconify-icon>
              <span className="text-xs font-semibold text-white tracking-wide">{successMsg}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-semibold text-[#c8f542] uppercase tracking-wider mb-2" style={{ border: '1px solid rgba(200,245,66,0.35)', background: 'rgba(200,245,66,0.06)' }}>
              SUBSCRIPTION SELECTION
            </span>
            <h3 className="font-semibold text-3xl text-white">Choose Your Access Tier</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all">&times;</button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-3">
          {Object.values(plans).map((plan) => (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id as any)}
              className={`p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between ${
                selectedPlan === plan.id ? 'bg-[#c8f542]/10 border-2 border-[#c8f542] shadow-xl scale-[1.02]' : 'bg-white/5 border border-white/10 hover:border-white/30'
              }`}
            >
              <div>
                <h4 className="font-semibold text-lg text-white mb-1">{plan.name}</h4>
                <p className="text-2xl font-bold text-[#c8f542] mb-4">₹{plan.price} <span className="text-[10px] font-normal text-white/50">{plan.period}</span></p>
                <ul className="space-y-2 font-inter text-xs text-white/70">
                  <li className="text-white font-medium">✓ {plan.details}</li>
                  <li>✓ Clinical AI Accuracy</li>
                  <li>✓ Priority Engine Queue</li>
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-md mx-auto bg-black/40 p-6 rounded-2xl border border-white/10 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <input 
              type="text" 
              placeholder="ENTER A VALID COUPON CODE HERE" 
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#c8f542] uppercase transition-colors"
            />
            <button onClick={applyCoupon} className="px-5 py-3 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20 transition-all">Apply</button>
          </div>

          <div className="flex justify-between items-center text-sm font-semibold text-white mb-6 pt-4 border-t border-white/10">
            <span>Total Payable:</span>
            <span className="text-xl text-[#c8f542] transition-all">₹{finalPrice}</span>
          </div>

          <button 
            onClick={handleRazorpayCheckout}
            disabled={isProcessing}
            className="w-full py-4 rounded-full font-bold text-[#12300f] uppercase tracking-wider text-xs transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
            style={{ backgroundColor: '#c8f542', boxShadow: '0 8px 24px -6px rgba(200,245,66,0.4)' }}
          >
            {isProcessing 
              ? (finalPrice === 0 ? 'Activating Premium Access...' : 'Connecting to Razorpay...') 
              : `Pay ₹${finalPrice} Securely`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;