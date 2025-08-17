/**
 * Vite configuration for building EmbersCore library bundle
 * Produces minified, self-contained JavaScript for on-chain inscription
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/embers-core/index.ts'),
      name: 'EmbersCore',
      fileName: 'embers-core',
      formats: ['iife'] // Self-contained format for inscription
    },
    outDir: 'src/lib/dist/embers-core',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      mangle: {
        properties: false // Keep function names readable
      },
      format: {
        comments: false,
        ascii_only: true // Ensure compatibility
      }
    },
    sourcemap: true,
    rollupOptions: {
      external: [], // No external dependencies
      output: {
        entryFileNames: 'embers-core.min.js',
        format: 'iife',
        name: 'EmbersCore',
        exports: 'named',
        compact: true,
        generatedCode: {
          constBindings: true
        }
      }
    },
    target: 'es2015', // Wide browser compatibility
    reportCompressedSize: true
  }
});