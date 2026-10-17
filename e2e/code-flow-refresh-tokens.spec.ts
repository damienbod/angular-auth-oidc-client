import { expect, Page, Request, test as base } from '@playwright/test';

// End-to-end tests for projects/sample-code-flow-refresh-tokens, served with its
// "e2e" configuration against the local test IdP (see playwright.config.ts).

const IDP = 'http://localhost:8081/idp1';

const test = base.extend<{ pageErrors: Error[] }>({
  pageErrors: async ({ page }, use) => {
    const errors: Error[] = [];

    page.on('pageerror', (error) => errors.push(error));
    await use(errors);
  },
});

test.afterEach(({ pageErrors }) => {
  expect(pageErrors, 'uncaught errors in the app').toEqual([]);
});

function formParams(request: Request): URLSearchParams {
  return new URLSearchParams(request.postData() ?? '');
}

function isTokenRequest(grantType: string) {
  return (request: Request): boolean =>
    request.method() === 'POST' &&
    request.url() === `${IDP}/token` &&
    formParams(request).get('grant_type') === grantType;
}

function isAuthorizeRequest(request: Request): boolean {
  return request.url().startsWith(`${IDP}/authorize`);
}

async function expectAuthenticated(page: Page): Promise<void> {
  await expect(page.getByText('Is Authenticated: true')).toBeVisible();
  await expect(page.getByText('Test User IDP1')).toBeVisible();
}

async function expectUnauthenticated(page: Page): Promise<void> {
  await expect(
    page.getByRole('button', { name: 'Login', exact: true })
  ).toBeVisible();
  await expect(page.getByText('Is Authenticated: true')).toBeHidden();
}

async function login(page: Page): Promise<void> {
  await page.goto('/');
  await expectUnauthenticated(page);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expectAuthenticated(page);
}

async function waitForRefreshTokenRenew(page: Page): Promise<string> {
  const request = await page.waitForRequest(isTokenRequest('refresh_token'), {
    timeout: 30_000,
  });
  const response = await request.response();

  expect(response?.status()).toBe(200);

  return formParams(request).get('refresh_token') ?? '';
}

test.describe('sample-code-flow-refresh-tokens', () => {
  test('is unauthenticated on first visit', async ({ page }) => {
    await page.goto('/');

    await expectUnauthenticated(page);
  });

  test('logs in with the code flow and PKCE', async ({ page }) => {
    await page.goto('/');

    const authorizeRequest = page.waitForRequest(isAuthorizeRequest);
    const tokenRequest = page.waitForRequest(
      isTokenRequest('authorization_code')
    );

    await page.getByRole('button', { name: 'Login', exact: true }).click();

    const authorizeUrl = new URL((await authorizeRequest).url());

    expect(authorizeUrl.searchParams.get('response_type')).toBe('code');
    expect(authorizeUrl.searchParams.get('client_id')).toBe('client-idp1');
    expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');
    expect(authorizeUrl.searchParams.get('code_challenge')).toBeTruthy();
    expect(authorizeUrl.searchParams.get('state')).toBeTruthy();
    expect(authorizeUrl.searchParams.get('nonce')).toBeTruthy();

    const tokenParams = formParams(await tokenRequest);

    expect(tokenParams.get('code_verifier')).toBeTruthy();
    expect((await (await tokenRequest).response())?.status()).toBe(200);

    await expectAuthenticated(page);
    // The code and state are removed from the URL after the callback.
    await expect(page).not.toHaveURL(/[?&](code|state)=/);
  });

  test('stays authenticated after a page reload', async ({ page }) => {
    await login(page);

    const authorizeRequests: Request[] = [];

    page.on('request', (request) => {
      if (isAuthorizeRequest(request)) {
        authorizeRequests.push(request);
      }
    });

    await page.reload();

    await expectAuthenticated(page);
    expect(authorizeRequests).toEqual([]);
  });

  test('renews the tokens silently with rotating refresh tokens', async ({
    page,
  }) => {
    await login(page);

    const firstRefreshToken = await waitForRefreshTokenRenew(page);
    const secondRefreshToken = await waitForRefreshTokenRenew(page);

    // The test IdP rotates refresh tokens, so the second renew only succeeds
    // if the library stored the refresh token returned by the first renew.
    expect(secondRefreshToken).not.toBe(firstRefreshToken);
    await expectAuthenticated(page);
  });

  test('refreshes the session on demand', async ({ page }) => {
    await login(page);

    const refresh = waitForRefreshTokenRenew(page);

    await page.getByRole('button', { name: 'Refresh session' }).click();

    await refresh;
    await expectAuthenticated(page);
  });

  test('keeps independent sessions in multiple tabs', async ({
    context,
    page,
  }) => {
    await login(page);

    const secondTab = await context.newPage();
    const secondTabErrors: Error[] = [];

    secondTab.on('pageerror', (error) => secondTabErrors.push(error));

    // Each tab keeps its own session in sessionStorage, so the second tab
    // starts unauthenticated and logs in through the IdP's SSO session.
    await login(secondTab);

    await Promise.all([
      waitForRefreshTokenRenew(page),
      waitForRefreshTokenRenew(secondTab),
    ]);

    await expectAuthenticated(page);
    await expectAuthenticated(secondTab);

    await secondTab.reload();
    await expectAuthenticated(secondTab);
    await expectAuthenticated(page);

    expect(secondTabErrors, 'uncaught errors in the second tab').toEqual([]);
  });

  test('logs out through the end session endpoint', async ({ page }) => {
    await login(page);

    const logoutRequest = page.waitForRequest((request) =>
      request.url().startsWith(`${IDP}/logout`)
    );

    await page.getByRole('button', { name: 'Logout', exact: true }).click();

    const logoutUrl = new URL((await logoutRequest).url());

    expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
    expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
      'http://localhost:4204'
    );

    await expectUnauthenticated(page);
  });
});
