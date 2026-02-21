import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import dotenv from 'dotenv';

export default defineConfig(({mode}) => {
  dotenv.config(); // 預設讀取 .env
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // 移除 process.env.GEMINI_API_KEY 的硬編碼綁定，避免後端 Key 暴露
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: undefined,
          inlineDynamicImports: true,
        },
      },
      chunkSizeWarningLimit: 100,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
