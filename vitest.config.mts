import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    environmentMatchGlobs: [
      ['__tests__/node/**', 'node'],
      ['__tests__/dom/**', 'jsdom'],
    ],
  },
});
