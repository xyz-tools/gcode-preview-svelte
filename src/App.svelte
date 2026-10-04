<script lang="ts">
  import GCodePreview from './lib';

  const samples = ['square-tower.gcode', 'triangle-tower.gcode'];
  // the samples are 40mm cubes centred at (100, 100)
  const buildVolume = { x: 200, y: 200, z: 100, smallGrid: undefined };
  const initialCameraPosition = [0, 150, 200];

  let sample = $state(samples[0]);
  let loading = $state(true);
  let error = $state('');

  function select(name: string) {
    if (name === sample) return;
    sample = name;
    loading = true;
    error = '';
  }
</script>

<main>
  <h1>GCode Preview 3.0 with Vite + Svelte</h1>

  <GCodePreview
    class="preview"
    src={`${import.meta.env.BASE_URL}${sample}`}
    droppable
    extrusionColor="lime"
    {buildVolume}
    {initialCameraPosition}
    onload={() => (loading = false)}
    onerror={(cause) => {
      loading = false;
      error = cause.message;
    }}
  />
  <!-- the status line keeps its space whether or not it has text, so showing a
       message does not reflow the page below the preview -->
  <div class="status">
    <p role="status">{loading ? 'Loading G-code…' : ''}</p>
    <p role="alert">{error}</p>
  </div>

  {#each samples as name (name)}
    <button onclick={() => select(name)}>{name}</button>
  {/each}
</main>

<style>
  /* the component renders a bare canvas, sized here */
  main :global(.preview) {
    cursor: grab;
    width: 100%;
    max-width: 600px;
    height: 400px;
  }

  /* loading and error are mutually exclusive, so one line is enough */
  .status {
    min-height: 1.5em;
    min-height: 1lh;
  }

  .status p {
    margin: 0;
  }
</style>
