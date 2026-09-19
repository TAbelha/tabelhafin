<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Frequency } from '$lib/enums/frequency';
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props();

	let showForm = $state(false);

	const FREQUENCIES: Record<string, string> = {
		[Frequency.Weekly]: 'Semanal',
		[Frequency.Monthly]: 'Mensal',
		[Frequency.Quarterly]: 'Trimestral',
		[Frequency.Yearly]: 'Anual'
	};

	const GROUP_ORDER = [Frequency.Monthly, Frequency.Weekly, Frequency.Quarterly, Frequency.Yearly];

	const groups = $derived.by(() => {
		const byFreq: Record<string, any[]> = {};
		for (const e of data.expenses) {
			if (!e.isActive) continue;
			(byFreq[e.frequency] ??= []).push(e);
		}
		return GROUP_ORDER.filter((f) => byFreq[f]?.length > 0).map((f) => ({
			frequency: f,
			label: FREQUENCIES[f] ?? f,
			items: byFreq[f]
		}));
	});
</script>

<svelte:head>
	<title>Recorrências — TabelhaFin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold">Recorrências</h1>
	<Button onclick={() => (showForm = !showForm)} variant={showForm ? 'outline' : 'default'}>
		{showForm ? 'Cancelar' : '+ Nova'}
	</Button>
</div>

{#if showForm}
	<Card class="mb-6">
		<CardHeader><CardTitle>Nova recorrência</CardTitle></CardHeader>
		<CardContent>
			<form method="POST" action="?/create" use:enhance class="flex flex-col gap-3">
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<Label for="description">Descrição</Label>
						<Input id="description" name="description" placeholder="Ex: Netflix" required />
					</div>
					<div>
						<Label for="amount">Valor (R$)</Label>
						<Input id="amount" name="amount" placeholder="0,00" required />
					</div>
				</div>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<Label>Frequência</Label>
						<Select.Root type="single" name="frequency" value={Frequency.Monthly}>
							<Select.Trigger><Select.Value /></Select.Trigger>
							<Select.Content>
								{#each Object.entries(FREQUENCIES) as [value, label]}
									<Select.Item {value}>{label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div>
						<Label for="nextChargeDate">Próxima cobrança</Label>
						<Input id="nextChargeDate" name="nextChargeDate" type="date" required />
					</div>
				</div>
				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" onclick={() => (showForm = false)}>Cancelar</Button>
					<Button type="submit">Criar</Button>
				</div>
			</form>
		</CardContent>
	</Card>
{/if}

{#if groups.length === 0}
	<Card>
		<CardContent class="py-12 text-center text-muted-foreground">
			Nenhuma recorrência ativa.
		</CardContent>
	</Card>
{:else}
	{#each groups as group}
		<h2 class="text-lg font-semibold mt-4 mb-2">{group.label}</h2>
		<div class="flex flex-col gap-2 mb-4">
			{#each group.items as expense (expense.id)}
				<Card>
					<CardContent class="flex items-center justify-between py-3 px-4">
						<div>
							<p class="font-medium">{expense.description}</p>
							<p class="text-xs text-muted-foreground">
								Próxima: {new Date(expense.nextChargeDate).toLocaleDateString('pt-BR')}
							</p>
						</div>
						<div class="flex items-center gap-3">
							<span class="font-mono text-sm text-red-600">{formatCurrency(expense.amount)}</span>
							<form method="POST" action="?/delete" use:enhance class="inline">
								<input type="hidden" name="expenseId" value={expense.id} />
								<Button type="submit" variant="ghost" size="sm">Excluir</Button>
							</form>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/each}
{/if}
