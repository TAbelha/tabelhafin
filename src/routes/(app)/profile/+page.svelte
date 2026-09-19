<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';

	let { data } = $props();

	let name = $state(data.user?.name ?? '');
</script>

<svelte:head>
	<title>Perfil — TabelhaFin</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-6">Perfil</h1>

<div class="flex flex-col gap-4 max-w-lg">
	<Card>
		<CardHeader>
			<CardTitle>Dados pessoais</CardTitle>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/updateName" use:enhance class="flex flex-col gap-3">
				<div>
					<Label for="name">Nome</Label>
					<Input id="name" name="name" bind:value={name} required />
				</div>
				<div>
					<Label>Email</Label>
					<Input value={data.user?.email ?? ''} disabled />
				</div>
				<Button type="submit" class="w-fit">Salvar</Button>
			</form>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Preferências de IA</CardTitle>
			<CardDescription>Controle quais recursos de IA estão ativos.</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex flex-col gap-3">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium">Categorização automática</p>
						<p class="text-xs text-muted-foreground">Usa IA para categorizar transações</p>
					</div>
					<span class="text-sm {data.user?.aiCategorizationEnabled ? 'text-green-600' : 'text-muted-foreground'}">
						{data.user?.aiCategorizationEnabled ? 'Ativo' : 'Inativo'}
					</span>
				</div>
				<Separator />
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium">Relatórios mensais</p>
						<p class="text-xs text-muted-foreground">Gera narrativa com IA no dia 1</p>
					</div>
					<span class="text-sm {data.user?.aiReportEnabled ? 'text-green-600' : 'text-muted-foreground'}">
						{data.user?.aiReportEnabled ? 'Ativo' : 'Inativo'}
					</span>
				</div>
				<Separator />
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium">Chat IA</p>
						<p class="text-xs text-muted-foreground">Assistente financeiro com IA</p>
					</div>
					<span class="text-sm {data.user?.aiChatEnabled ? 'text-green-600' : 'text-muted-foreground'}">
						{data.user?.aiChatEnabled ? 'Ativo' : 'Inativo'}
					</span>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
