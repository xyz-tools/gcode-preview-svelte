/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ mode }) => ({
  plugins: [svelte()],
  // dist/ holds the library build, so the demo builds elsewhere
  build: { outDir: 'build' },
  // without the browser condition, tests would load Svelte's server build
  resolve: mode === 'test' ? { conditions: ['browser'] } : undefined,
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts']
  }
}));
