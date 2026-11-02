const Razorpay = require('razorpay');

// ---- Single source of truth for prices & coupons (rupees). Never trust the browser. ----
const PLANS = {
  day:    { name: 'Day Pass',        price: 99 },
  pro:    { name: 'Pro Monthly',     price: 2599 },
  annual: { name: 'Clinical Annual', price: 19999 },
};

// Same coupons as before, now validated on the server.
const COUPONS = {
  DERMAPREMIUM: { discount: 1.0,  message: 'Premium Access Granted! 100% Off Applied.' },
  DERMANEW:     { discount: 0.15, message: 'Welcome Offer Applied! 15% Off.' },
  FLAT90:       { discount: 0.90, message: 'Test Mode: 90% Off Applied!' },
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Returns { discount, message, code } or throws
function resolveCoupon(couponCode) {
  const code = (couponCode || '').trim().toUpperCase();
  if (!code) return { discount: 0, message: '', code: '' };
  const c = COUPONS[code];
  if (!c) throw new Error('Invalid Coupon Code');
  return { discount: c.discount, message: c.message, code };
}

// Same rounding as the UI: whole rupees
const finalRupees = (price, discount) => Math.round(price * (1 - discount));

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'Invalid JSON body sent from frontend' }); }

  const { action, planId, couponCode } = body;

  // ---- Coupon check (used by the "Apply" button) ----
  if (action === 'quote') {
    try {
      const c = resolveCoupon(couponCode);
      return json(200, { valid: true, discountPercent: c.discount, message: c.message, code: c.code });
    } catch (e) {
      return json(400, { valid: false, error: e.message });
    }
  }

  // ---- Create order ----
  const plan = PLANS[planId];
  if (!plan) return json(400, { error: 'Unknown plan' });

  let coupon;
  try { coupon = resolveCoupon(couponCode); }
  catch (e) { return json(400, { error: e.message }); }

  const rupees = finalRupees(plan.price, coupon.discount);

  // 100% off: nothing to charge, so no Razorpay order
  if (rupees === 0) return json(200, { free: true, planId, amount: 0 });

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('CRITICAL: Missing Razorpay environment variables in Netlify.');
    return json(500, { error: 'Server misconfiguration: Missing API keys' });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: rupees * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { planId, coupon: coupon.code },
    });

    return json(200, {
      key_id: process.env.RAZORPAY_KEY_ID, // public key, safe to return
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Razorpay API Error Details:', error);
    return json(500, {
      error: 'Failed to create Razorpay order',
      details: error?.error?.description || error?.description || error?.message || 'Unknown Razorpay Error',
    });
  }
};
