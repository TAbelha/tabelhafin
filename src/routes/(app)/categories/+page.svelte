<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props();

	let direction = $state<'expense' | 'income'>('expense');
	const isExpense = $derived(direction === 'expense');

	const withMovement = $derived(
		data.categories.filter((c: any) => (isExpense ? c.expense > 0 : c.income > 0))
	);
	const total = $derived(
		withMovement.reduce(
			(sum: number, c: any) => sum + (isExpense ? c.expense : c.income),
			0
		)
	);
</script>

<svelte:head>
	<title>Categorias — TabelhaFin</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-6">Categorias</h1>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
	<Card>
		<CardContent class="py-4 text-center">
			<p class="text-sm text-muted-foreground">Total</p>
			<p class="text-2xl font-bold">{formatCurrency(total)}</p>
		</CardContent>
	</Card>
	<Card>
		<CardContent class="py-4 flex items-center justify-center gap-2">
			<span class="text-sm text-muted-foreground">Mostrar:</span>
			<button
				class="text-sm px-3 py-1 rounded {isExpense ? 'bg-primary text-primary-foreground' : 'bg-muted'}"
				onclick={() => (direction = 'expense')}
			>
				Gastos
			</button>
			<button
				class="text-sm px-3 py-1 rounded {!isExpense ? 'bg-primary text-primary-foreground' : 'bg-muted'}"
				onclick={() => (direction = 'income')}
			>
				Receitas
			</button>
		</CardContent>
	</Card>
</div>

<div class="flex flex-col gap-2">
	{#each withMovement as cat (cat.name)}
		<Card>
			<CardContent class="flex items-center justify-between py-3 px-4">
				<span class="text-sm font-medium">{cat.name}</span>
				<div class="flex items-center gap-4">
					<span class="text-sm text-muted-foreground">
						{((isExpense ? cat.expense : cat.income) / (total || 1) * 100).toFixed(1)}%
					</span>
					<span class="font-mono text-sm {isExpense ? 'text-red-600' : 'text-green-600'}">
						{formatCurrency(isExpense ? cat.expense : cat.income)}
					</span>
				</div>
			</CardContent>
		</Card>
	{/each}
</div>
