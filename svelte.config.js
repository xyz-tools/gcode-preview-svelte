import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
export default {
  // script: true strips the TypeScript, so svelte-package ships plain JS
  preprocess: vitePreprocess({ script: true })
};
