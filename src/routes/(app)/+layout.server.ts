import { getDb } from "$lib/server/db";
import { requireLogin } from "$lib/server/require-login";

export const load = async ({
  locals,
  platform,
}: {
  locals: App.Locals;
  platform: App.Platform;
}) => {
  requireLogin(locals.userId);

  const db = getDb(platform.env.DB);

  return {
    userId: locals.userId,
  };
};
