<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let loading = $state(false);
	let error = $state('');
</script>

<svelte:head>
	<title>Entrar — TabelhaFin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="w-full max-w-md">
		<CardHeader class="text-center">
			<CardTitle class="text-2xl">TabelhaFin</CardTitle>
			<CardDescription>Entre na sua conta</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				action="/api/auth/sign-in/email"
				use:enhance={() => {
					loading = true;
					error = '';
					return async ({ result }) => {
						loading = false;
						if (result.type === 'failure') {
							error = 'Email ou senha inválidos.';
						} else if (result.type === 'redirect') {
							window.location.href = '/dashboard';
						}
					};
				}}
				class="flex flex-col gap-4"
			>
				{#if error}
					<p class="text-sm text-red-600">{error}</p>
				{/if}
				<div>
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" required placeholder="seu@email.com" />
				</div>
				<div>
					<Label for="password">Senha</Label>
					<Input id="password" name="password" type="password" required placeholder="Sua senha" />
				</div>
				<Button type="submit" disabled={loading} class="w-full">
					{loading ? 'Entrando...' : 'Entrar'}
				</Button>
				<p class="text-center text-sm text-muted-foreground">
					Não tem conta? <a href="/signup" class="text-primary hover:underline">Criar conta</a>
				</p>
			</form>
		</CardContent>
	</Card>
</div>
