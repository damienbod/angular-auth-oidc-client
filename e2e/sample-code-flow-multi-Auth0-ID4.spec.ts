import { Page } from '@playwright/test';
import {
  expect,
  formParams,
  isAuthorizeRequest,
  isLogoutRequest,
  isRevocationRequest,
  isTokenRequest,
  Realm,
  section,
  test,
  USER_NAMES,
  waitForRefreshTokenRenew,
} from './helpers';

// Two configs (checkAuthMultiple) against two IdP realms: the first like the
// IdentityServer config, the second with the Auth0 style custom parameters.

const CONFIGS: { configId: string; realm: Realm }[] = [
  { configId: '0-client-idp1', realm: 'idp1' },
  { configId: '1-client-idp2', realm: 'idp2' },
];

async function authenticatedConfigs(page: Page): Promise<string[]> {
  const text = await page.locator('pre').nth(1).textContent();
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

test('should be unauthenticated for both configs on first visit', async ({
  page,
}) => {
  await page.goto('/');

  await expectAuthenticatedConfigs(page, []);
  await expect(page.locator('pre').nth(1)).toContainText(
    '"isAuthenticated": false'
  );
});

test('should log in to both configs at their own IdP', async ({ page }) => {
  await page.goto('/');

  for (const { configId, realm } of CONFIGS) {
    const authorizeRequest = page.waitForRequest(isAuthorizeRequest(realm));

    await login(page, configId);

    const authorizeUrl = new URL((await authorizeRequest).url());

    expect(authorizeUrl.searchParams.get('client_id')).toBe(`client-${realm}`);
    expect(authorizeUrl.searchParams.get('code_challenge')).toBeTruthy();
  }

  await expectAuthenticatedConfigs(
    page,
    CONFIGS.map((config) => config.configId)
  );
  await expect(page.locator('pre').first()).toContainText(USER_NAMES.idp1);
  await expect(page.locator('pre').first()).toContainText(USER_NAMES.idp2);
});

test('should send the Auth0 audience only for the second config', async ({
  page,
}) => {
  await page.goto('/');

  const firstAuthorize = page.waitForRequest(isAuthorizeRequest('idp1'));

  await login(page, CONFIGS[0].configId);
  expect(
    new URL((await firstAuthorize).url()).searchParams.get('audience')
  ).toBeNull();

  const secondAuthorize = page.waitForRequest(isAuthorizeRequest('idp2'));

  await login(page, CONFIGS[1].configId);
  expect(
    new URL((await secondAuthorize).url()).searchParams.get('audience')
  ).toBe('https://auth0-api-spa');
});

test('should renew both configs silently with refresh tokens', async ({
  page,
}) => {
  await loginToBoth(page);

  await Promise.all([
    waitForRefreshTokenRenew(page, 'idp1'),
    waitForRefreshTokenRenew(page, 'idp2'),
  ]);

  await expectAuthenticatedConfigs(
    page,
    CONFIGS.map((config) => config.configId)
  );
});

test('should refresh each config on demand', async ({ page }) => {
  await loginToBoth(page);

  const firstRefresh = page.waitForRequest(
    isTokenRequest('refresh_token', 'idp1')
  );

  await section(page, CONFIGS[0].configId)
    .getByRole('button', { name: 'Refresh session' })
    .click();
  expect((await (await firstRefresh).response())?.status()).toBe(200);

  const secondRefresh = page.waitForRequest(
    isTokenRequest('refresh_token', 'idp2')
  );

  await section(page, CONFIGS[1].configId)
    .getByRole('button', { name: 'Refresh session' })
    .click();

  // The Auth0 config sends its custom scope with the refresh token request.
  expect(formParams(await secondRefresh).get('scope')).toBe(
    'openid profile offline_access auth0-user-api-spa'
  );
  expect((await (await secondRefresh).response())?.status()).toBe(200);
});

test('should revoke the refresh token of one config', async ({ page }) => {
  await loginToBoth(page);

  const revocation = page.waitForRequest(isRevocationRequest('idp2'));

  await section(page, CONFIGS[1].configId)
    .getByRole('button', { name: 'Revoke refresh token' })
    .click();

  expect(formParams(await revocation).get('token_type_hint')).toBe(
    'refresh_token'
  );
  expect((await (await revocation).response())?.status()).toBe(200);
});

test('should log out and revokes the tokens of one config', async ({
  page,
}) => {
  await loginToBoth(page);

  const revocation = page.waitForRequest(isRevocationRequest('idp1'));
  const logout = page.waitForRequest(isLogoutRequest('idp1'));

  await section(page, CONFIGS[0].configId)
    .getByRole('button', { name: 'Logout and revoke tokens' })
    .click();

  await revocation;
  await logout;
  await expectAuthenticatedConfigs(page, [CONFIGS[1].configId]);
});

test('should log out of one config while the other stays authenticated', async ({
  page,
}) => {
  await loginToBoth(page);

  const logout = page.waitForRequest(isLogoutRequest('idp2'));

  await section(page, CONFIGS[1].configId)
    .getByRole('button', { name: 'Logout', exact: true })
    .click();

  const logoutUrl = new URL((await logout).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  await expectAuthenticatedConfigs(page, [CONFIGS[0].configId]);

  await page.reload();
  await expectAuthenticatedConfigs(page, [CONFIGS[0].configId]);
});
