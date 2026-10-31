import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The API (functions/) only runs on Cloudflare Pages, so `npm run dev` borrows the live site's
// API and uploads. Anything you change in /admin while developing changes the live data.
const LIVE = 'https://hadiko-portfolio.pages.dev'
// The API rejects writes from other sites, so proxied requests present the live site as their origin.
const toLive = {
  target: LIVE,
  changeOrigin: true,
  secure: true,
  configure: proxy => proxy.on('proxyReq', req => { if (req.getHeader('origin')) req.setHeader('origin', LIVE) }),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api': toLive,
      '/media': toLive,
    },
  },
})
