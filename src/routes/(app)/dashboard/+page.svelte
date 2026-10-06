<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { formatCurrency } from '$lib/utils/format';
	import MonthlyExpensesChart from '$lib/components/charts/monthly-expenses.svelte';
	import CategoryBreakdownChart from '$lib/components/charts/category-breakdown.svelte';

	let { data }: { data: PageData } = $props();
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

<div class="grid gap-4 md:grid-cols-2 mb-6">
	{#if data.monthlyExpenses.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Gastos por mês</CardTitle>
			</CardHeader>
			<CardContent>
				<MonthlyExpensesChart data={data.monthlyExpenses} />
			</CardContent>
		</Card>
	{/if}

	{#if data.categoryTotals.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Top categorias</CardTitle>
			</CardHeader>
			<CardContent>
				<CategoryBreakdownChart data={data.categoryTotals} />
			</CardContent>
		</Card>
	{/if}
</div>
