<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { form } = $props();
	let step = $state(1);
	let pluggyToken = $state('');
	let connecting = $state(false);
	let pluggyError = $state('');
</script>

<svelte:head>
	<title>Bem-vindo — TabelhaFin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="w-full max-w-lg">
		<CardHeader class="text-center">
			<CardTitle>Bem-vindo ao TabelhaFin</CardTitle>
			<CardDescription>Passo {step} de 3</CardDescription>
		</CardHeader>
		<CardContent>
			{#if step === 1}
				<div class="flex flex-col gap-4">
					<p class="text-sm text-muted-foreground text-center">
						Suas finanças em um só lugar, sem lançamento manual.
					</p>
					<Button onclick={() => (step = 2)} class="w-full">Começar</Button>
				</div>
			{:else if step === 2}
				<form
					method="POST"
					action="?/connectPluggy"
					use:enhance={() => {
						connecting = true;
						pluggyError = '';
						return async ({ result }) => {
							connecting = false;
							if (result.type === 'failure') {
								pluggyError = (result.data as any)?.error ?? 'Erro ao conectar.';
							} else if (result.type === 'success') {
								step = 3;
							}
						};
					}}
					class="flex flex-col gap-4"
				>
					<p class="text-sm text-muted-foreground text-center">
						Cole o token do <a href="https://meu.pluggy.ai" target="_blank" class="text-primary hover:underline">Meu Pluggy</a> para sincronizar suas contas. Você pode pular esta etapa.
					</p>
					{#if pluggyError}
						<p class="text-sm text-red-600 text-center">{pluggyError}</p>
					{/if}
					<div>
						<Label for="token">Token do Pluggy</Label>
						<Input id="token" name="token" bind:value={pluggyToken} placeholder="Cole seu token aqui" />
					</div>
					<div class="flex gap-2">
						<Button type="submit" disabled={connecting} class="flex-1">
							{connecting ? 'Conectando...' : 'Conectar'}
						</Button>
						<Button type="button" variant="outline" onclick={() => (step = 3)} class="flex-1">
							Pular
						</Button>
					</div>
				</form>
			{:else}
				<div class="flex flex-col gap-4">
					<p class="text-sm text-muted-foreground text-center">
						Pronto! Categorização automática com IA e relatórios mensais. Configure tudo no perfil depois.
					</p>
					<form method="POST" action="?/complete" use:enhance>
						<Button type="submit" class="w-full">Ir para o dashboard</Button>
					</form>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
