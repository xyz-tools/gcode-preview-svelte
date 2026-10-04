<script lang="ts">
  // aliased: the generated declaration names the component GCodePreview too
  import { GCodePreview as Core, type GCodePreviewOptions } from 'gcode-preview';
  import { onMount, untrack } from 'svelte';
  import {
    LIVE_OPTIONS,
    OPTION_KEYS,
    UNDEFINED_ALLOWED,
    type GCodePreviewProps
  } from './options.js';

  let {
    src,
    gcode,
    preview = $bindable(),
    onready,
    onload,
    onerror,
    ...rest
  }: GCodePreviewProps = $props();

  // rest holds both the core options and the canvas attributes; only the
  // latter belong on the element
  const option = (key: string) => (rest as Record<string, unknown>)[key];
  const attributes = $derived(
    Object.fromEntries(Object.entries(rest).filter(([key]) => !OPTION_KEYS.includes(key)))
  );

  let canvas: HTMLCanvasElement;
  // plain variables: the preview and its three.js objects must not be made
  // deeply reactive
  let instance: Core | undefined;
  let controller: AbortController | undefined;
  // identifies the current load, so a superseded or unmounted one bails out
  let loadId = 0;
  let hasJob = false;
  // the live option values the preview was last given
  const applied: Record<string, unknown> = {};

  onMount(() => {
    const initial: Record<string, unknown> = {};
    for (const key of OPTION_KEYS) {
      if (option(key) !== undefined) initial[key] = option(key);
    }
    for (const key of LIVE_OPTIONS) applied[key] = option(key);

    const created = (instance = new Core({ ...(initial as GCodePreviewOptions), canvas }));
    preview = created;

    const observer = new ResizeObserver(() => created.sceneManager.resize());
    observer.observe(canvas);

    onready?.(created);

    return () => {
      loadId++;
      controller?.abort();
      observer.disconnect();
      created.dispose();
      instance = undefined;
      preview = undefined;
    };
  });

  $effect(() => {
    const values = LIVE_OPTIONS.map((key) => [key, option(key)] as const);
    if (!instance) return;
    for (const [key, value] of values) {
      // some setters rebuild geometry, so only touch what changed
      if (Object.is(value, applied[key])) continue;
      if (value === undefined && !UNDEFINED_ALLOWED.has(key)) continue;
      applied[key] = value;
      const target = key === 'devMode' ? instance : instance.sceneManager;
      (target as unknown as Record<string, unknown>)[key] = value;
    }
  });

  $effect(() => {
    const nextGcode = gcode;
    const nextSrc = src;
    untrack(() => load(nextGcode, nextSrc));
  });

  async function load(nextGcode: typeof gcode, nextSrc: typeof src) {
    if (!instance) return;
    const current = instance;
    const id = ++loadId;
    controller?.abort();
    controller = undefined;

    if (nextGcode == null && nextSrc == null) {
      if (hasJob) current.clear();
      hasJob = false;
      return;
    }

    // clear() drops the previous job and cancels a stream still being read
    current.clear();
    hasJob = true;

    try {
      if (nextGcode != null) {
        await current.processGCode(nextGcode);
      } else {
        const abort = (controller = new AbortController());
        const response = await fetch(nextSrc!, { signal: abort.signal });
        if (id !== loadId) return;
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${nextSrc}`);
        if (!response.body) throw new Error(`Empty response body: ${nextSrc}`);
        // the reader splits chunks on newlines, so it needs text, not bytes
        await current.processGCodeStream(response.body.pipeThrough(new TextDecoderStream()));
      }
      if (id !== loadId) return;

      // the layer setters clamp against the loaded job, so set them again now
      // that it is complete
      const { startLayer, endLayer } = rest;
      current.sceneManager.startLayer = applied.startLayer = startLayer;
      current.sceneManager.endLayer = applied.endLayer = endLayer;
      onload?.(current);
    } catch (cause) {
      if (id !== loadId) return;
      const error = cause instanceof Error ? cause : new Error(String(cause));
      if (onerror) onerror(error);
      else console.error(error);
    }
  }
</script>

<canvas bind:this={canvas} aria-label="G-code preview" {...attributes}></canvas>
