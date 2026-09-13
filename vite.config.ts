import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { coreAssets } from './build/core-assets.ts';
import { connectAssets } from './build/connect-assets.ts';

export default defineConfig({
  plugins: [react(), connectAssets(), coreAssets()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});


