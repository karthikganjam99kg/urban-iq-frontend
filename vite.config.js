import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Port 5000 is taken by AirPlay Receiver on macOS.
      '/api': process.env.BACKEND_URL || 'http://127.0.0.1:5001',
    },
  },
})