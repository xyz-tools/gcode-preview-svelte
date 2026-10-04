# gcode-preview-svelte

A Svelte 5 component for [GCode Preview](https://github.com/xyz-tools/gcode-preview):
a 3D preview of G-code files, rendered with three.js into a `<canvas>`. It
creates and disposes the preview for you, loads a file from a URL or a string,
and keeps the preview in sync with its props.

The repo also holds a small demo app that uses the component from source.

## Install

```sh
npm install gcode-preview-svelte gcode-preview
```

`gcode-preview` (`^3.0.0-alpha.6`) and `svelte` (`^5.0.0`) are peer
dependencies.

## Usage

```svelte
<script lang="ts">
  import GCodePreview from 'gcode-preview-svelte';
</script>

<GCodePreview
  src="/benchy.gcode"
  style="width: 100%; height: 400px"
  buildVolume={{ x: 250, y: 220, z: 150, smallGrid: true }}
  topLayerColor="lime"
  onerror={(error) => console.warn(error.message)}
/>
```

The component is also exported by name (`import { GCodePreview } from
'gcode-preview-svelte'`), along with its `GCodePreviewProps` type.

## Props

### Loading

| Prop    | Type                 | Description                                                |
| ------- | -------------------- | ---------------------------------------------------------- |
| `src`   | `string \| URL`      | URL of a G-code file. It is fetched and streamed in.       |
| `gcode` | `string \| string[]` | G-code to process directly. If both are set, `gcode` wins. |

Changing `src` or `gcode` clears the preview and starts a new load; a load
that is still running is aborted. Unsetting both clears the preview. A new
`gcode` array starts a new load even if its lines are the same.

### Preview options

Every option of the core `GCodePreview` (except `canvas`) is a prop, with the
type from `gcode-preview`. See the
[core documentation](https://gcode-preview.web.app/docs) for what each one
does. An option you don't pass is not passed to the core either, so the core
default applies.

**Live options** update the preview in place when the prop changes:

`buildVolume`, `backgroundColor`, `extrusionColor`, `travelColor`,
`topLayerColor`, `lastSegmentColor`, `boundingBoxColor`, `startLayer`,
`endLayer`, `renderExtrusion`, `renderTravel`, `renderTubes`, `lineWidth`,
`lineHeight`, `extrusionWidth`, `disableGradient`, `orthographic`, `devMode`

Only options whose value changed are applied, compared by identity. Inline
objects and arrays such as `buildVolume={{ x: 200, y: 200, z: 100 }}` are fine:
Svelte only creates a new one when something it reads changes. `startLayer`
and `endLayer` are applied again after each load, because the core clamps them
to the loaded layer count.

Changing a live option back to `undefined` resets it for `startLayer`,
`endLayer`, `topLayerColor`, `lastSegmentColor`, `boundingBoxColor`,
`buildVolume`, `lineHeight`, `extrusionWidth` and `devMode`. The other live
options keep their last value, because their core setters don't accept
`undefined`.

**Mount-only options** are read once, when the preview is created. Later
changes are ignored; remount the component (for example with `{#key}`) to
apply them:

`initialCameraPosition`, `minLayerThreshold`, `droppable`, `keepLines`,
`liveRenderInterval`, `arcChordTolerance`

### Canvas attributes

Any other prop (`class`, `style`, `id`, `aria-*`, `tabindex`, …) is passed to
the `<canvas>`. It gets `aria-label="G-code preview"` unless you pass your own.

## Callbacks

| Prop      | Called with   | When                                                                                       |
| --------- | ------------- | ------------------------------------------------------------------------------------------ |
| `onready` | `GCodePreview` | The preview has been created.                                                              |
| `onload`  | `GCodePreview` | A load has finished rendering, and `startLayer`/`endLayer` have been applied. See below.   |
| `onerror` | `Error`        | A load failed, e.g. `HTTP 404: /benchy.gcode`. Without `onerror`, it is logged with `console.error`. |

For a `src` load, rendering finishes after the closing render animation, which
is driven by `requestAnimationFrame` and so only advances while the page is
visible.

A load that was replaced by a newer one, or that was still running when the
component was destroyed, fires neither `onload` nor `onerror`.

## Instance access

Bind `preview` to get the core `GCodePreview` instance, for anything the props
don't cover (the camera, the parsed job, …). It is set once the preview has
been created and unset when the component is destroyed.

```svelte
<script lang="ts">
  import GCodePreview from 'gcode-preview-svelte';
  import type { GCodePreview as Preview } from 'gcode-preview';

  let preview = $state.raw<Preview>();
</script>

<GCodePreview bind:preview gcode={'G1 X10 Y10 E1'} />
<p>{preview ? 'ready' : 'starting…'}</p>
```

Use `$state.raw` (or a plain variable) rather than `$state` for it: the
instance and its three.js objects should not be made deeply reactive.

## Sizing

The component renders a bare `<canvas>` with no styles of its own: size the
canvas with CSS, through `class` or `style`. A `ResizeObserver` keeps the
renderer in step with the canvas size, so a fluid size like `width: 100%`
just works.

## Development

```sh
npm install
npm run dev          # demo app
npm run build:demo   # demo production build, into build/ (deployed to Firebase Hosting)
npm run preview      # serve the demo build locally
npm run build        # the library, into dist/
npm test
npm run check        # svelte-check / TypeScript
npm run lint:package # publint
```

Needs Node 20.19+ or 22.12+. The component lives in `src/lib/`; the demo in
`src/App.svelte` imports it from there.

`package.json` has `"private": true`, which keeps the package from being
published by accident. Remove it when publishing the first release.

### Samples

`public/square-tower.gcode` and `public/triangle-tower.gcode` are small
synthetic samples — 40 mm cubes centred at (100, 100) — not printer-ready
G-code. Drop your own files in `public/` to try them in the demo.
