<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Select from '$lib/components/ui/select';
	import { TRANSACTION_CATEGORIES } from '$lib/utils/categories';
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props();

	let transactions = $state(
		(data.transactions as any[]).map((tx: any, i: number) => ({
			...tx,
			selected: true,
			idx: i
		}))
	);
	let submitting = $state(false);

	const selectedCount = $derived(transactions.filter((tx) => tx.selected).length);

	function toggleAll() {
		const allSelected = transactions.every((tx) => tx.selected);
		transactions = transactions.map((tx) => ({ ...tx, selected: !allSelected }));
	}

	function toggleOne(idx: number) {
		transactions = transactions.map((tx) =>
			tx.idx === idx ? { ...tx, selected: !tx.selected } : tx
		);
	}

	async function applyTransactions() {
		if (!data.review) return;
		submitting = true;
		try {
			const selected = transactions
				.filter((tx) => tx.selected)
				.map(({ idx: _, selected: __, ...tx }) => tx);
			const res = await fetch('/api/statements/apply', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reviewId: data.review.id, transactions: selected })
			});
			if (res.ok) {
				await goto('/transactions');
			}
		} finally {
			submitting = false;
		}
	}

	async function cancelReview() {
		if (!data.review) return;
		await fetch('/api/statements/cancel', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ reviewId: data.review.id })
		});
		await goto('/statements');
	}
</script>

<svelte:head>
	<title>Revisar extrato — TabelhaFin</title>
</svelte:head>

{#if !data.review}
	<div class="py-12 text-center text-muted-foreground">
		Nenhum extrato pendente de revisão.
	</div>
{:else}
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold">Revisar: {data.review.filename}</h1>
		<div class="flex gap-2">
			<Button variant="outline" onclick={cancelReview}>Cancelar</Button>
			<Button onclick={applyTransactions} disabled={submitting || selectedCount === 0}>
				{submitting ? 'Aplicando...' : `Aplicar (${selectedCount})`}
			</Button>
		</div>
	</div>

	<div class="mb-4">
		<button class="text-sm text-primary hover:underline" onclick={toggleAll}>
			{transactions.every((tx) => tx.selected) ? 'Desmarcar todos' : 'Marcar todos'}
		</button>
	</div>

	<div class="flex flex-col gap-2">
		{#each transactions as tx (tx.idx)}
			<Card class="{tx.selected ? '' : 'opacity-50'}">
				<CardContent class="flex items-center gap-3 py-3 px-4">
					<Checkbox checked={tx.selected} onCheckedChange={() => toggleOne(tx.idx)} />
					<div class="flex-1 min-w-0">
						<p class="font-medium text-sm truncate">{tx.description}</p>
						<p class="text-xs text-muted-foreground">
							{tx.date}
							{#if tx.category}
								· {tx.category}
							{/if}
						</p>
					</div>
					<span class="font-mono text-sm {tx.amount < 0 ? 'text-red-600' : 'text-green-600'}">
						{formatCurrency(tx.amount)}
					</span>
				</CardContent>
			</Card>
		{/each}
	</div>
{/if}
