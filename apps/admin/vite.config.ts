import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: {
      // Entwicklung: Admin-API läuft auf dem API-Server
      '/api': { target: 'http://localhost:4100', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
    },
  },
})
