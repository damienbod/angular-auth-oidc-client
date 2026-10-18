import { Page, Request } from '@playwright/test';
import {
  collectRequests,
  expect,
  isAuthorizeRequest,
  isLogoutRequest,
  isTokenRequest,
  section,
  test,
  USER_NAMES,
} from './helpers';

// Two configs (checkAuthMultiple) for the same authority and client that only
// differ in the requested API scope, with an explicit well-known URL.

const CONFIGS = [
  { configId: '0-client-idp1', apiScope: 'api1' },
  { configId: '1-client-idp1', apiScope: 'api2' },
];

// The page shows no authentication state, only the user data per config.
async function configsWithUserData(page: Page): Promise<string[]> {
  const text = await page.locator('pre').first().textContent();
  const result = JSON.parse(text || 'null');

  return (result?.allUserData ?? [])
    .filter((config: { userData: unknown }) => !!config.userData)
    .map((config: { configId: string }) => config.configId);
}

async function expectConfigsWithUserData(
  page: Page,
  configIds: string[]
): Promise<void> {
  await expect.poll(() => configsWithUserData(page)).toEqual(configIds);
}

async function login(page: Page, configId: string): Promise<Request> {
  const authorizeRequest = page.waitForRequest(isAuthorizeRequest());

  await section(page, configId)
    .getByRole('button', { name: `Login with ${configId}` })
    .click();

  return authorizeRequest;
}

async function loginToBoth(page: Page): Promise<void> {
  await page.goto('/');
  await login(page, CONFIGS[0].configId);
  await expectConfigsWithUserData(page, [CONFIGS[0].configId]);
  await login(page, CONFIGS[1].configId);
  await expectConfigsWithUserData(
    page,
    CONFIGS.map((config) => config.configId)
  );
}

test('is unauthenticated for both configs on first visit', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('button', { name: `Login with ${CONFIGS[0].configId}` })
  ).toBeVisible();
  await expectConfigsWithUserData(page, []);
});

test('logs in to both configs with their own scope', async ({ page }) => {
  await page.goto('/');

  for (const { configId, apiScope } of CONFIGS) {
    const authorizeUrl = new URL((await login(page, configId)).url());

    expect(authorizeUrl.searchParams.get('scope')).toBe(
      `openid profile offline_access ${apiScope}`
    );
    // Wait until the app is back from the IdP before the next login.
    await expect.poll(() => configsWithUserData(page)).toContain(configId);
  }

  await expectConfigsWithUserData(
    page,
    CONFIGS.map((config) => config.configId)
  );
  // autoUserInfo is off, so the user data comes from the id token.
  await expect(page.locator('pre').first()).toContainText(USER_NAMES.idp1);
});

test('renews both configs silently with refresh tokens', async ({ page }) => {
  await loginToBoth(page);

  // Both configs renew at the same IdP, one refresh token grant each.
  const refreshes = collectRequests(page, isTokenRequest('refresh_token'));
  const statuses = async (): Promise<(number | undefined)[]> =>
    Promise.all(
      refreshes.map(async (request) => (await request.response())?.status())
    );

  await expect
    .poll(
      async () => (await statuses()).filter((status) => status === 200).length,
      { timeout: 30_000 }
    )
    .toBeGreaterThanOrEqual(2);
  expect(await statuses()).not.toContain(400);

  await expectConfigsWithUserData(
    page,
    CONFIGS.map((config) => config.configId)
  );
});

test('refreshes a config on demand', async ({ page }) => {
  await loginToBoth(page);

  const refresh = page.waitForRequest(isTokenRequest('refresh_token'));

  await section(page, CONFIGS[1].configId)
    .getByRole('button', { name: 'Refresh session' })
    .click();

  expect((await (await refresh).response())?.status()).toBe(200);
  await expectConfigsWithUserData(
    page,
    CONFIGS.map((config) => config.configId)
  );
});

test('logs out of one config while the other stays authenticated', async ({
  page,
}) => {
  await loginToBoth(page);

  const logout = page.waitForRequest(isLogoutRequest());

  await section(page, CONFIGS[0].configId)
    .getByRole('button', { name: 'Logout', exact: true })
    .click();

  const logoutUrl = new URL((await logout).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  await expectConfigsWithUserData(page, [CONFIGS[1].configId]);
});
