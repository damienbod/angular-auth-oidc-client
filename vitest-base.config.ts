import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Restore original implementations of spies after each test, matching
    // Jasmine's behavior of removing spies at the end of every spec.
    restoreMocks: true,
    // Remove globals stubbed with vi.stubGlobal after each test.
    unstubGlobals: true,
  },
});
