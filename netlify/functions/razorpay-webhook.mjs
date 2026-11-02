import crypto from 'node:crypto';
import { PLANS, json, httpError, handle, getRazorpayOrder, grantPlan } from '../lib/store.mjs';

// Backup path: activates the plan even if the user closed the tab right after paying.
export const handler = handle(async (event) => {
  if (event.httpMethod !== 'POST') throw httpError(405, 'Method not allowed');
  const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  if (!secret) throw httpError(500, 'Webhook secret is not configured');

  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
  const sig = (event.headers || {})['x-razorpay-signature'] || '';
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(sig));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw httpError(400, 'Invalid webhook signature');

  let evt;
  try { evt = JSON.parse(raw); } catch { throw httpError(400, 'Invalid JSON'); }
  if (evt.event !== 'payment.captured') return json(200, { ignored: true });

  const payment = evt.payload && evt.payload.payment && evt.payload.payment.entity;
  if (!payment || !payment.order_id || !payment.id) return json(200, { ignored: true });

  const order = await getRazorpayOrder(payment.order_id);
  const { uid, planId } = order.notes || {};
  if (!uid || !PLANS[planId]) return json(200, { ignored: true }); // not one of our plan orders

  await grantPlan(uid, planId, { paymentId: payment.id, orderId: payment.order_id, source: 'webhook' });
  return json(200, { ok: true });
});
