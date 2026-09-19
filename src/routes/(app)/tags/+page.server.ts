import { getDb } from "$lib/server/db";
import { getTagTotals, getTagsByUser } from "$lib/server/db/tags";
import { requireLogin } from "$lib/server/require-login";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform }) => {
  requireLogin(locals.userId);

  const db = getDb(platform!.env.DB);

  const [userTags, totals] = await Promise.all([
    getTagsByUser(db, locals.userId),
    getTagTotals(db, locals.userId),
  ]);
  const totalsByTagId = new Map(totals.map((t) => [t.tagId, t]));
  const tags = userTags.map((t) => {
    const total = totalsByTagId.get(t.id);
    return {
      tagId: t.id,
      name: t.name,
      count: total?.count ?? 0,
      expense: total?.expense ?? 0,
      income: total?.income ?? 0,
    };
  });

  return { tags };
};
