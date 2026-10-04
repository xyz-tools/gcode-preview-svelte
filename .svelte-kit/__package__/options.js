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
];
/** Options without a setter: read once when the preview is created. */
export const MOUNT_OPTIONS = [
    'initialCameraPosition',
    'minLayerThreshold',
    'droppable',
    'keepLines',
    'liveRenderInterval',
    'arcChordTolerance'
];
const allListed = true;
void allListed;
export const OPTION_KEYS = [...LIVE_OPTIONS, ...MOUNT_OPTIONS];
/**
 * Live options whose setter accepts `undefined`. Setting any other live option
 * to `undefined` is skipped, so the preview keeps its last value.
 */
export const UNDEFINED_ALLOWED = new Set([
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
