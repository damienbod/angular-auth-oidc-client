import { defineConfig, devices } from '@playwright/test';
import allSamples from './samples.json';

const IDP_DIR = 'projects/integration-tests/test-idp-server';
const IDP_PORT = 8081;

// E2E_SAMPLES=sample-a,sample-b limits the run (and the started dev servers)
// to those samples. Without it, every sample in samples.json is tested.
const selected = process.env.E2E_SAMPLES?.split(',').map((name) => name.trim());
const samples = selected
  ? allSamples.filter((sample) => selected.includes(sample.name))
  : allSamples;

if (selected && samples.length !== selected.length) {
  throw new Error(`Unknown sample in E2E_SAMPLES: ${process.env.E2E_SAMPLES}`);
}

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
    trace: 'retain-on-failure',
  },
  projects: samples.map((sample) => ({
    name: sample.name,
    testMatch: `${sample.name}.spec.ts`,
    use: {
      ...devices['Desktop Chrome'],
      baseURL: `http://localhost:${sample.port}`,
    },
  })),
  webServer: [
    {
      name: 'test-idp',
      command: `npm --prefix ${IDP_DIR} install --no-audit --no-fund && npm --prefix ${IDP_DIR} start`,
      cwd: '..',
      // prompt=none only succeeds with an SSO session, like a real IdP.
      env: { PORT: `${IDP_PORT}`, PROMPT_NONE_REQUIRES_SESSION: 'true' },
      url: `http://localhost:${IDP_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    ...samples.map((sample) => ({
      name: sample.name,
      command: `npx ng serve ${sample.name} --configuration e2e --port ${sample.port} --no-hmr`,
      cwd: '..',
      url: `http://localhost:${sample.port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    })),
  ],
});
