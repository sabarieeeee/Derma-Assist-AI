import React, { useEffect, useState } from 'react';
import { authedFetch, cancelSubscription } from './subscriptionApi';
import type { PlanId, Subscription } from './types';

interface PricingModalProps {
  onClose: () => void;
  userEmail: string;
  userName: string;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  subscription: Subscription | null;
  onSubscriptionChange: (sub: Subscription | null) => void;
}

const PLANS: Record<PlanId, { id: PlanId; name: string; price: number; period: string; scans: number; details: string }> = {
  day:    { id: 'day',    name: 'Day Pass',        price: 99,    period: '/ 24 hours', scans: 15,   details: '+15 High-Res Scans' },
  pro:    { id: 'pro',    name: 'Pro Monthly',     price: 2599,  period: '/ month',    scans: 100,  details: '+100 Premium Scans' },
  annual: { id: 'annual', name: 'Clinical Annual', price: 19999, period: '/ year',     scans: 1300, details: '+1300 Premium Scans' },
};

const formatDateTime = (ts: number) =>
  new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const timeLeft = (ts: number) => {
  const ms = ts - Date.now();
  if (ms <= 0) return 'Expired';
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ${hours} hr left`;
  if (hours > 0) return `${hours} hr ${mins % 60} min left`;
  return `${mins} min left`;
};

export const PricingModal: React.FC<PricingModalProps> = ({
  onClose, userEmail, userName, isLoggedIn, onRequireLogin, subscription, onSubscriptionChange,
}) => {
  const hasActive = !!subscription && subscription.status !== 'expired';
  const isExpired = !!subscription && subscription.status === 'expired';

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro');
  const [coupon, setCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCode, setAppliedCode] = useState(''); // only set after the server validates it
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPlans, setShowPlans] = useState(!hasActive);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // If the plan becomes active/inactive (login, expiry, purchase), collapse/expand the plan picker
  useEffect(() => { setShowPlans(!hasActive); }, [hasActive]);

  const showToast = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Safely read a JSON response; avoids a vague crash if the server returns HTML/plain text
  const readJson = async (res: Response) => {
    try { return await res.json(); }
    catch { return { error: `Server error (${res.status}). Check the Netlify function logs.` }; }
  };

  const resetCoupon = () => {
    setCoupon('');
    setDiscountPercent(0);
    setAppliedCode('');
  };

  const applyCoupon = async () => {
    const code = coupon.trim();
    if (!code) {
      setDiscountPercent(0);
      setAppliedCode('');
      setErrorMsg('Invalid Coupon Code');
      return;
    }
    try {
      const res = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quote', couponCode: code }),
      });
      const data = await readJson(res);
      if (res.ok && data.valid) {
        setDiscountPercent(data.discountPercent);
        setAppliedCode(data.code);
        setErrorMsg('');
        showToast(data.message);
      } else {
        setDiscountPercent(0);
        setAppliedCode('');
        setSuccessMsg('');
        setErrorMsg(data.error || 'Invalid Coupon Code');
      }
    } catch {
      setErrorMsg('Could not check the coupon. Please try again.');
    }
  };

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const planActivated = (sub: Subscription | null, planName: string) => {
    onSubscriptionChange(sub);
    resetCoupon();
    setShowPlans(false);
    showToast(`${planName} is now active!`);
  };

  const handleRazorpayCheckout = async () => {
    if (!isLoggedIn) { onRequireLogin(); return; }

    setIsProcessing(true);
    setErrorMsg('');
    const currentPlan = PLANS[selectedPlan];

    try {
      // 1. Server prices the plan + coupon and creates the order (or grants it if 100% off)
      const orderData = await authedFetch('create-order', { planId: selectedPlan, couponCode: appliedCode });

      if (orderData.free) {
        planActivated(orderData.subscription, currentPlan.name);
        setIsProcessing(false);
        return;
      }
      if (!orderData.order_id) throw new Error('Failed to create secure order');

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Razorpay SDK failed to load. Please check your connection.');

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Derma Assist AI',
        description: currentPlan.name,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // 3. Server verifies the signature and activates the plan
            const verifyData = await authedFetch('verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            planActivated(verifyData.subscription, currentPlan.name);
          } catch (err: any) {
            setErrorMsg(
              (err && err.message ? err.message : 'Payment verification failed.') +
              ` Payment ID: ${response.razorpay_payment_id}`
            );
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: userName || undefined,
          email: userEmail || undefined,
        },
        theme: { color: '#c8f542' },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setErrorMsg('Payment cancelled.');
          },
        },
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

  const handleCancel = async () => {
    setIsCancelling(true);
    setErrorMsg('');
    try {
      const sub = await cancelSubscription();
      onSubscriptionChange(sub);
      setConfirmCancel(false);
      showToast('Subscription cancelled.');
    } catch (e: any) {
      setErrorMsg(e.message || 'Could not cancel the subscription.');
    } finally {
      setIsCancelling(false);
    }
  };

  const selected = PLANS[selectedPlan];
  const finalPrice = Math.round(selected.price * (1 - discountPercent));
  const isCurrentPlan = hasActive && subscription!.planId === selectedPlan;

  const payLabel = isProcessing
    ? (finalPrice === 0 ? 'Activating Premium Access...' : 'Connecting to Razorpay...')
    : !isLoggedIn
      ? 'Sign in to continue'
      : finalPrice === 0
        ? `Activate ${selected.name}`
        : isCurrentPlan
          ? `Renew ${selected.name} · ₹${finalPrice}`
          : hasActive
            ? `Switch to ${selected.name} · ₹${finalPrice}`
            : `Pay ₹${finalPrice} Securely`;

  const scansPct = hasActive && subscription!.scansTotal > 0
    ? Math.min(100, Math.max(0, (subscription!.scansRemaining / subscription!.scansTotal) * 100))
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto py-6 animate-in fade-in duration-300 font-geist relative">
      <div className="bg-[#0a2a12] border border-[#1d4a25] p-8 sm:p-10 rounded-[28px] relative shadow-2xl overflow-hidden">

        {/* Floating success toast */}
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
              {hasActive ? 'YOUR SUBSCRIPTION' : 'SUBSCRIPTION SELECTION'}
            </span>
            <h3 className="font-semibold text-3xl text-white">{hasActive ? 'Manage Your Plan' : 'Choose Your Access Tier'}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all">&times;</button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* Expired banner */}
        {isExpired && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm text-center">
            Your {subscription!.planName} plan expired on {formatDateTime(subscription!.expiresAt)}. Choose a plan to continue with paid scans.
          </div>
        )}

        {/* CURRENT PLAN CARD */}
        {hasActive && (
          <div className="mb-8 p-6 rounded-2xl bg-[#c8f542]/10 border border-[#c8f542]/40">
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#c8f542]/80 font-semibold mb-1">Current plan</p>
                <h4 className="text-2xl font-semibold text-white">{subscription!.planName}</h4>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${subscription!.status === 'cancelled' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-[#c8f542]/20 text-[#c8f542] border border-[#c8f542]/40'}`}>
                {subscription!.status === 'cancelled' ? 'Cancelled' : 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 text-sm">
              <div>
                <p className="text-white/50 text-[11px] mb-0.5">Started</p>
                <p className="text-white font-medium">{formatDateTime(subscription!.purchasedAt)}</p>
              </div>
              <div>
                <p className="text-white/50 text-[11px] mb-0.5">{subscription!.status === 'cancelled' ? 'Access ends' : 'Expires'}</p>
                <p className="text-white font-medium">{formatDateTime(subscription!.expiresAt)}</p>
                <p className="text-[#c8f542] text-[11px] mt-0.5">{timeLeft(subscription!.expiresAt)}</p>
              </div>
              <div>
                <p className="text-white/50 text-[11px] mb-0.5">Paid scans left</p>
                <p className="text-white font-medium">{subscription!.scansRemaining} / {subscription!.scansTotal}</p>
                <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full rounded-full bg-[#c8f542] transition-all duration-500" style={{ width: `${scansPct}%` }} />
                </div>
              </div>
            </div>

            {subscription!.status === 'cancelled' && (
              <p className="text-xs text-amber-300/90 mb-4">
                Cancelled. You can keep using your remaining scans until {formatDateTime(subscription!.expiresAt)}. Plans never renew automatically.
              </p>
            )}

            {confirmCancel ? (
              <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                <p className="text-sm text-white mb-1 font-medium">Cancel {subscription!.planName}?</p>
                <p className="text-xs text-white/60 mb-4">
                  You'll keep your remaining scans until {formatDateTime(subscription!.expiresAt)}. This doesn't refund past payments; contact support for refunds.
                </p>
                <div className="flex gap-3">
                  <button onClick={handleCancel} disabled={isCancelling} className="px-5 py-2.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold hover:bg-red-500/30 transition-all">
                    {isCancelling ? 'Cancelling...' : 'Yes, cancel'}
                  </button>
                  <button onClick={() => setConfirmCancel(false)} disabled={isCancelling} className="px-5 py-2.5 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all">
                    Keep plan
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowPlans((v) => !v)} className="px-5 py-2.5 rounded-full text-xs font-bold text-[#12300f] hover:scale-[1.03] transition-transform" style={{ backgroundColor: '#c8f542' }}>
                  {showPlans ? 'Hide plans' : 'Upgrade / change plan'}
                </button>
                {subscription!.status === 'active' && (
                  <button onClick={() => setConfirmCancel(true)} className="px-5 py-2.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold hover:bg-white/20 hover:text-white transition-all">
                    Cancel subscription
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* PLAN PICKER + CHECKOUT */}
        {showPlans && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-3">
              {Object.values(PLANS).map((plan) => {
                const isCurrent = hasActive && subscription!.planId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between relative ${
                      selectedPlan === plan.id ? 'bg-[#c8f542]/10 border-2 border-[#c8f542] shadow-xl scale-[1.02]' : 'bg-white/5 border border-white/10 hover:border-white/30'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-[#c8f542] text-[#12300f] text-[9px] font-bold uppercase tracking-wider">Current</span>
                    )}
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
                );
              })}
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
                className="w-full py-4 rounded-full font-bold text-[#12300f] uppercase tracking-wider text-xs transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ backgroundColor: '#c8f542', boxShadow: '0 8px 24px -6px rgba(200,245,66,0.4)' }}
              >
                {payLabel}
              </button>

              {hasActive && (
                <p className="text-[10px] text-white/40 text-center mt-4">
                  Unused scans carry over. Plans don't renew automatically.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PricingModal;
