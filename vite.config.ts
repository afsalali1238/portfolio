import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.e2b.app', 'localhost'],
  },
  plugins: [
    tanstackStart(),
    nitro({
      preset: 'node-server',
      compressPublicAssets: { gzip: true, brotli: true },
      routeRules: {
        '/**': {
          headers: {
            'x-content-type-options': 'nosniff',
            'referrer-policy': 'strict-origin-when-cross-origin',
            'permissions-policy': 'camera=(), microphone=(), geolocation=()',
            // Start uses inline hydration scripts/styles; use nonces for a stricter deployment policy.
            'content-security-policy': "base-uri 'self'; object-src 'none'; form-action 'self'",
          },
        },
        '/assets/**': { headers: { vary: 'Accept-Encoding' } },
        '/thesis': { headers: { 'cache-control': 'no-cache' } },
        '/': { headers: { 'cache-control': 'no-cache' } },
      },
      // No X-Frame-Options / restrictive frame-ancestors: the Arena preview must remain embeddable.
    }),
    react(),
  ],
})
