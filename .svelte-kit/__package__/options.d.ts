import type { GCodePreview, GCodePreviewOptions } from 'gcode-preview';
import type { HTMLCanvasAttributes } from 'svelte/elements';
/** Every core option except `canvas`, which the component provides. */
export type GCodePreviewOptionProps = Omit<GCodePreviewOptions, 'canvas'>;
/** Options with a setter: changing the prop updates the preview in place. */
export declare const LIVE_OPTIONS: readonly ["buildVolume", "backgroundColor", "extrusionColor", "travelColor", "topLayerColor", "lastSegmentColor", "boundingBoxColor", "startLayer", "endLayer", "renderExtrusion", "renderTravel", "renderTubes", "lineWidth", "lineHeight", "extrusionWidth", "disableGradient", "orthographic", "devMode"];
/** Options without a setter: read once when the preview is created. */
export declare const MOUNT_OPTIONS: readonly ["initialCameraPosition", "minLayerThreshold", "droppable", "keepLines", "liveRenderInterval", "arcChordTolerance"];
export declare const OPTION_KEYS: readonly string[];
/**
 * Live options whose setter accepts `undefined`. Setting any other live option
 * to `undefined` is skipped, so the preview keeps its last value.
 */
export declare const UNDEFINED_ALLOWED: ReadonlySet<string>;
export type GCodePreviewProps = GCodePreviewOptionProps & Omit<HTMLCanvasAttributes, keyof GCodePreviewOptionProps | 'onload' | 'onerror' | 'children'> & {
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
