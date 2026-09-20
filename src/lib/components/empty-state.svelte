<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CardContent } from '$lib/components/ui/card';

	let { children }: { children?: Snippet } = $props();
</script>

<CardContent class="py-12 text-center text-muted-foreground">
	{@render children?.()}
</CardContent>
