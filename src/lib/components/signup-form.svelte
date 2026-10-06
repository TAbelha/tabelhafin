<script lang="ts">
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";

	let loading = $state(false);
	let error = $state("");
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Criar conta</Card.Title>
		<Card.Description>Preencha os dados abaixo para criar sua conta</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			method="POST"
			action="/api/auth/sign-up/email"
			use:enhance={() => {
				loading = true;
				error = "";
				return async ({ result }) => {
					loading = false;
					if (result.type === "failure") {
						error = (result.data as { message?: string })?.message ?? "Erro ao criar conta.";
					} else if (result.type === "redirect") {
						goto("/dashboard");
					}
				};
			}}
		>
			<input type="hidden" name="callbackURL" value="/dashboard" />
			<Field.Group>
				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}
				<Field.Field>
					<Field.Label for="name-signup">Nome</Field.Label>
					<Input id="name-signup" name="name" type="text" placeholder="Seu nome" required />
				</Field.Field>
				<Field.Field>
					<Field.Label for="email-signup">Email</Field.Label>
					<Input id="email-signup" name="email" type="email" placeholder="seu@email.com" required />
				</Field.Field>
				<Field.Field>
					<Field.Label for="password-signup">Senha</Field.Label>
					<Input id="password-signup" name="password" type="password" required />
					<Field.Description>Mínimo de 8 caracteres.</Field.Description>
				</Field.Field>
				<Field.Field>
					<Button type="submit" disabled={loading} class="w-full">
						{loading ? "Criando..." : "Criar conta"}
					</Button>
					<Field.Description class="text-center">
						Já tem conta? <a href="/login" class="underline underline-offset-4">Entrar</a>
					</Field.Description>
				</Field.Field>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
