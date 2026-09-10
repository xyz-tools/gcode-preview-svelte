<script>
  import { GCodePreview } from 'gcode-preview';

  let { src } = $props();

  let canvas;
  let preview;
  // identifies the most recent load, so a fetch that resolves late can bail out
  let loadId = 0;
  let loading = $state(false);
  let error = $state('');

  const resize = () => preview?.sceneManager.resize();

  // no reactive reads, so this sets the preview up once and tears it down on
  // unmount. it is declared first, so the loading effect below can rely on it.
  $effect(() => {
    window['preview'] = preview = new GCodePreview({
      canvas,
      droppable: true,
      extrusionColor: 'lime',
      // the samples are 40mm cubes centred at (100, 100)
      buildVolume: { x: 200, y: 200, z: 100 },
      initialCameraPosition: [0, 150, 200]
    });

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      // any load still in flight sees the bumped id and leaves preview alone
      loadId++;
      preview?.dispose();
      preview = undefined;
    };
  });

  $effect(() => {
    load(src);
  });

  async function load(src) {
    if (!preview) return;

    const id = ++loadId;

    // state persists across loads, so drop the previous job before streaming a
    // new one in. clear() also cancels a stream that is still being read.
    preview.clear();
    loading = true;
    error = '';

    try {
      const response = await fetch(src);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${src}`);
      }

      // a newer load started while we were fetching; that one owns the preview
      if (id !== loadId) return;

      // the reader splits chunks on newlines, so it needs text and not the raw
      // bytes that response.body yields
      const gcodeStream = response.body.pipeThrough(new TextDecoderStream());

      // the library parses and draws incrementally as the stream arrives, and
      // resolves once the closing render animation has played out
      await preview.processGCodeStream(gcodeStream);

      if (id === loadId) loading = false;
    } catch (cause) {
      if (id !== loadId) return;
      loading = false;
      error = cause instanceof Error ? cause.message : String(cause);
    }
  }
</script>

<canvas bind:this={canvas} width={600} height={400} aria-label="G-code preview"></canvas>
{#if loading}<p role="status">Loading G-code…</p>{/if}
{#if error}<p role="alert">{error}</p>{/if}

<style>
  canvas {
    cursor: grab;
    width: 100%;
    max-width: 600px;
    height: 400px;
  }
</style>
