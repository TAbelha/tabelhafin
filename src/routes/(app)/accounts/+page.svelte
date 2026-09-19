<script lang="ts">
	import { AccountType } from '$lib/enums/account-type';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { signedBalance } from '$lib/utils/accounts';
	import { formatCurrency } from '$lib/utils/format';
	import { toReais } from '$lib/utils/money';

	let { data } = $props();

	let showForm = $state(false);
	let searchQuery = $state('');
	let typeFilter = $state('');

	const typeLabel: Record<string, string> = {
		[AccountType.Checking]: 'Conta corrente',
		[AccountType.CreditCard]: 'Cartão de crédito',
		[AccountType.Investment]: 'Investimentos'
	};

	const filteredAccounts = $derived(
		data.accounts.filter((a: any) => {
			if (typeFilter && a.type !== typeFilter) return false;
			if (searchQuery.trim() && !a.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
				return false;
			return true;
		})
	);

	function amountClass(n: number): string {
		if (n > 0) return 'font-mono text-sm text-green-600';
		if (n < 0) return 'font-mono text-sm text-red-600';
		return 'font-mono text-sm';
	}
</script>

<svelte:head>
	<title>Contas — TabelhaFin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold">Contas</h1>
	<Button onclick={() => (showForm = !showForm)} variant={showForm ? 'outline' : 'default'}>
		{showForm ? 'Cancelar' : '+ Conta manual'}
	</Button>
</div>

<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
	<Card>
		<CardHeader><CardTitle class="text-sm text-muted-foreground">Saldo total</CardTitle></CardHeader>
		<CardContent><p class="text-2xl font-bold">{formatCurrency(data.summary.total)}</p></CardContent>
	</Card>
	<Card>
		<CardHeader><CardTitle class="text-sm text-muted-foreground">Conta corrente</CardTitle></CardHeader>
		<CardContent><p class="text-2xl font-bold">{formatCurrency(data.summary.checking)}</p></CardContent>
	</Card>
	<Card>
		<CardHeader><CardTitle class="text-sm text-muted-foreground">Investimentos</CardTitle></CardHeader>
		<CardContent><p class="text-2xl font-bold">{formatCurrency(data.summary.investment)}</p></CardContent>
	</Card>
	<Card>
		<CardHeader><CardTitle class="text-sm text-muted-foreground">Fatura aberta</CardTitle></CardHeader>
		<CardContent>
			<p class="text-2xl font-bold {data.summary.credit > 0 ? 'text-red-600' : ''}">
				{data.summary.credit > 0 ? '-' : ''}{formatCurrency(data.summary.credit)}
			</p>
		</CardContent>
	</Card>
</div>

{#if showForm}
	<Card class="mb-6">
		<CardHeader><CardTitle>Nova conta manual</CardTitle></CardHeader>
		<CardContent>
			<form method="POST" action="?/create" use:enhance class="flex flex-col gap-3">
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<div>
						<Label for="name">Nome</Label>
						<Input id="name" name="name" placeholder="Ex: Carteira, Banco X" required />
					</div>
					<div>
						<Label for="type">Tipo</Label>
						<Select.Root type="single" name="type">
							<Select.Trigger><Select.Value placeholder="Selecione" /></Select.Trigger>
							<Select.Content>
								<Select.Item value={AccountType.Checking}>Conta corrente</Select.Item>
								<Select.Item value={AccountType.CreditCard}>Cartão de crédito</Select.Item>
								<Select.Item value={AccountType.Investment}>Investimentos</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div>
						<Label for="balance">Saldo atual (R$)</Label>
						<Input id="balance" name="balance" placeholder="0,00" required />
					</div>
				</div>
				<p class="text-xs text-muted-foreground">
					Em cartão de crédito, informe o valor da fatura em aberto (positivo).
				</p>
				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" onclick={() => (showForm = false)}>Cancelar</Button>
					<Button type="submit">Adicionar</Button>
				</div>
			</form>
		</CardContent>
	</Card>
{/if}

<div class="flex gap-2 mb-4">
	<Input bind:value={searchQuery} placeholder="Buscar conta..." class="w-full sm:w-64" />
	<Select.Root type="single" bind:value={typeFilter}>
		<Select.Trigger class="w-48"><Select.Value placeholder="Todos os tipos" /></Select.Trigger>
		<Select.Content>
			<Select.Item value="">Todos os tipos</Select.Item>
			<Select.Item value={AccountType.Checking}>Conta corrente</Select.Item>
			<Select.Item value={AccountType.CreditCard}>Cartão de crédito</Select.Item>
			<Select.Item value={AccountType.Investment}>Investimentos</Select.Item>
		</Select.Content>
	</Select.Root>
</div>

<div class="flex flex-col gap-2">
	{#if filteredAccounts.length === 0}
		<Card>
			<CardContent class="py-12 text-center text-muted-foreground">
				Nenhuma conta encontrada.
			</CardContent>
		</Card>
	{:else}
		{#each filteredAccounts as account (account.id)}
			<Card>
				<CardContent class="flex items-center justify-between py-3 px-4">
					<div class="flex-1 min-w-0">
						<p class="font-medium truncate">{account.name}</p>
						<p class="text-xs text-muted-foreground">
							{account.institution} · {typeLabel[account.type] ?? account.type}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<span class={amountClass(signedBalance(account))}>
							{formatCurrency(signedBalance(account))}
						</span>
						{#if account.manual}
							<form method="POST" action="?/delete" use:enhance class="inline">
								<input type="hidden" name="accountId" value={account.id} />
								<Button type="submit" variant="ghost" size="sm">Remover</Button>
							</form>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/each}
	{/if}
</div>
