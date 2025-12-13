import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5241',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: '',
        cookiePathRewrite: '/',
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Ensure cookies are forwarded
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              // Rewrite cookie domain and path if needed
              proxyRes.headers['set-cookie'] = setCookieHeaders.map(cookie => {
                return cookie
                  .replace(/Domain=[^;]+/gi, '')
                  .replace(/Path=[^;]+/gi, 'Path=/');
              });
            }
          });
        },
      }
    }
  }
})
