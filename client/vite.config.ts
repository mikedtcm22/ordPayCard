import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Fix for @ordzaar/ord-connect module resolution
      '@ordzaar/ord-connect': path.resolve(__dirname, '../node_modules/@ordzaar/ord-connect/dist/index.js'),
    },
  },
  define: {
    // Define environment variables for production/development
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  server: {
    port: 3000,
  },
  optimizeDeps: {
    // Force Vite to pre-bundle these dependencies
    include: ['@ordzaar/ord-connect', '@ordzaar/ordit-sdk'],
    // Exclude packages that have issues with pre-bundling
    exclude: [],
  },
  build: {
    // Ensure CommonJS and ESM interop
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
