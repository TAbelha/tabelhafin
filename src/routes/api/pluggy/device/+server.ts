import { unauthorizedJson } from "$lib/server/api-auth";
import {
  hasDeviceToken,
  issueDeviceToken,
  revokeDeviceToken,
} from "$lib/server/pluggy/device-token";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, platform }) => {
  if (!locals.userId) return unauthorizedJson();

  const deviceToken = await issueDeviceToken(
    platform!.env.DEVICE_TOKENS,
    locals.userId,
  );
  return json({ deviceToken });
};

export const DELETE: RequestHandler = async ({ locals, platform }) => {
  if (!locals.userId) return unauthorizedJson();

  const revoked = await revokeDeviceToken(
    platform!.env.DEVICE_TOKENS,
    locals.userId,
  );
  return json({ revoked });
};

export const GET: RequestHandler = async ({ locals, platform }) => {
  if (!locals.userId) return unauthorizedJson();

  const paired = await hasDeviceToken(platform!.env.DEVICE_TOKENS, locals.userId);
  return json({ paired });
};
