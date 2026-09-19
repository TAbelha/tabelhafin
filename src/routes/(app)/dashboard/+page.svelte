<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard — TabelhaFin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold">Dashboard</h1>
	<Button href={resolve('/new')}>Nova transação</Button>
</div>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
	<Card>
		<CardHeader>
			<CardTitle class="text-sm text-muted-foreground">Receita do mês</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="text-2xl font-bold text-green-600">{formatCurrency(data.monthIncome)}</p>
		</CardContent>
	</Card>
	<Card>
		<CardHeader>
			<CardTitle class="text-sm text-muted-foreground">Gasto do mês</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="text-2xl font-bold text-red-600">{formatCurrency(data.monthExpense)}</p>
		</CardContent>
	</Card>
	<Card>
		<CardHeader>
			<CardTitle class="text-sm text-muted-foreground">Saldo</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="text-2xl font-bold">{formatCurrency(data.monthIncome - data.monthExpense)}</p>
		</CardContent>
	</Card>
	<Card>
		<CardHeader>
			<CardTitle class="text-sm text-muted-foreground">Investimentos</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="text-2xl font-bold">{formatCurrency(data.investmentBalance)}</p>
		</CardContent>
	</Card>
</div>

{#if data.categoryTotals.length > 0}
	<Card>
		<CardHeader>
			<CardTitle>Top categorias</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="flex flex-col gap-2">
				{#each data.categoryTotals.slice(0, 8) as cat}
					<div class="flex items-center justify-between">
						<span class="text-sm">{cat.name}</span>
						<span class="font-mono text-sm text-muted-foreground">{formatCurrency(cat.expense)}</span>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
{/if}
