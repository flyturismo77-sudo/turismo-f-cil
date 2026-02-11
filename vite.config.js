import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  logLevel: 'error',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
