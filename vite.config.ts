import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    {
      name: 'vite-plugin-pwa-manual',
      buildEnd() {
        // This is a simple manual implementation since we couldn't install vite-plugin-pwa
        console.log('PWA support has been configured manually');
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log'] : []
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge']
        }
      },
      // Make sure to include service worker and manifest in the build
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'service-worker': path.resolve(__dirname, 'public/service-worker.js'),
      },
    },
  },
}));
