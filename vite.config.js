import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_TARGET || 'http://150.129.156.37:3003',
        changeOrigin: true,
      },
    },
  },
});
