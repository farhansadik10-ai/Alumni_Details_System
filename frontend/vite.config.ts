import { existsSync, readFileSync } from 'node:fs'
import { createSecureContext } from 'node:tls'
import { fileURLToPath } from 'node:url'
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

// The Latin file of the variable font: every weight in one file, and the
// subset almost every page needs. The other subsets (latin-ext, vietnamese,
// cyrillic) load only when a text needs them, so they are not preloaded.
const PRELOADED_FONT = 'hanken-grotesk-latin-wght-normal'

// Adds one <link rel="preload"> for that font file to the built index.html,
// so the browser fetches it with the page and not after the stylesheet.
// In dev there is no bundle, so nothing is added. In a build the file must
// exist: if a package update renames it, the build stops here.
function fontPreload(): Plugin {
  return {
    name: 'font-preload',
    transformIndexHtml(_html, ctx) {
      if (!ctx.bundle) return []
      const fileName = Object.keys(ctx.bundle).find((key) => {
        const name = key.split('/').pop() ?? ''
        return name.includes(PRELOADED_FONT) && name.endsWith('.woff2')
      })
      if (fileName === undefined) {
        throw new Error(`font-preload: no ${PRELOADED_FONT} .woff2 file in the build`)
      }
      return [
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
            href: `/${fileName}`,
          },
          injectTo: 'head',
        },
      ]
    },
  }
}

// Local https for the dev server (REQ-fs-008). The two files are a mkcert
// pair for localhost. They are per machine and gitignored, so the paths are
// fixed here and taken from this file's folder, not the working directory.
const DEV_CERT_FILE = fileURLToPath(new URL('./.cert/localhost.pem', import.meta.url))
const DEV_KEY_FILE = fileURLToPath(new URL('./.cert/localhost-key.pem', import.meta.url))

// Both files present and a working pair: the dev server runs on https.
// Anything else returns undefined, so Vite stays on http and still starts:
// a fresh clone has no files, and a broken file must not stop the server.
// Each case prints one line. No line ever shows what is in a file.
function devHttps(): { cert: Buffer; key: Buffer } | undefined {
  if (!existsSync(DEV_CERT_FILE) || !existsSync(DEV_KEY_FILE)) {
    console.info(
      'Dev server: https is off. For https, put localhost.pem and localhost-key.pem in frontend/.cert/ (see frontend/README.md).',
    )
    return undefined
  }
  try {
    const pair = { cert: readFileSync(DEV_CERT_FILE), key: readFileSync(DEV_KEY_FILE) }
    // Throws when a file is not PEM or the key does not belong to the
    // certificate. Without this, Vite fails later with a raw TLS error.
    createSecureContext(pair)
    return pair
  } catch {
    console.warn(
      'Dev server: https is off. frontend/.cert/localhost.pem and localhost-key.pem could not be read, or are not a matching certificate and key. Make the pair again (see frontend/README.md).',
    )
    return undefined
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => {
  // Only the dev server uses the files. A build never reads them, and
  // `vite preview` must not either: preview also runs as 'serve' and would
  // take server.https as its own default (G61).
  const https = command === 'serve' && !isPreview ? devHttps() : undefined

  return {
    plugins: [react(), indexHtmlConstants(), fontPreload()],
    server: {
      https,
      // Dev only: forward /api to the backend (port 3000, as in backend/src/server.ts).
      // The backend speaks plain http, also when this server is on https.
      // In production Apache proxies /api.
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
