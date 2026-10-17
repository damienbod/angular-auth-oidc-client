import { defineConfig, devices } from '@playwright/test';

const IDP_DIR = 'projects/integration-tests/test-idp-server';
const IDP_PORT = 8081;
const APP_PORT = 4204;

// The samples import the library from dist/, so run `npm run build-lib`
// before `npm run e2e`.
export default defineConfig({
  testDir: '.',
  outputDir: './test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never', outputFolder: './playwright-report' }],
      ]
    : 'list',
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      name: 'test-idp',
      command: `npm --prefix ${IDP_DIR} install --no-audit --no-fund && npm --prefix ${IDP_DIR} start`,
      cwd: '..',
      env: { PORT: `${IDP_PORT}` },
      url: `http://localhost:${IDP_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      name: 'sample-code-flow-refresh-tokens',
      command: `npx ng serve sample-code-flow-refresh-tokens --configuration e2e --port ${APP_PORT}`,
      cwd: '..',
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
