import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  base: '/MazeMind-TFG/',
  resolve: {
    alias: {
      'lucide-react': path.resolve(__dirname, 'src/vendor/lucide-react.tsx'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})