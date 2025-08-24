// vite.config.ts (Combined configuration to exclude 'lucide-react' from dependency optimization and enable proxying for CORS/Fetch issues)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Proxy to backend port
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')  // Strip '/api' if backend doesn't expect it
      }
    }
  }
});