import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // API Gateway
        changeOrigin: true,
        timeout: 60000, // 60 seconds timeout
        proxyTimeout: 60000, // 60 seconds proxy timeout
      },
      // Socket.IO disabled - no real-time features
      // '/socket.io': {
      //   target: 'http://localhost:4000', // Socket Service
      //   changeOrigin: true,
      //   ws: true,
      // },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
