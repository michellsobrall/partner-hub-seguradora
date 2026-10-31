import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget =
    process.env.VITE_API_PROXY_TARGET ||
    fileEnv.VITE_API_PROXY_TARGET ||
    'http://localhost:8080';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: Number(process.env.VITE_PORT || fileEnv.VITE_PORT) || 5173,
      host: true,
      allowedHosts: true,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
