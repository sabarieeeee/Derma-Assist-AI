import { json, handle, requireUser, cancelSub } from '../lib/store.mjs';

export const handler = handle(async (event) => {
  const user = await requireUser(event);
  return json(200, { subscription: await cancelSub(user.uid) });
});
