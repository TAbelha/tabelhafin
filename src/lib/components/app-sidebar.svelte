<script lang="ts" module>
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import ArrowLeftRightIcon from "@lucide/svelte/icons/arrow-left-right";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import RepeatIcon from "@lucide/svelte/icons/repeat";
	import LandmarkIcon from "@lucide/svelte/icons/landmark";
	import TagIcon from "@lucide/svelte/icons/tag";
	import FolderOpenIcon from "@lucide/svelte/icons/folder-open";
	import BarChart3Icon from "@lucide/svelte/icons/bar-chart-3";
	import ReceiptTextIcon from "@lucide/svelte/icons/receipt-text";
	import UserIcon from "@lucide/svelte/icons/user";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import { resolve } from "$app/paths";

	const NAV_MAIN = [
		{
			title: "Dashboard",
			url: resolve("/dashboard"),
			icon: LayoutDashboardIcon,
		},
		{
			title: "Financeiro",
			url: "#",
			icon: ArrowLeftRightIcon,
			isActive: false,
			items: [
				{ title: "Transações", url: resolve("/transactions") },
				{ title: "Nova transação", url: resolve("/new") },
				{ title: "Recorrentes", url: resolve("/recurring") },
			],
		},
		{
			title: "Contas",
			url: resolve("/accounts"),
			icon: LandmarkIcon,
		},
		{
			title: "Categorias",
			url: resolve("/categories"),
			icon: FolderOpenIcon,
		},
		{
			title: "Tags",
			url: resolve("/tags"),
			icon: TagIcon,
		},
		{
			title: "Relatórios",
			url: resolve("/reports"),
			icon: BarChart3Icon,
		},
		{
			title: "Extratos",
			url: resolve("/statements"),
			icon: ReceiptTextIcon,
		},
	];

	const NAV_SECONDARY = [
		{
			title: "Perfil",
			url: resolve("/profile"),
			icon: UserIcon,
		},
	];
</script>

<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import NavMain from "./nav-main.svelte";
	import NavSecondary from "./nav-secondary.svelte";
	import NavUser from "./nav-user.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		user,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user: { name: string; email: string };
	} = $props();
</script>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href={resolve("/dashboard")} {...props}>
							<div
								class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
							>
								<BarChart3Icon class="size-4" />
							</div>
							<div class="grid flex-1 text-start text-sm leading-tight">
								<span class="truncate font-semibold">TabelhaFin</span>
								<span class="truncate text-xs text-sidebar-foreground/60">Finanças</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={NAV_MAIN} />
		<NavSecondary items={NAV_SECONDARY} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
</Sidebar.Root>
