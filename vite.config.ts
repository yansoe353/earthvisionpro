import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src', // Ensure this matches your tsconfig.json paths
    },
  },
  server: {
    port: 3000, // Default port for development
    open: true, // Automatically open the app in the browser
  },
  build: {
    outDir: 'dist', // Output directory for the build
    sourcemap: true, // Generate source maps for debugging
  },
  define: {
    'process.env': process.env, // Pass environment variables to the app
  },
});
