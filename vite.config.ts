import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public', // 👈 ensures admin folder is copied
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
