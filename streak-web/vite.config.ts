import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
      react: path.resolve(process.cwd(), './node_modules/react'),
      'react-dom': path.resolve(process.cwd(), './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
