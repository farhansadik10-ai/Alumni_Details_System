import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { APP_NAME } from './src/config/app.ts'
import { THEME_STORAGE_KEY } from './src/config/storageKeys.ts'

const escapeHtml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

// Writes the app name and the theme storage key into index.html,
// so each is written once, in src/config/.
function indexHtmlConstants(): Plugin {
  return {
    name: 'index-html-constants',
    transformIndexHtml(html) {
      return html
        .replaceAll('%APP_NAME%', escapeHtml(APP_NAME))
        .replaceAll('%THEME_STORAGE_KEY%', THEME_STORAGE_KEY)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), indexHtmlConstants()],
  server: {
    // Dev only: forward /api to the backend (port 3000, as in backend/src/server.ts).
    // In production Apache proxies /api.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
