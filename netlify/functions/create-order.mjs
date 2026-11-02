import Razorpay from 'razorpay';
import { PLANS, COUPONS, json, httpError, handle, parseBody, requireUser, grantPlan } from '../lib/store.mjs';

function resolveCoupon(couponCode) {
  const code = (couponCode || '').trim().toUpperCase();
  if (!code) return { discount: 0, message: '', code: '' };
  const c = COUPONS[code];
  if (!c) throw httpError(400, 'Invalid Coupon Code');
  return { discount: c.discount, message: c.message, code };
}

export const handler = handle(async (event) => {
  if (event.httpMethod !== 'POST') throw httpError(405, 'Method not allowed');
  const { action, planId, couponCode } = parseBody(event);

  // Coupon check for the "Apply" button (no login needed)
  if (action === 'quote') {
    try {
      const c = resolveCoupon(couponCode);
      return json(200, { valid: true, discountPercent: c.discount, message: c.message, code: c.code });
    } catch (e) {
      return json(400, { valid: false, error: e.message });
    }
  }

  const user = await requireUser(event);
  const plan = PLANS[planId];
  if (!plan) throw httpError(400, 'Unknown plan');

  const coupon = resolveCoupon(couponCode);
  const rupees = Math.round(plan.price * (1 - coupon.discount));

  // 100% off: nothing to charge, grant straight away
  if (rupees === 0) {
    const subscription = await grantPlan(user.uid, planId, {
      paymentId: `free_${user.uid}_${Date.now()}`,
      source: `coupon:${coupon.code}`,
    });
    return json(200, { free: true, subscription });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('CRITICAL: Missing Razorpay environment variables in Netlify.');
    throw httpError(500, 'Server misconfiguration: Missing API keys');
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });
    const order = await razorpay.orders.create({
      amount: rupees * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { planId, coupon: coupon.code, uid: user.uid },
    });
    return json(200, {
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
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
});
