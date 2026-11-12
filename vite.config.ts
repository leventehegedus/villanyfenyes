/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'
import { defineConfig } from 'vite'
import type { Connect, Plugin } from 'vite'

/**
 * DATA_DIR=e2e/fixtures/data serves /data/* from that folder in dev and preview, so the app
 * can run on fixture data without touching the generated public/data.
 */
function dataDir(): Plugin {
  const dir = process.env.DATA_DIR
  const serve: Connect.NextHandleFunction = (req, res, next) => {
    const path = req.url?.split('?')[0] ?? ''
    if (!dir || !path.startsWith('/data/')) return next()
    const file = normalize(join(dir, path.slice('/data/'.length)))
    if (!file.startsWith(normalize(dir)) || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404
      return res.end()
    }
    res.setHeader('Content-Type', 'application/json')
    createReadStream(file).pipe(res)
  }
  return {
    name: 'data-dir',
    configureServer: (server) => void server.middlewares.use(serve),
    configurePreviewServer: (server) => void server.middlewares.use(serve),
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), dataDir()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
})
