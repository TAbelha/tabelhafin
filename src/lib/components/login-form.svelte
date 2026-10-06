<script lang="ts">
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
	} from "$lib/components/ui/field/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { cn } from "$lib/utils";

	let { class: className = "" }: { class?: string } = $props();

	let loading = $state(false);
	let error = $state("");
</script>

<div class={cn("flex flex-col gap-6", className)}>
	<Card.Root class="overflow-hidden p-0">
		<Card.Content class="grid p-0 md:grid-cols-2">
			<form
				method="POST"
				action="/api/auth/sign-in/email"
				use:enhance={() => {
					loading = true;
					error = "";
					return async ({ result }) => {
						loading = false;
						if (result.type === "failure") {
							error = "Email ou senha inválidos.";
						} else if (result.type === "redirect") {
							goto("/dashboard");
						}
					};
				}}
				class="p-6 md:p-8"
			>
				<input type="hidden" name="callbackURL" value="/dashboard" />
				<FieldGroup>
					<div class="flex flex-col items-center gap-2 text-center">
						<h1 class="text-2xl font-bold">Bem-vindo de volta</h1>
						<p class="text-balance text-muted-foreground">
							Entre na sua conta TabelhaFin
						</p>
					</div>
					{#if error}
						<p class="text-sm text-destructive">{error}</p>
					{/if}
					<Field>
						<FieldLabel for="email-login">Email</FieldLabel>
						<Input
							id="email-login"
							name="email"
							type="email"
							placeholder="seu@email.com"
							required
						/>
					</Field>
					<Field>
						<div class="flex items-center">
							<FieldLabel for="password-login">Senha</FieldLabel>
						</div>
						<Input
							id="password-login"
							name="password"
							type="password"
							required
							placeholder="Sua senha"
						/>
					</Field>
					<Field>
						<Button type="submit" disabled={loading} class="w-full">
							{loading ? "Entrando..." : "Entrar"}
						</Button>
					</Field>
					<FieldDescription class="text-center">
						Não tem conta? <a href="/signup" class="underline underline-offset-4">Cadastre-se</a>
					</FieldDescription>
				</FieldGroup>
			</form>
			<div class="relative hidden bg-muted md:block">
				<div class="absolute inset-0 flex items-center justify-center">
					<div class="text-center text-muted-foreground">
						<p class="text-4xl font-bold">📊</p>
						<p class="mt-2 text-sm">Controle financeiro simples</p>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
