import { getDb } from '$lib/server/db';
import { requireLogin } from '$lib/server/require-login';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

import { fail } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireLogin(locals.userId);

	const db = getDb(platform!.env.DB);
	const user = await db.query.users.findFirst({
		where: eq(users.id, locals.userId)
	});

	return {
		user: user
			? {
					name: user.name,
					email: user.email,
					hideAi: user.hideAi,
					aiCategorizationEnabled: user.aiCategorizationEnabled,
					aiReportEnabled: user.aiReportEnabled,
					aiChatEnabled: user.aiChatEnabled
				}
			: null
	};
};

export const actions: Actions = {
	updateName: async ({ request, locals, platform }) => {
		requireLogin(locals.userId);

		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Nome obrigatório.' });

		const db = getDb(platform!.env.DB);
		await db.update(users).set({ name }).where(eq(users.id, locals.userId));

		toast.success('Nome atualizado.');
		return { success: true };
	}
};
