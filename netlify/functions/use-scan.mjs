import { json, handle, requireUser, consumeScan } from '../lib/store.mjs';

export const handler = handle(async (event) => {
  const user = await requireUser(event);
  return json(200, { subscription: await consumeScan(user.uid) });
});
