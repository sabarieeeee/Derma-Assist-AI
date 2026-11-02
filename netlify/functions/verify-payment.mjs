import crypto from 'node:crypto';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

    let payload;
    try { payload = JSON.parse(event.body || '{}'); }
    catch { return json(400, { error: 'Invalid JSON body' }); }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json(400, { error: 'Missing required fields' });
    }

    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!keyId || !keySecret) {
      console.error('verify-payment: missing Razorpay env vars');
      return json(500, { error: 'Server misconfiguration: Missing API keys' });
    }

    // 1. Verify the signature
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(String(razorpay_signature));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.error('verify-payment: signature mismatch');
      return json(400, { success: false, error: 'Signature mismatch' });
    }

    // 2. Look up the plan stored on the order (best effort; signature is already valid)
    let planId;
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const r = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (r.ok) {
        const order = await r.json();
        planId = order && order.notes ? order.notes.planId : undefined;
      } else {
        console.error('verify-payment: order lookup failed', r.status, await r.text());
      }
    } catch (lookupErr) {
      console.error('verify-payment: order lookup error', lookupErr);
    }

    return json(200, { success: true, message: 'Payment verified', planId });
  } catch (error) {
    console.error('verify-payment: unexpected error', error);
    return json(500, { error: 'Internal server error', details: error && error.message });
  }
};
