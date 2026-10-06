<script lang="ts">
	import type { LayoutData } from './$types';
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";
	import { Button } from "$lib/components/ui/button";
	import Separator from "$lib/components/ui/separator/separator.svelte";

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<Sidebar.Provider style="--sidebar-width: 16rem;">
	<AppSidebar user={data.user} />
	<Sidebar.Inset>
		<header
			class="flex h-12 shrink-0 items-center gap-2 border-b px-4 md:px-6"
		>
			<Sidebar.Trigger class="-ms-1" />
			<Separator orientation="vertical" class="me-2 h-4" />
			<div class="flex flex-1 items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground md:hidden">
					TabelhaFin
				</span>
				<div class="flex-1"></div>
				<ThemeToggle />
			</div>
		</header>
		<main class="flex-1 p-4 md:p-6">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
