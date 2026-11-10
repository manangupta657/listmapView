import { Plugin, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite >= 4.5.10 refuses any dev request whose query contains `url`/`raw`/`inline`
 * (it treats `&url=...` as an asset import) and answers 403. Our page links carry
 * `&url=https://...`, so for page navigations we drop the query before Vite sees it.
 * The browser keeps the full address, and the app reads params from window.location.
 * Dev server only — the production build is unaffected.
 */
const allowPageQueryParams = (): Plugin => ({
  name: 'allow-page-query-params',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? ''
      const [path, query] = url.split('?')
      const isPage = path === '/' || path === '/index.html'
      if (isPage && query && req.headers.accept?.includes('text/html')) {
        req.url = path
      }
      next()
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [allowPageQueryParams(), react()],
  server: {
    host: 'localhost',
    port: 4200
  }
})
