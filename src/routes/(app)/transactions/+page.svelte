<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import DataTable from '$lib/components/data-table.svelte';
	import { transactionColumns } from '$lib/components/transactions-columns';

	let { data } = $props();
</script>

<svelte:head>
	<title>Transações — TabelhaFin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold">Transações</h1>
	<Button href={resolve('/new')}>Nova transação</Button>
</div>

<DataTable
	columns={transactionColumns}
	data={data.transactions}
	searchPlaceholder="Buscar transação..."
	searchColumn="description"
/>
