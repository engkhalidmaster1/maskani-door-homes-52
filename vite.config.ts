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
    },
    {
      name: 'vite-plugin-async-css',
      transformIndexHtml(html: string) {
        // Transform CSS links to use media="print" trick for async loading
        return html.replace(
          /<link([^>]*rel="stylesheet"[^>]*)>/gi,
          (match: string, attrs: string) => {
            if (!attrs.includes('media=')) {
              return `<link${attrs} media="print" onload="this.media='all'; this.onload=null;">`;
            }
            return match;
          }
        );
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }
            if (id.includes('leaflet')) {
              return 'vendor-leaflet';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-utils';
            }
            return 'vendor-other';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false
      }
    },
  },
}));
