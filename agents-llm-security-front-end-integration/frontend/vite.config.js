import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Vite configuration for LLM Security Gateway Frontend.
 *
 * Key decisions:
 * - `@tailwindcss/vite` plugin uses Tailwind v4's new Vite-native integration
 *   (no postcss.config.js required).
 * - Server proxy rewrites `/api/*` → `http://127.0.0.1:8000/*` during dev,
 *   keeping all XHR on the same origin and avoiding any CORS edge cases.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
