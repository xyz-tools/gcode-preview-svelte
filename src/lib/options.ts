import type { GCodePreview, GCodePreviewOptions } from 'gcode-preview';
import type { HTMLCanvasAttributes } from 'svelte/elements';

/** Every core option except `canvas`, which the component provides. */
export type GCodePreviewOptionProps = Omit<GCodePreviewOptions, 'canvas'>;

/** Options with a setter: changing the prop updates the preview in place. */
export const LIVE_OPTIONS = [
  'buildVolume',
  'backgroundColor',
  'extrusionColor',
  'travelColor',
  'topLayerColor',
  'lastSegmentColor',
  'boundingBoxColor',
  'startLayer',
  'endLayer',
  'renderExtrusion',
  'renderTravel',
  'renderTubes',
  'lineWidth',
  'lineHeight',
  'extrusionWidth',
  'disableGradient',
  'orthographic',
  'devMode'
] as const satisfies readonly (keyof GCodePreviewOptionProps)[];

/** Options without a setter: read once when the preview is created. */
export const MOUNT_OPTIONS = [
  'initialCameraPosition',
  'minLayerThreshold',
  'droppable',
  'keepLines',
  'liveRenderInterval',
  'arcChordTolerance'
] as const satisfies readonly (keyof GCodePreviewOptionProps)[];

// a core option missing from both lists turns this into a type error, so a new
// option can't silently end up as a DOM attribute on the canvas
type Unlisted = Exclude<
  keyof GCodePreviewOptionProps,
  (typeof LIVE_OPTIONS)[number] | (typeof MOUNT_OPTIONS)[number]
>;
const allListed: [Unlisted] extends [never] ? true : Unlisted = true;
void allListed;

export const OPTION_KEYS: readonly string[] = [...LIVE_OPTIONS, ...MOUNT_OPTIONS];

/**
 * Live options whose setter accepts `undefined`. Setting any other live option
 * to `undefined` is skipped, so the preview keeps its last value.
 */
export const UNDEFINED_ALLOWED: ReadonlySet<string> = new Set<(typeof LIVE_OPTIONS)[number]>([
  'startLayer',
  'endLayer',
  'topLayerColor',
  'lastSegmentColor',
  'boundingBoxColor',
  'buildVolume',
  'lineHeight',
  'extrusionWidth',
  'devMode'
]);

export type GCodePreviewProps = GCodePreviewOptionProps &
  // onload/onerror would clash with the DOM event handler attributes
  Omit<HTMLCanvasAttributes, keyof GCodePreviewOptionProps | 'onload' | 'onerror' | 'children'> & {
    /** URL to fetch and stream in. Ignored while `gcode` is set. */
    src?: string | URL;
    /** G-code text to process directly. Wins over `src` when both are set. */
    gcode?: string | string[];
    /** The `GCodePreview` instance, for `bind:preview`. Set once created, unset on destroy. */
    preview?: GCodePreview;
    /** Called once the preview has been created. */
    onready?: (preview: GCodePreview) => void;
    /** Called when a load has finished rendering. */
    onload?: (preview: GCodePreview) => void;
    /** Called when a load fails. Without it, the error is logged to the console. */
    onerror?: (error: Error) => void;
  };
