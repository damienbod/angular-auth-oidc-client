import { defineConfig } from 'vitest/config';

// The schematics are tested against their compiled output in dist, see
// `npm run test-schematics`.
export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ['test/**/*.spec.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
});
