import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite do frontend (SPEC-003 A1): React via plugin + alias @ttt/shared/* → packages/shared/src/*
// Espelha `compilerOptions.paths` do tsconfig.json — mantenha os dois em sincronia.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ttt/shared': fileURLToPath(new URL('../../packages/shared/src', import.meta.url)),
    },
  },
});
