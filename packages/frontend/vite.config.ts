import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite do frontend (SPEC-003 A1): React via plugin + alias @ttt/shared/* → packages/shared/src/*
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ttt/shared': '/packages/shared/src',
    },
  },
});
