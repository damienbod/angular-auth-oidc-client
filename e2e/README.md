# End-to-end tests

Playwright tests that run a sample app in a real browser against the local
test IDP server (`projects/integration-tests/test-idp-server`), so no external
identity provider is needed. They run on every PR in the `e2e_job` of
`.github/workflows/build.yml`.

Currently covered: `sample-code-flow-refresh-tokens` (login with code flow +
PKCE, page reload, silent renew with rotating refresh tokens, refresh on
demand, multiple tabs, logout).

## Running locally

```bash
npx playwright install chromium   # once
npm run build-lib                 # the samples import the library from dist/
npm run e2e
```

Playwright starts the test IDP server on port 8081 and serves the sample with
its `e2e` configuration on port 4204. Already running servers on those ports
are reused.

## Adding another sample

1. Add an `auth-config.module.e2e.ts` (or equivalent) to the sample that points
   at a realm of the test IDP server, e.g. `http://localhost:8081/idp1`.
2. Add an `e2e` build configuration to the sample in `angular.json` that swaps
   in that file via `fileReplacements`, and an `e2e` serve configuration.
3. Add a `webServer` entry for the sample in `playwright.config.ts` and a spec
   file in this folder.
