import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({
  root,
  base: './',
  publicDir: false,
  build: {
    outDir: process.env.VILA_LAB_OUT ?? fileURLToPath(new URL('../../../after-rain-vila-v31/viewer-build', import.meta.url)),
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: { input: fileURLToPath(new URL('../../vila-assets.html', import.meta.url)) },
  },
});
