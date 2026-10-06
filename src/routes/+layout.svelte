<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher } from 'mode-watcher';

	let { children, data } = $props();
</script>

<ModeWatcher defaultMode="system" nonce={data.nonce} />
<Toaster />
{@render children()}
