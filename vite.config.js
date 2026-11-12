import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Where the dev server forwards /api calls when VITE_API_URL is empty (same-origin mode).
  const proxyTarget = (env.VITE_API_PROXY_TARGET || env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Public tunnel hosts allowed to reach the dev server (ngrok). A leading dot allows any subdomain.
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app', '.ngrok.dev'],
      proxy: {
        '/api': proxyTarget,
        '/health': proxyTarget,
        '/ready': proxyTarget,
      },
    },
  };
});
