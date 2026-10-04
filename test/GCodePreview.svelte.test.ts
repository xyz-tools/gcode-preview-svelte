import { GCodePreview } from 'gcode-preview';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, expect, test, vi, type Mock } from 'vitest';
import Preview, { type GCodePreviewProps } from '../src/lib';

vi.mock('gcode-preview', () => ({ GCodePreview: vi.fn() }));

type MockPreview = {
  processGCode: Mock;
  processGCodeStream: Mock;
  clear: Mock;
  dispose: Mock;
  devMode?: unknown;
  sceneManager: Record<string, unknown> & { resize: Mock };
  // every option setter call, in order, as [key, value]
  sets: [string, unknown][];
};

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: () => void) {
    FakeResizeObserver.instances.push(this);
  }
}

let target: HTMLElement;
let component: ReturnType<typeof mount> | undefined;
let instances: MockPreview[];
const originalFetch = globalThis.fetch;
const originalDecoder = globalThis.TextDecoderStream;
const originalObserver = globalThis.ResizeObserver;

beforeEach(() => {
  instances = [];
  FakeResizeObserver.instances = [];
  globalThis.TextDecoderStream = class {} as unknown as typeof TextDecoderStream;
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
  vi.mocked(GCodePreview).mockImplementation(function () {
    const sets: [string, unknown][] = [];
    const record = <T extends object>(object: T) =>
      new Proxy(object, {
        set(obj, key, value) {
          sets.push([String(key), value]);
          return Reflect.set(obj, key, value);
        }
      });
    const instance = record({
      processGCode: vi.fn().mockResolvedValue(undefined),
      processGCodeStream: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
      dispose: vi.fn(),
      sceneManager: record({ resize: vi.fn() }),
      sets
    });
    instances.push(instance);
    return instance as unknown as GCodePreview;
  });
  target = document.createElement('div');
  document.body.appendChild(target);
});

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  target.remove();
  globalThis.fetch = originalFetch;
  globalThis.TextDecoderStream = originalDecoder;
  globalThis.ResizeObserver = originalObserver;
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function render(props: GCodePreviewProps) {
  component = mount(Preview, { target, props });
  flushSync();
  return target.querySelector('canvas')!;
}

// lets pending fetch/process promises run their continuations
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function response() {
  return { ok: true, body: { pipeThrough: vi.fn(() => 'decoded stream') } };
}

test('creates the preview with the canvas and only the given options', () => {
  globalThis.fetch = vi.fn().mockResolvedValue(response());
  const onready = vi.fn();
  const canvas = render({
    src: '/a.gcode',
    extrusionColor: 'red',
    droppable: true,
    onready,
    onload: vi.fn(),
    onerror: vi.fn()
  });

  expect(GCodePreview).toHaveBeenCalledTimes(1);
  expect(vi.mocked(GCodePreview).mock.calls[0][0]).toEqual({
    canvas,
    extrusionColor: 'red',
    droppable: true
  });
  expect(vi.mocked(GCodePreview).mock.calls[0][0]).not.toHaveProperty('renderExtrusion');
  expect(onready).toHaveBeenCalledWith(instances[0]);
});

test('passes attributes to the canvas but keeps options and callbacks off it', () => {
  const onerror = vi.fn();
  let canvas = render({ class: 'big', id: 'p', droppable: true, onerror });
  expect(canvas.getAttribute('class')).toBe('big');
  expect(canvas.id).toBe('p');
  expect(canvas.getAttribute('aria-label')).toBe('G-code preview');
  expect(canvas.hasAttribute('droppable')).toBe(false);
  canvas.dispatchEvent(new Event('error'));
  expect(onerror).not.toHaveBeenCalled();

  unmount(component!);
  canvas = render({ 'aria-label': 'Benchy' });
  expect(canvas.getAttribute('aria-label')).toBe('Benchy');
});

test('streams a decoded src, then applies the layers and fires onload', async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(response());
  const onload = vi.fn();
  render({ src: '/a.gcode', startLayer: 20, endLayer: 150, onload });
  await settle();

  const preview = instances[0];
  expect(globalThis.fetch).toHaveBeenCalledWith('/a.gcode', expect.objectContaining({}));
  expect(preview.clear).toHaveBeenCalledTimes(1);
  expect(preview.processGCodeStream).toHaveBeenCalledWith('decoded stream');
  expect(preview.sets.slice(-2)).toEqual([
    ['startLayer', 20],
    ['endLayer', 150]
  ]);
  expect(onload).toHaveBeenCalledWith(preview);
});

