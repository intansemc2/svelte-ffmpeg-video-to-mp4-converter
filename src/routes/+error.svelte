<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="w-full h-screen flex items-center justify-center fixed">
	<div class="hero min-h-screen bg-base-200">
		<div class="hero-content text-center">
			<div class="max-w-md">
				<h1 class="text-9xl font-bold">{$page.status}</h1>
				<div>{$page.error?.message}</div>
			</div>
		</div>
	</div>
</div>
