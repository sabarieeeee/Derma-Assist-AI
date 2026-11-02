import { json, handle, requireUser, getSubscription } from '../lib/store.mjs';

export const handler = handle(async (event) => {
  const user = await requireUser(event);
  return json(200, { subscription: await getSubscription(user.uid) });
});