test('processes gcode directly, and gcode wins over src', async () => {
  globalThis.fetch = vi.fn();
  const onload = vi.fn();
  render({ src: '/a.gcode', gcode: 'G1 X1', onload });
  await settle();

  expect(globalThis.fetch).not.toHaveBeenCalled();
  expect(instances[0].processGCode).toHaveBeenCalledWith('G1 X1');
  expect(onload).toHaveBeenCalledTimes(1);
});

test('replacing src aborts the old fetch and ignores its late response', async () => {
  let resolveOld!: (value: unknown) => void;
  globalThis.fetch = vi
    .fn()
    .mockImplementationOnce(() => new Promise((resolve) => (resolveOld = resolve)))
    .mockResolvedValue(response());
  const onload = vi.fn();
  const props = $state<GCodePreviewProps>({ src: '/old.gcode', onload });
  render(props);

  props.src = '/new.gcode';
  flushSync();
  await settle();
  resolveOld(response());
  await settle();

  const fetch = vi.mocked(globalThis.fetch);
  expect(fetch.mock.calls[0][1]!.signal!.aborted).toBe(true);
  expect(fetch.mock.calls[1][0]).toBe('/new.gcode');
  expect(instances).toHaveLength(1);
  expect(instances[0].processGCodeStream).toHaveBeenCalledTimes(1);
  expect(onload).toHaveBeenCalledTimes(1);
});

test('clears the preview when src and gcode both become unset', async () => {
  const props = $state<GCodePreviewProps>({ gcode: 'G1 X1' });
  render(props);
  await settle();
  expect(instances[0].clear).toHaveBeenCalledTimes(1);

  props.gcode = undefined;
  flushSync();
  expect(instances[0].clear).toHaveBeenCalledTimes(2);
});

test('applies only changed live options, and ignores mount-only ones', async () => {
  const props = $state<GCodePreviewProps>({
    extrusionColor: 'red',
    renderTravel: true,
    topLayerColor: 'blue',
    droppable: true
  });
  render(props);
  const preview = instances[0];
  preview.sets.length = 0;

  props.extrusionColor = 'green';
  flushSync();
  expect(preview.sets).toEqual([['extrusionColor', 'green']]);

  props.devMode = true;
  flushSync();
  expect(preview.sets).toEqual([
    ['extrusionColor', 'green'],
    ['devMode', true]
  ]);
  expect(preview.devMode).toBe(true);

  preview.sets.length = 0;
  props.droppable = false;
  props.initialCameraPosition = [1, 2, 3];
  flushSync();
  expect(preview.sets).toEqual([]);
  expect(GCodePreview).toHaveBeenCalledTimes(1);

  // renderTravel's setter takes no undefined, so the preview keeps its value
  props.renderTravel = undefined;
  props.topLayerColor = undefined;
  flushSync();
  expect(preview.sets).toEqual([['topLayerColor', undefined]]);
});

test('reports a failed fetch to onerror', async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
  const onerror = vi.fn();
  const onload = vi.fn();
  render({ src: '/missing.gcode', onerror, onload });
  await settle();

  expect(onerror).toHaveBeenCalledTimes(1);
  expect(onerror.mock.calls[0][0]).toBeInstanceOf(Error);
  expect(onerror.mock.calls[0][0].message).toBe('HTTP 404: /missing.gcode');
  expect(onload).not.toHaveBeenCalled();
});

test('logs a failed fetch without an onerror handler', async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  render({ src: '/missing.gcode' });
  await settle();

  expect(consoleError).toHaveBeenCalledTimes(1);
  expect(consoleError.mock.calls[0][0]).toEqual(new Error('HTTP 404: /missing.gcode'));
});

test('resizes on ResizeObserver callbacks and cleans up on unmount', async () => {
  globalThis.fetch = vi.fn(() => new Promise<Response>(() => {}));
  const canvas = render({ src: '/a.gcode' });
  const preview = instances[0];
  const [observer] = FakeResizeObserver.instances;
  expect(observer.observe).toHaveBeenCalledWith(canvas);

  observer.callback();
  expect(preview.sceneManager.resize).toHaveBeenCalledTimes(1);

  unmount(component!);
  component = undefined;
  expect(vi.mocked(globalThis.fetch).mock.calls[0][1]!.signal!.aborted).toBe(true);
  expect(observer.disconnect).toHaveBeenCalledTimes(1);
  expect(preview.dispose).toHaveBeenCalledTimes(1);
});

test('binds the preview instance, and unsets it on destroy', () => {
  // the accessor pair is what the compiler generates for bind:preview
  let bound: GCodePreview | undefined;
  render({
    get preview() {
      return bound;
    },
    set preview(value) {
      bound = value;
    }
  });
  expect(bound).toBe(instances[0]);

  unmount(component!);
  component = undefined;
  expect(bound).toBeUndefined();
});
