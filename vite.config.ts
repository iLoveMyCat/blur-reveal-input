import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'demo',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BlurRevealInput',
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => `blur-reveal-input.${format}.js`,
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        globals: {},
      },
    },
    minify: 'terser',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3001,
    open: true,
    allowedHosts: true,
  },
});
