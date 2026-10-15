import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        // three.js only loads with the lazy sculpture, while the intro plays.
        manualChunks(id) {
          if (id.includes('preload-helper')) return 'react'
          if (!id.includes('node_modules')) return
          if (/node_modules\/(three|@react-three|three-stdlib|troika|camera-controls|maath|meshline|stats)/.test(id)) return 'three'
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          if (/node_modules\/(gsap|@gsap|lenis)\//.test(id)) return 'motion'
        },
      },
    },
  },
})
