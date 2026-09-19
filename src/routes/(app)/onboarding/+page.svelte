<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';

	let step = $state(1);

	function next() {
		if (step < 3) step++;
		else goto(resolve('/dashboard'));
	}
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
					<Button onclick={next} class="w-full">Começar</Button>
				</div>
			{:else if step === 2}
				<div class="flex flex-col gap-4">
					<p class="text-sm text-muted-foreground text-center">
						Sincronize suas contas com Open Finance ou importe extratos.
					</p>
					<Button onclick={next} class="w-full">Próximo</Button>
				</div>
			{:else}
				<div class="flex flex-col gap-4">
					<p class="text-sm text-muted-foreground text-center">
						Pronto! Categorização automática com IA e relatórios mensais.
					</p>
					<Button onclick={next} class="w-full">Ir para o dashboard</Button>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
