<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
</script>

<svelte:head>
	<title>TabelhaFin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center space-y-4">
		<h1 class="text-4xl font-bold">TabelhaFin</h1>
		<p class="text-muted-foreground">Controle financeiro pessoal com IA.</p>
		<div class="flex gap-2 justify-center">
			<Button href={resolve('/dashboard')}>Entrar</Button>
		</div>
	</div>
</div>
