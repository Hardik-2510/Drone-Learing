import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // ✅ Ensure relative asset paths for GitHub Pages/Vercel
  build: {
    chunkSizeWarningLimit: 2500, // Three.js is large, suppress warning
  },
})
