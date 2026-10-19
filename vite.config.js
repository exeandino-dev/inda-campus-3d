import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

/** base './' funciona en GitHub Pages (proyecto) y en un subdominio / carpeta del VPS. */
export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  resolve: {
    alias: {
      'three/addons': path.join(root, 'node_modules/three/examples/jsm'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 900,
  },
});
