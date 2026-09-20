<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import EmptyState from '$lib/components/empty-state.svelte';
	import { Button } from '$lib/components/ui/button';
	import { formatCurrency } from '$lib/utils/format';
	import { onMount } from 'svelte';

	let report = $state<any>(null);
	let loading = $state(true);
	let isGenerating = $state(false);
	let error = $state('');

	onMount(async () => {
		try {
			const res = await fetch('/api/reports/latest');
			if (res.ok) {
				report = await res.json();
			}
		} catch {
			// No reports yet
		} finally {
			loading = false;
		}
	});

	async function generatePdf() {
		if (!report) return;
		isGenerating = true;
		error = '';
		try {
			const typstModule = await import(/* @vite-ignore */ '@myriaddreamin/typst.ts');
			const typst = typstModule.$typst;
			typst.setCompilerInitOptions({
				getModule: () =>
					'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'
			});
			typst.setRendererInitOptions({
				getModule: () =>
					'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm'
			});
			const summary = report.summary as any;
			const income = summary.totalIncome ?? 0;
			const expense = summary.totalExpense ?? 0;
			const balance = income - expense;
			const investment = summary.investmentBalance ?? 0;
			const categories = Object.entries(summary.categoryTotals ?? {})
				.map(([name, amount]) => ({
					name,
					amount: formatCurrency(amount as number),
					value: amount as number,
					percentage: expense > 0 ? `${(((amount as number) / expense) * 100).toFixed(1)}%` : '0%'
				}))
				.sort((a, b) => b.value - a.value);

			const typstSource = `
#set page(paper: "a4", margin: (top: 2.5cm, bottom: 2.5cm, left: 2.5cm, right: 2.5cm))
#set text(size: 10pt)
#align(center + horizon)[
  #text(size: 28pt, weight: "bold")[TabelhaFin]
  #v(0.5cm)
  #text(size: 18pt)[Relatório Financeiro Mensal]
  #v(0.3cm)
  #text(size: 14pt)[${report.yearMonth}]
]
#pagebreak()
= Resumo Executivo
${summary.narrative ?? 'Relatório financeiro do mês.'}
= Indicadores do Mês
#{
  table(
    columns: (1fr, auto),
    inset: 10pt,
    table.header([Indicador], [Valor]),
    [Renda Total], [${formatCurrency(income)}],
    [Gastos Totais], [${formatCurrency(expense)}],
    [Saldo do Mês], [${formatCurrency(balance)}],
    [Investimentos], [${formatCurrency(investment)}],
  )
}
= Gastos por Categoria
#{
  table(
    columns: (1fr, auto, auto),
    inset: 10pt,
    table.header([Categoria], [Valor], [%]),
    ${categories.map((c) => `[${c.name}], [${c.amount}], [${c.percentage}]`).join(',\n    ')}
  )
}`;

			const pdfData = await typst.pdf({ mainContent: typstSource });
			if (!pdfData) throw new Error('Falha ao gerar PDF');
			const blob = new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `tabelhafin-${report.yearMonth}.pdf`;
			link.click();
			URL.revokeObjectURL(url);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Erro ao gerar PDF';
		} finally {
			isGenerating = false;
		}
	}
</script>

<svelte:head>
	<title>Relatórios — TabelhaFin</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-6">Relatórios</h1>

{#if loading}
	<Card>
		<EmptyState>Carregando...</EmptyState>
	</Card>
{:else if report}
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Relatório de {report.yearMonth}</CardTitle>
					<CardDescription>
						Gerado em {new Date(report.generatedAt).toLocaleDateString('pt-BR')}
					</CardDescription>
				</div>
				<Button onclick={generatePdf} disabled={isGenerating}>
					{isGenerating ? 'Gerando...' : 'Baixar PDF'}
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if error}
				<p class="text-sm text-red-600 mb-4">{error}</p>
			{/if}
			<div class="rounded-md bg-muted p-4">
				<p class="text-sm">
					{report.summary.narrative ?? 'Relatório financeiro do mês.'}
				</p>
			</div>
		</CardContent>
	</Card>
{:else}
	<Card>
		<EmptyState>
			Nenhum relatório disponível ainda. Relatórios são gerados no dia 1 de cada mês.
		</EmptyState>
	</Card>
{/if}
