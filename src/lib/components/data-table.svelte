<script lang="ts" generics="T">
	import {
		type ColumnDef,
		type SortingState,
		type ColumnFiltersState,
		type PaginationState,
		createSvelteTable,
		getCoreRowModel,
		getSortedRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
	} from "@tanstack/svelte-table";
	import { get } from "svelte/store";
	import * as Table from "$lib/components/ui/table";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";

	let {
		columns,
		data,
		searchPlaceholder = "Buscar...",
		searchColumn,
		pageSize = 20,
	}: {
		columns: ColumnDef<T, any>[];
		data: T[];
		searchPlaceholder?: string;
		searchColumn?: string;
		pageSize?: number;
	} = $props();

	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize });

	const tableStore = createSvelteTable({
		columns,
		get data() {
			return data;
		},
		state: {
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			},
			get pagination() {
				return pagination;
			},
		},
		onSortingChange: (updater) => {
			sorting = typeof updater === "function" ? updater(sorting) : updater;
		},
		onColumnFiltersChange: (updater) => {
			columnFilters = typeof updater === "function" ? updater(columnFilters) : updater;
		},
		onPaginationChange: (updater) => {
			pagination = typeof updater === "function" ? updater(pagination) : updater;
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	// Unwrap store for reactive use
	let table = $derived(get(tableStore));

	function handleSearch(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		if (!searchColumn) return;
		table.getColumn(searchColumn)?.setFilterValue(value);
	}
</script>

<div class="flex flex-col gap-3">
	{#if searchColumn}
		<div class="flex items-center gap-2">
			<Input
				placeholder={searchPlaceholder}
				oninput={handleSearch}
				class="max-w-sm"
			/>
		</div>
	{/if}

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup}
					<Table.Row>
						{#each headerGroup.headers as header}
							<Table.Head>
								{#if !header.isPlaceholder}
									<button
										class="flex items-center gap-1 {header.column.getCanSort()
											? 'cursor-pointer select-none hover:text-foreground'
											: ''}"
										onclick={header.column.getToggleSortingHandler()}
									>
										{#if typeof header.column.columnDef.header === "string"}
											{header.column.columnDef.header}
										{/if}
										{#if header.column.getIsSorted() === "asc"}
											↑
										{:else if header.column.getIsSorted() === "desc"}
											↓
										{/if}
									</button>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row}
					<Table.Row>
						{#each row.getVisibleCells() as cell}
							<Table.Cell class={(cell.column.columnDef.meta as { className?: string })?.className}>
								{cell.renderValue()}
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-24 text-center text-muted-foreground">
							Nenhum resultado encontrado.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	{#if table.getPageCount() > 1}
		<div class="flex items-center justify-between px-2">
			<p class="text-sm text-muted-foreground">
				Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
			</p>
			<div class="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					class="size-8"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					<ChevronLeftIcon class="size-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					class="size-8"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					<ChevronRightIcon class="size-4" />
				</Button>
			</div>
		</div>
	{/if}
</div>
