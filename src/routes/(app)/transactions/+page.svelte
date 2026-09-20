<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import EmptyState from '$lib/components/empty-state.svelte';
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props();
</script>

<svelte:head>
	<title>Transações — TabelhaFin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold">Transações</h1>
	<Button href={resolve('/new')}>Nova transação</Button>
</div>

{#if data.transactions.length === 0}
	<Card>
		<EmptyState>
			Nenhuma transação encontrada.
		</EmptyState>
	</Card>
{:else}
	<div class="flex flex-col gap-2">
		{#each data.transactions as tx (tx.id)}
			<Card class="hover:ring-1 hover:ring-primary transition-colors">
				<CardContent class="flex items-center justify-between py-3 px-4">
					<div class="flex-1 min-w-0">
						<p class="font-medium truncate">{tx.description}</p>
						<p class="text-xs text-muted-foreground">
							{tx.date.toLocaleDateString('pt-BR')} · {tx.category}
							{#if tx.accountName}
								· {tx.accountName}
							{/if}
						</p>
					</div>
					<span
						class="ml-4 font-mono text-sm whitespace-nowrap {tx.amount < 0 ? 'text-red-600' : 'text-green-600'}"
					>
						{tx.amount < 0 ? '' : '+'}{formatCurrency(tx.amount)}
					</span>
				</CardContent>
			</Card>
		{/each}
	</div>
{/if}
