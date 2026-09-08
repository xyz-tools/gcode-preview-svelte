<script lang="ts">
import { GCodePreview } from 'gcode-preview';
import { onDestroy, onMount } from 'svelte';

export let src;

let canvas;
let preview;
// identifies the most recent load, so a fetch that resolves late can bail out
let loadId = 0;

$: {
    load(src);
}

onMount(() => {
    window['preview'] = preview = new GCodePreview({
        canvas,
        droppable: true,
        extrusionColor: 'lime'
    });

    load(src);
});

onDestroy(() => {
    preview?.dispose();
    preview = undefined;
});

async function load(src) {
    if (!preview) return;

    const id = ++loadId;

    // state persists across loads, so drop the previous job before streaming a
    // new one in. clear() also cancels a stream that is still being read.
    preview.clear();

    const response = await fetch(src);

    if (response.status !== 200) {
        throw new Error(`status code: ${response.status}`);
    }

    // a newer load started while we were fetching; that one owns the preview
    if (id !== loadId) return;

    // the reader splits chunks on newlines, so it needs text and not the raw
    // bytes that response.body yields
    const gcodeStream = response.body.pipeThrough(new TextDecoderStream());

    // the library parses and draws incrementally as the stream arrives
    await preview.processGCodeStream(gcodeStream);
}

</script>

<canvas
    bind:this={canvas}
    width={300}
    height={200}>
</canvas>


<style>
    canvas {
        cursor: grab;
    }
</style>
