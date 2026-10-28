import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Alias de pacote: imports tipados como @ttt/shared/* resolvem em packages/shared/src/*.
// Espelha `compilerOptions.paths` do tsconfig.json — mantenha os dois em sincronia.
export default defineConfig({
  resolve: {
    alias: {
      '@ttt/shared': fileURLToPath(new URL('./packages/shared/src', import.meta.url)),
    },
  },
});
