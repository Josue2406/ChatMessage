import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // Proxy para WebSocket
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true
      },
      // Proxy para rutas de API
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Proxy para rutas de autenticación
      '/login': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/logout': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/callback': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Proxy para la ruta del chat
      '/chat': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Proxy para la ruta raíz (login page)
      '^/$': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
});
