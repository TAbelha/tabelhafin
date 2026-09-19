<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let loading = $state(false);
	let error = $state('');
</script>

<svelte:head>
	<title>Criar conta — TabelhaFin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="w-full max-w-md">
		<CardHeader class="text-center">
			<CardTitle class="text-2xl">TabelhaFin</CardTitle>
			<CardDescription>Crie sua conta</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				action="/api/auth/sign-up/email"
				use:enhance={() => {
					loading = true;
					error = '';
					return async ({ result }) => {
						loading = false;
						if (result.type === 'failure') {
							error = 'Erro ao criar conta.';
						} else if (result.type === 'redirect') {
							goto('/onboarding');
						}
					};
				}}
				class="flex flex-col gap-4"
			>
				<input type="hidden" name="callbackURL" value="/onboarding" />
				{#if error}
					<p class="text-sm text-red-600">{error}</p>
				{/if}
				<div>
					<Label for="name">Nome</Label>
					<Input id="name" name="name" required placeholder="Seu nome" />
				</div>
				<div>
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" required placeholder="seu@email.com" />
				</div>
				<div>
					<Label for="password">Senha</Label>
					<Input id="password" name="password" type="password" required placeholder="Mínimo 8 caracteres" />
				</div>
				<Button type="submit" disabled={loading} class="w-full">
					{loading ? 'Criando...' : 'Criar conta'}
				</Button>
				<p class="text-center text-sm text-muted-foreground">
					Já tem conta? <a href="/login" class="text-primary hover:underline">Entrar</a>
				</p>
			</form>
		</CardContent>
	</Card>
</div>
