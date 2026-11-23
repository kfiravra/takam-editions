import { defineConfig } from 'vitest/config';

// Vite's root is client/, so Vitest has a config of its own and finds the tests from the project root.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
