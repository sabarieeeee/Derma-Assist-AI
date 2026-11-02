import { auth } from './firebase';
import type { Subscription } from './types';

const BASE = '/.netlify/functions';

// Calls a Netlify function with the signed-in user's Firebase ID token.
export async function authedFetch(fn: string, body: unknown = {}): Promise<any> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in again to continue.');
  const token = await user.getIdToken();

  const res = await fetch(`${BASE}/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  let data: any;
  try { data = await res.json(); }
  catch { data = { error: `Server error (${res.status}). Check the Netlify function logs.` }; }

  if (!res.ok) throw Object.assign(new Error(data.details || data.error || 'Request failed'), { status: res.status });
  return data;
}

export const fetchSubscription = async (): Promise<Subscription | null> =>
  (await authedFetch('get-subscription')).subscription ?? null;

export const consumePaidScan = async (): Promise<Subscription | null> =>
  (await authedFetch('use-scan')).subscription ?? null;

export const cancelSubscription = async (): Promise<Subscription | null> =>
  (await authedFetch('cancel-subscription')).subscription ?? null;
