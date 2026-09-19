<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		fetch('/api/auth/sign-out', { method: 'POST' }).then(() => {
			window.location.href = '/login';
		});
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<p class="text-muted-foreground">Saindo...</p>
</div>
