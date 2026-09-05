import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Non-www host 308-redirects to www; use the canonical host that resolves.
      '/api': { target: 'https://www.dipeshthapa23.com.np', changeOrigin: true },
      '/uploads': { target: 'https://www.dipeshthapa23.com.np', changeOrigin: true },
    },
    // Force the browser to always revalidate in dev so a stale/cached bundle
    // can never persist across server restarts (HMR disconnects drop old modules).
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'three';
            if (id.includes('react') || id.includes('scheduler')) return 'react';
          }
          return undefined;
        },
      },
    },
  },
})
