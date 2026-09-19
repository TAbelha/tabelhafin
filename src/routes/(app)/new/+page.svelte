<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { TRANSACTION_CATEGORIES } from '$lib/utils/categories';
	import { toReais } from '$lib/utils/money';

	let { data } = $props();

	let description = $state('');
	let amountRaw = $state('');
	let date = $state(new Date().toISOString().slice(0, 10));
	let category = $state('Outros');
	let accountId = $state('');
	let notes = $state('');
	let submitting = $state(false);

	const ACCOUNTS: Array<{ id: string; name: string }> = data.accounts ?? [];

	function handleAmountInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const digits = input.value.replace(/\D/g, '');
		const cents = parseInt(digits, 10);
		if (Number.isFinite(cents)) {
			amountRaw = (cents / 100).toFixed(2);
		} else {
			amountRaw = '';
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;
		submitting = true;

		const formData = new FormData();
		formData.set('description', description);
		formData.set('amount', amountRaw);
		formData.set('date', date);
		formData.set('category', category);
		formData.set('notes', notes);
		if (accountId) formData.set('accountId', accountId);

		try {
			const res = await fetch('?/create', { method: 'POST', body: formData });
			if (res.ok) {
				await goto(resolve('/transactions'));
			}
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Nova transação — TabelhaFin</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<h1 class="mb-6 text-2xl font-bold">Nova transação</h1>

	<Card>
		<CardContent class="pt-6">
			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<div>
					<Label for="description">Descrição</Label>
					<Input id="description" bind:value={description} required placeholder="Ex: Almoço no restaurante" />
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label for="amount">Valor (R$)</Label>
						<Input
							id="amount"
							type="text"
							inputmode="numeric"
							placeholder="0,00"
							value={amountRaw ? toReais(Math.round(parseFloat(amountRaw) * 100)).toFixed(2) : ''}
							oninput={handleAmountInput}
							required
						/>
					</div>
					<div>
						<Label for="date">Data</Label>
						<Input id="date" type="date" bind:value={date} required />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label>Categoria</Label>
						<Select.Root type="single" bind:value={category}>
							<Select.Trigger>
								<Select.Value />
							</Select.Trigger>
							<Select.Content>
								{#each TRANSACTION_CATEGORIES as cat}
									<Select.Item value={cat}>{cat}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					{#if ACCOUNTS.length > 0}
						<div>
							<Label>Conta</Label>
							<Select.Root type="single" bind:value={accountId}>
								<Select.Trigger>
									<Select.Value placeholder="Selecione" />
								</Select.Trigger>
								<Select.Content>
									{#each ACCOUNTS as account}
										<Select.Item value={account.id}>{account.name}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					{/if}
				</div>

				<div>
					<Label for="notes">Observações</Label>
					<Textarea id="notes" bind:value={notes} rows={2} placeholder="Opcional" />
				</div>

				<div class="flex gap-2 pt-2">
					<Button type="submit" disabled={submitting}>
						{submitting ? 'Salvando...' : 'Salvar'}
					</Button>
					<Button variant="outline" href={resolve('/transactions')}>Cancelar</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
