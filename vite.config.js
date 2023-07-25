import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/upload': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploaded_files': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/test_500_error': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    }
  }
})
