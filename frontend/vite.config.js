import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Match your preferred port
  },
  esbuild: {
    loader: 'jsx', // Default loader for JSX
    include: [
      // Include .js and .jsx files in src for JSX parsing
      'src/**/*.js',
      'src/**/*.jsx',
    ],
    exclude: [], // No exclusions needed
  },
});