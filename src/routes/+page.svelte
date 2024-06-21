<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	import { FFmpeg } from '@ffmpeg/ffmpeg';
	import { toBlobURL, fetchFile } from '@ffmpeg/util';
	import { downloadObjectUrl } from '$lib/utils/download-file';

	//
	type AppState = 'loading' | 'ready' | 'convert.start' | 'convert.error' | 'convert.done';

	//
	let appState = $state<AppState>('loading');
	let errorMsg = $state<string>('');
	let ffmpeg = $state<FFmpeg>();

	let progress = tweened(0);

	//
	async function onDropedMedia(event: DragEvent) {
		errorMsg = '';
		if (!ffmpeg) return;

		event.preventDefault();
		if (!event.dataTransfer) return;

		if (event.dataTransfer.files.length > 1) {
			errorMsg = 'Upload one file';
			return;
		}

		const videoFile = event.dataTransfer.files[0];
		if (!videoFile.type.startsWith('video/')) {
			errorMsg = 'Upload a video file';
			return;
		}

		// Convert
		try {
			$progress = 0;
			appState = 'convert.start';

			const fileExt = videoFile.name.slice(videoFile.name.lastIndexOf('.'));
			const inputFile = `input${fileExt}`;
			await ffmpeg.writeFile(inputFile, await fetchFile(videoFile));
			await ffmpeg.exec(['-i', inputFile, 'output.mp4']);
			const outputFile = await ffmpeg.readFile('output.mp4');
			appState = 'convert.done';

			downloadObjectUrl(
				`${videoFile.name}.mp4`,
				URL.createObjectURL(new Blob([(outputFile as Uint8Array).buffer], { type: 'video/mp4' }))
			);
		} catch (error) {
			appState = 'convert.error';
			errorMsg = String(error);
		}
	}

	function onDragOver(event: Event) {
		event.preventDefault();
	}

	//
	async function loadFFmpeg() {
		ffmpeg = new FFmpeg();
		await ffmpeg.load({
			coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, 'text/javascript'),
			wasmURL: await toBlobURL(`/ffmpeg/ffmpeg-core.wasm`, 'application/wasm'),
			workerURL: await toBlobURL(`/ffmpeg/ffmpeg-core.worker.js`, 'text/javascript')
		});
		appState = 'ready';

		$progress = 0;
		ffmpeg.on('progress', (event) => {
			$progress = event.progress * 100;
		});
	}

	//
	$effect(() => console.log('[STATE] ', appState));

	//
	onMount(() => {
		loadFFmpeg();
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col items-center justify-center w-screen h-screen gap-10">
	<h1 class="text-3xl font-bold">Video to MP4 converter</h1>

	<div
		class="w-[500px] h-[500px] aspect-square border-[10px] border-dashed rounded-[50px] border-gray-500 flex flex-col gap-1 items-center justify-center"
		style="border: reverse-layer"
		ondrop={onDropedMedia}
		ondragover={onDragOver}
		data-state={appState}
	>
		{#if appState == 'loading'}
			<div class="flex items-center gap-2" in:fade>
				<span class="text-xl">Loading FFMPEG</span>
				<span class="loading loading-dots loading-md"></span>
			</div>
		{/if}

		{#if appState == 'ready'}
			<span in:fade class="text-xl">Drop video here</span>
		{/if}

		{#if appState == 'convert.start'}
			<span in:fade class="text-xl">Convert video {$progress.toFixed(0)}%</span>
			<progress class="progress w-64 h-5" value={$progress} max="100"></progress>
		{/if}

		{#if appState == 'convert.done'}
			<span in:fade class="text-2xl">Done 🎉</span>
		{/if}

		{#if errorMsg}
			<span in:fade class="text-red-600">{errorMsg}</span>
		{/if}
	</div>
</div>
