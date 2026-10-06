<script lang="ts">
	import { AreaChart } from "layerchart";
	import { scaleBand } from "d3-scale";
	import * as Chart from "$lib/components/ui/chart";
	import { formatCurrency } from "$lib/utils/format";

	let { data }: { data: { month: string; amount: number }[] } = $props();

	const chartConfig = {
		amount: {
			label: "Gastos",
			color: "var(--color-primary)",
		},
	} satisfies Chart.ChartConfig;
</script>

<Chart.Container config={chartConfig} class="h-[300px] w-full">
	<AreaChart
		data={data}
		xScale={scaleBand().padding(0.25)}
		x="month"
		y="amount"
		axis="x"
		series={[
			{
				key: "amount",
				label: chartConfig.amount.label,
				color: chartConfig.amount.color,
			},
		]}
		props={{
			yAxis: {
				format: (d: number) => formatCurrency(d),
			},
		}}
	>
		{#snippet tooltip()}
			<Chart.Tooltip />
		{/snippet}
	</AreaChart>
</Chart.Container>
