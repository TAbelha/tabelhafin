<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import EmptyState from '$lib/components/empty-state.svelte';
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props();

	const totalExpense = $derived(data.tags.reduce((sum: number, t: any) => sum + t.expense, 0));
	const totalIncome = $derived(data.tags.reduce((sum: number, t: any) => sum + t.income, 0));
</script>

<svelte:head>
	<title>Tags — TabelhaFin</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-2">Tags</h1>
<p class="text-sm text-muted-foreground mb-6">
	Agrupam gastos pontuais sem criar categoria ("Viagem SP", "PC novo").
</p>

<div class="grid gap-3 sm:grid-cols-3 mb-6">
	<Card>
		<CardContent class="py-4 text-center">
			<p class="text-sm text-muted-foreground">Gastos</p>
			<p class="text-xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
		</CardContent>
	</Card>
	<Card>
		<CardContent class="py-4 text-center">
			<p class="text-sm text-muted-foreground">Receitas</p>
			<p class="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
		</CardContent>
	</Card>
	<Card>
		<CardContent class="py-4 text-center">
			<p class="text-sm text-muted-foreground">Total</p>
			<p class="text-xl font-bold">{formatCurrency(totalExpense + totalIncome)}</p>
		</CardContent>
	</Card>
</div>

<div class="flex flex-col gap-2">
	{#if data.tags.length === 0}
		<Card>
		<EmptyState>
			Nenhuma tag ainda.
		</EmptyState>
		</Card>
	{:else}
		{#each data.tags as tag (tag.tagId)}
			<Card>
				<CardContent class="flex items-center justify-between py-3 px-4">
					<div>
						<p class="font-medium">{tag.name}</p>
						<p class="text-xs text-muted-foreground">
							{tag.count} transação{tag.count === 1 ? '' : 'ões'}
						</p>
					</div>
					<div class="flex gap-4 text-sm">
						{#if tag.expense > 0}
							<span class="text-red-600">{formatCurrency(tag.expense)}</span>
						{/if}
						{#if tag.income > 0}
							<span class="text-green-600">{formatCurrency(tag.income)}</span>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/each}
	{/if}
</div>
