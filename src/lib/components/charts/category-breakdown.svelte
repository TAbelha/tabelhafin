<script lang="ts">
	import { BarChart } from "layerchart";
	import { scaleBand } from "d3-scale";
	import * as Chart from "$lib/components/ui/chart";
	import { formatCurrency } from "$lib/utils/format";

	let { data }: { data: { name: string; expense: number }[] } = $props();

	const chartConfig = {
		expense: {
			label: "Gasto",
			color: "var(--color-primary)",
		},
	} satisfies Chart.ChartConfig;
</script>

<Chart.Container config={chartConfig} class="h-[300px] w-full">
	<BarChart
		data={data.slice(0, 8)}
		xScale={scaleBand().padding(0.25)}
		x="name"
		y="expense"
		axis="x"
		series={[
			{
				key: "expense",
				label: chartConfig.expense.label,
				color: chartConfig.expense.color,
			},
		]}
		props={{
			xAxis: {
				format: (d: string) => d.slice(0, 8),
			},
			yAxis: {
				format: (d: number) => formatCurrency(d),
			},
		}}
	>
		{#snippet tooltip()}
			<Chart.Tooltip />
		{/snippet}
	</BarChart>
</Chart.Container>
