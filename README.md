# GCode Preview 3.0 with Svelte + Vite

This demo uses [GCode Preview](https://github.com/xyz-tools/gcode-preview)
`3.0.0-alpha.6` with Svelte 5 and Vite 8. Needs Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` writes a production build to
`dist/`; `npm run preview` serves that build locally.

## Component

```svelte
<script>
  import GCodePreview from './lib/GCodePreview.svelte';
</script>

<GCodePreview src={`${import.meta.env.BASE_URL}square-tower.gcode`} />
```

The wrapper constructs `new GCodePreview(...)` in an `$effect` with no reactive
reads, so the preview is built once and disposed on unmount. A second `$effect`
tracks `src` and feeds the response body to `processGCodeStream`, so the library
parses and draws incrementally while the file is still downloading.

Changing `src` clears the previous job and starts a fresh stream. A load that is
superseded while its fetch is still in flight bails out instead of drawing over
the newer one. Unmounting removes the resize listener and calls
`preview.dispose()`. Loading and failure states render below the canvas.

### Note on completion

In `3.0.0-alpha.6` the promise returned by `processGCode` and
`processGCodeStream` never settles, even though parsing and rendering finish
normally. The component therefore takes its completion signal from the
`onStreamEnd` callback rather than from awaiting the promise.

## Samples

`public/square-tower.gcode` and `public/triangle-tower.gcode` are small
synthetic samples — 40 mm cubes centred at (100, 100) — not printer-ready
G-code. Drop your own files in `public/` and point `src` at them.
