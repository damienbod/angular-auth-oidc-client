import { Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  isLogoutRequest,
  isSilentRenewRequest,
  isTokenRequest,
  section,
  test,
  USER_NAMES,
} from './helpers';

// Two configs (checkAuthMultiple) for the same authority and client with a
// different scope, renewing through silent-renew.html iframes (prompt=none).

const CONFIGS = [
  { configId: '0-client-idp1', scope: 'openid profile email' },
  { configId: '1-client-idp1', scope: 'openid profile' },
];

async function authenticatedConfigs(page: Page): Promise<string[]> {
  const text = await page.locator('pre').first().textContent();
  const result = JSON.parse(text || 'null');

  return (result?.allConfigsAuthenticated ?? [])
    .filter((config: { isAuthenticated: boolean }) => config.isAuthenticated)
    .map((config: { configId: string }) => config.configId);
}

async function expectAuthenticatedConfigs(
  page: Page,
  configIds: string[]
): Promise<void> {
  await expect.poll(() => authenticatedConfigs(page)).toEqual(configIds);
}

async function login(page: Page, configId: string): Promise<void> {
  await section(page, configId)
    .getByRole('button', { name: `Login with ${configId}` })
    .click();
  // The heading is on the page before the redirect as well, so wait until the
  // app is back and reports the config as authenticated.
  await expect.poll(() => authenticatedConfigs(page)).toContain(configId);
}

async function loginToBoth(page: Page): Promise<void> {
  await page.goto('/');
  await expectAuthenticatedConfigs(page, []);
  await login(page, CONFIGS[0].configId);
  await expectAuthenticatedConfigs(page, [CONFIGS[0].configId]);
  await login(page, CONFIGS[1].configId);
  await expectAuthenticatedConfigs(
    page,
    CONFIGS.map((config) => config.configId)
  );
}

test('is unauthenticated for both configs on first visit', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('pre').first()).toContainText(
    '"isAuthenticated": false'
  );
  await expectAuthenticatedConfigs(page, []);
});

test('logs in to both configs', async ({ page }) => {
  await loginToBoth(page);

  await expect(page.locator('pre').nth(1)).toContainText(USER_NAMES.idp1);
});

test('renews both configs silently through iframes', async ({ page }) => {
  await loginToBoth(page);

  const silentRenews = collectRequests(page, isSilentRenewRequest());
  const codeExchanges = collectRequests(
    page,
    isTokenRequest('authorization_code')
  );

  await expect
    .poll(
      () =>
        silentRenews
          .map((request) => new URL(request.url()).searchParams.get('scope'))
          .sort(),
      { timeout: 30_000 }
    )
    .toEqual(CONFIGS.map((config) => config.scope).sort());

  for (const request of silentRenews) {
    const authorizeUrl = new URL(request.url());

    // The renew runs in a hidden iframe that loads silent-renew.html.
    expect(request.frame()).not.toBe(page.mainFrame());
    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe(
      `${new URL(page.url()).origin}/silent-renew.html`
    );
  }

  await expect
    .poll(
      async () =>
        Promise.all(
          codeExchanges.map(async (request) =>
            (await request.response())?.status()
          )
        ),
      { timeout: 10_000 }
    )
    .toEqual([200, 200]);

  await expectAuthenticatedConfigs(
    page,
    CONFIGS.map((config) => config.configId)
  );
});

test('logs out of one config while the other stays authenticated', async ({
  page,
}) => {
  await loginToBoth(page);

  const logout = page.waitForRequest(isLogoutRequest());

  await section(page, CONFIGS[1].configId)
    .getByRole('button', { name: 'Logout', exact: true })
    .click();

  const logoutUrl = new URL((await logout).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  await expectAuthenticatedConfigs(page, [CONFIGS[0].configId]);
});
