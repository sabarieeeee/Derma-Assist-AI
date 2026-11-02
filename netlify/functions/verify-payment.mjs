import crypto from 'node:crypto';
import { json, httpError, handle, parseBody, requireUser, getRazorpayOrder, grantPlan } from '../lib/store.mjs';

export const handler = handle(async (event) => {
  if (event.httpMethod !== 'POST') throw httpError(405, 'Method not allowed');
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parseBody(event);
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw httpError(400, 'Missing required fields');
  }

  const user = await requireUser(event);
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keySecret) throw httpError(500, 'Server misconfiguration: Missing API keys');

  // 1. Signature
  const expected = crypto.createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(razorpay_signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.error('verify-payment: signature mismatch');
    throw httpError(400, 'Signature mismatch');
  }

  // 2. Plan + owner come from the order we created, never from the browser
  const order = await getRazorpayOrder(razorpay_order_id);
  const { uid, planId } = order.notes || {};
  if (!uid || !planId) throw httpError(400, 'Order is missing plan details');
  if (uid !== user.uid) throw httpError(403, 'This payment belongs to a different account');

  // 3. Activate (idempotent; the webhook may also do this)
  const subscription = await grantPlan(user.uid, planId, {
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    source: 'checkout',
  });
  return json(200, { success: true, subscription });
});
