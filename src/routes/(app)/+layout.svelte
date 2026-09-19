<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';

	let { children } = $props();

	const NAV_ITEMS = [
		{ href: resolve('/dashboard'), label: 'Dashboard' },
		{ href: resolve('/transactions'), label: 'Transações' },
		{ href: resolve('/new'), label: 'Nova' }
	];

	let mobileOpen = $state(false);
</script>

<div class="flex min-h-screen bg-background">
	<!-- Desktop sidebar -->
	<aside class="hidden w-56 flex-col border-r p-4 lg:flex">
		<a href={resolve('/dashboard')} class="mb-6 text-lg font-bold">TabelhaFin</a>
		<nav class="flex flex-col gap-1">
			{#each NAV_ITEMS as item}
				{@const active = page.url.pathname.startsWith(item.href)}
				<Button
					href={item.href}
					variant={active ? 'default' : 'ghost'}
					class="justify-start"
				>
					{item.label}
				</Button>
			{/each}
		</nav>
	</aside>

	<!-- Mobile header -->
	<header class="flex items-center border-b p-4 lg:hidden">
		<button
			class="mr-3 text-xl"
			onclick={() => (mobileOpen = !mobileOpen)}
			aria-label="Menu"
		>
			&#9776;
		</button>
		<a href={resolve('/dashboard')} class="text-lg font-bold">TabelhaFin</a>
	</header>

	<!-- Mobile nav -->
	{#if mobileOpen}
		<div class="fixed inset-0 z-40 bg-black/50" onclick={() => (mobileOpen = false)}></div>
		<nav class="fixed left-0 top-0 z-50 flex h-full w-56 flex-col bg-background p-4 shadow-lg">
			<a href={resolve('/dashboard')} class="mb-6 text-lg font-bold" onclick={() => (mobileOpen = false)}>TabelhaFin</a>
			{#each NAV_ITEMS as item}
				{@const active = page.url.pathname.startsWith(item.href)}
				<Button
					href={item.href}
					variant={active ? 'default' : 'ghost'}
					class="justify-start"
					onclick={() => (mobileOpen = false)}
				>
					{item.label}
				</Button>
			{/each}
		</nav>
	{/if}

	<!-- Main content -->
	<main class="flex-1 p-4 lg:p-6">
		{@render children()}
	</main>
</div>
