// Shared helpers for all Netlify functions: plans, coupons, auth, Firestore subscription store.
const DAY = 24 * 60 * 60 * 1000;

export const PLANS = {
  day:    { name: 'Day Pass',        price: 99,    scans: 15,   durationMs: DAY },
  pro:    { name: 'Pro Monthly',     price: 2599,  scans: 100,  durationMs: 30 * DAY },
  annual: { name: 'Clinical Annual', price: 19999, scans: 1300, durationMs: 365 * DAY },
};
const RANK = { day: 1, pro: 2, annual: 3 };

// Same coupons as before, validated on the server.
export const COUPONS = {
  DERMAPREMIUM: { discount: 1.0,  message: 'Premium Access Granted! 100% Off Applied.' },
  DERMANEW:     { discount: 0.15, message: 'Welcome Offer Applied! 15% Off.' },
  FLAT90:       { discount: 0.90, message: 'Test Mode: 90% Off Applied!' },
};

/* ---------- http helpers ---------- */
export const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});
export const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

export const handle = (fn) => async (event) => {
  try {
    return await fn(event);
  } catch (e) {
    if (e && e.statusCode) return json(e.statusCode, { error: e.message });
    console.error('Unhandled function error:', e);
    return json(500, { error: 'Internal server error', details: e && e.message });
  }
};

export const parseBody = (event) => {
  try { return JSON.parse(event.body || '{}'); }
  catch { throw httpError(400, 'Invalid JSON body'); }
};

/* ---------- Firebase Admin (lazy, so tests can inject a fake db) ---------- */
let _db = null;
let _verifier = null;
export const __setTestHooks = ({ db, verifier }) => { _db = db || _db; _verifier = verifier || _verifier; };

async function initAdmin() {
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  if (!getApps().length) {
    const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) {
      throw httpError(500, 'Server misconfiguration: Firebase admin variables are missing');
    }
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
}

async function getDb() {
  if (_db) return _db;
  await initAdmin();
  const { getFirestore } = await import('firebase-admin/firestore');
  _db = getFirestore();
  return _db;
}

export async function requireUser(event) {
  const h = event.headers || {};
  const m = (h.authorization || h.Authorization || '').match(/^Bearer (.+)$/i);
  if (!m) throw httpError(401, 'Please sign in again to continue.');
  try {
    if (_verifier) return await _verifier(m[1]);
    await initAdmin();
    const { getAuth } = await import('firebase-admin/auth');
    const d = await getAuth().verifyIdToken(m[1]);
    return { uid: d.uid, email: d.email || '' };
  } catch (e) {
    if (e && e.statusCode) throw e;
    throw httpError(401, 'Your session expired. Please sign in again.');
  }
}

/* ---------- Razorpay REST helper ---------- */
export async function getRazorpayOrder(orderId) {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId || !keySecret) throw httpError(500, 'Server misconfiguration: Missing API keys');
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const r = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!r.ok) {
    console.error('Razorpay order lookup failed', r.status, await r.text());
    throw httpError(503, 'Could not confirm the order with Razorpay. If you were charged, your plan will activate automatically in a few minutes.');
  }
  return r.json();
}

/* ---------- subscription model ---------- */
// What the browser sees. Handles expiry on read.
export function toView(sub, now = Date.now()) {
  if (!sub) return null;
  const expired = sub.expiresAt <= now;
  return {
    planId: sub.planId,
    planName: sub.planName,
    status: expired ? 'expired' : sub.status,
    purchasedAt: sub.purchasedAt,
    expiresAt: sub.expiresAt,
    scansTotal: sub.scansTotal,
    scansRemaining: expired ? 0 : sub.scansRemaining,
    cancelledAt: sub.cancelledAt || null,
  };
}

const userRefOf = (db, uid) => db.collection('users').doc(uid);

export async function getSubscription(uid) {
  const db = await getDb();
  const snap = await userRefOf(db, uid).get();
  return toView(snap.exists ? (snap.data() || {}).subscription : null);
}

// Grants a plan. Idempotent per paymentId (checkout and webhook may both call it).
export async function grantPlan(uid, planId, { paymentId, orderId = null, source = 'checkout' }) {
  const plan = PLANS[planId];
  if (!plan) throw httpError(400, 'Unknown plan');
  if (!paymentId) throw httpError(400, 'Missing payment id');
  const db = await getDb();
  const payRef = db.collection('payments').doc(paymentId);
  const userRef = userRefOf(db, uid);

  const result = await db.runTransaction(async (t) => {
    const paySnap = await t.get(payRef);
    const userSnap = await t.get(userRef);
    const existing = userSnap.exists ? (userSnap.data() || {}).subscription : null;
    if (paySnap.exists) return existing; // already applied

    const now = Date.now();
    const active = existing && existing.expiresAt > now;
    const carry = active ? existing.scansRemaining : 0;
    const keepCurrentTier = active && RANK[existing.planId] > RANK[planId]; // lower plan = top-up only

    const sub = keepCurrentTier
      ? { ...existing, scansTotal: existing.scansTotal + plan.scans, scansRemaining: existing.scansRemaining + plan.scans }
      : {
          planId,
          planName: plan.name,
          status: 'active',
          purchasedAt: now,
          expiresAt: Math.max(active ? existing.expiresAt : 0, now + plan.durationMs),
          scansTotal: carry + plan.scans,
          scansRemaining: carry + plan.scans,
          cancelledAt: null,
        };

    t.set(payRef, { uid, planId, orderId, source, at: now });
    t.set(userRef, { subscription: sub }, { merge: true });
    return sub;
  });
  return toView(result);
}

export async function consumeScan(uid) {
  const db = await getDb();
  const userRef = userRefOf(db, uid);
  const result = await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    const sub = snap.exists ? (snap.data() || {}).subscription : null;
    if (!sub || sub.expiresAt <= Date.now() || sub.scansRemaining <= 0) {
      throw httpError(402, 'No paid scans remaining.');
    }
    const next = { ...sub, scansRemaining: sub.scansRemaining - 1 };
    t.set(userRef, { subscription: next }, { merge: true });
    return next;
  });
  return toView(result);
}

// Cancel = no further use of the plan after expiry; access continues until then. Plans never auto-renew.
export async function cancelSub(uid) {
  const db = await getDb();
  const userRef = userRefOf(db, uid);
  const result = await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    const sub = snap.exists ? (snap.data() || {}).subscription : null;
    if (!sub || sub.expiresAt <= Date.now()) throw httpError(400, 'You have no active subscription to cancel.');
    if (sub.status === 'cancelled') return sub;
    const next = { ...sub, status: 'cancelled', cancelledAt: Date.now() };
    t.set(userRef, { subscription: next }, { merge: true });
    return next;
  });
  return toView(result);
}
