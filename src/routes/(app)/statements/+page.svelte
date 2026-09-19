<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let { data } = $props();

	const statusMap: Record<string, { label: string; class: string }> = {
		pending: { label: 'Processando', class: 'bg-yellow-100 text-yellow-800' },
		ready: { label: 'Aguardando revisão', class: 'bg-blue-100 text-blue-800' },
		applied: { label: 'Aplicado', class: 'bg-green-100 text-green-800' },
		cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-800' }
	};

	const sourceMap: Record<string, string> = {
		takeout_zip: 'Gmail Takeout',
		single_pdf: 'PDF',
		csv: 'CSV'
	};

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Extratos — TabelhaFin</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-6">Extratos importados</h1>

{#if data.reviews.length === 0}
	<Card>
		<CardContent class="py-12 text-center text-muted-foreground">
			Nenhum extrato importado ainda.
		</CardContent>
	</Card>
{:else}
	<div class="flex flex-col gap-3">
		{#each data.reviews as review (review.id)}
			{@const status = statusMap[review.status] ?? statusMap.pending}
			<Card>
				<CardContent class="flex items-center justify-between py-3 px-4">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<p class="font-medium truncate">{review.filename}</p>
							<Badge class={status.class}>{status.label}</Badge>
						</div>
						<p class="text-xs text-muted-foreground mt-1">
							{sourceMap[review.source] ?? review.source}
							· {formatDate(review.createdAt)}
							{#if review.transactionCount > 0}
								· {review.transactionCount} transações
							{/if}
							{#if review.duplicateCount > 0}
								· {review.duplicateCount} duplicadas
							{/if}
						</p>
					</div>
					{#if review.status === 'ready'}
						<a
							href="/statements/review?id={review.id}"
							class="text-sm text-primary hover:underline"
						>
							Revisar
						</a>
					{/if}
				</CardContent>
			</Card>
		{/each}
	</div>
{/if}
