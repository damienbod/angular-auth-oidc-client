# End-to-end tests

Playwright tests that run the sample apps in a real browser against the local
test IDP server (`projects/integration-tests/test-idp-server`), so no external
identity provider is needed. They run on every PR in the `e2e_job` of
`.github/workflows/build.yml`, one job per sample.

Every sample listed in `samples.json` has a spec named `<sample>.spec.ts`.
Each sample is served with its `e2e` configuration from `angular.json`, which
swaps the sample's auth config (`auth-config.module.ts` or `app.config.ts`)
for a `*.e2e.ts` copy that points at the test IDP. The samples themselves stay
unchanged. `sample-code-flow-http-config` has no swap: its tests intercept the
HTTP request that loads the config instead.

The test IDP has three realms (`idp1`, `idp2`, `idp3`). It supports the code
flow with PKCE, refresh tokens (rotating), the implicit flow, pushed
authorization requests, `prompt=none` (only with an SSO session), token
revocation and the end session endpoint. It has no login UI: `/authorize`
signs the user in right away. Tokens are valid for 300 seconds, so the e2e
configs set `renewTimeBeforeTokenExpiresInSeconds: 290` to see the silent
renew after about 10 seconds.

## Running locally

```bash
npx playwright install chromium   # once
npm run build-lib                 # the samples import the library from dist/
npm run e2e                       # all samples
E2E_SAMPLES=sample-code-flow-popup npm run e2e   # one or more (comma separated)
```

Playwright starts the test IDP server on port 8081 and serves each selected
sample on the port from `samples.json`. Already running servers on those ports
are reused. Running all samples starts one dev server per sample, so prefer
`E2E_SAMPLES` while working on a single sample.

## Adding a sample

1. Add the sample with a free port to `samples.json`. CI picks it up from there.
2. Add an `auth-config.module.e2e.ts` (or `app.config.e2e.ts`) that points the
   sample at a realm of the test IDP, e.g. `http://localhost:8081/idp1`.
3. Add an `e2e` build configuration to the sample in `angular.json` that swaps
   in that file via `fileReplacements`, and an `e2e` serve configuration.
4. Add `<sample>.spec.ts` to this folder. `helpers.ts` has the shared fixture
   (which fails a test on uncaught page errors) and request matchers.
