import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  define: {
    process: undefined
  },
  plugins: [react()],
  server: {
    host: true,
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 5137,
  },
  preview: {
    host: true,
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 5137,
  }
})
