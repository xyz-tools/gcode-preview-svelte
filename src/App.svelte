<script>
  import svelteLogo from './assets/svelte.svg'
  import GCodePreview from './lib/GCodePreview.svelte';
  
  let gcodeSrc = `${import.meta.env.BASE_URL}square-tower.gcode`;
</script>

<main>
  <div>
    <a href="https://vitejs.dev" target="_blank"> 
      <img src={`${import.meta.env.BASE_URL}vite.svg`} class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank"> 
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>

  <h1>GCode Preview 3.0 with Vite + Svelte</h1>

  <div>
    <GCodePreview src={gcodeSrc} />
  </div>
  <button on:click={() => gcodeSrc = `${import.meta.env.BASE_URL}square-tower.gcode`}>square-tower.gcode</button>
  <button on:click={() => gcodeSrc = `${import.meta.env.BASE_URL}triangle-tower.gcode`}>triangle-tower.gcode</button>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
</style>
