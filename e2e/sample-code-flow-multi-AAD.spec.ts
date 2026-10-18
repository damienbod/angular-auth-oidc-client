import { Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  isAuthorizeRequest,
  isLogoutRequest,
  isTokenRequest,
  Realm,
  section,
  test,
  USER_NAMES,
  waitForRefreshTokenRenew,
} from './helpers';

// Three configs (Entra ID style options) on one page, each logging in against
// its own realm, checked with checkAuthMultiple().

const CONFIGS: { configId: string; realm: Realm }[] = [
  { configId: '0-client-idp1', realm: 'idp1' },
  { configId: '1-client-idp2', realm: 'idp2' },
  { configId: '2-client-idp3', realm: 'idp3' },
];

// The section of the page with the buttons of one config.

function userData(page: Page) {
  return page.locator('pre').first();
}

async function login(page: Page, index: number): Promise<void> {
  const { configId, realm } = CONFIGS[index];
  const tokenRequest = page.waitForRequest(
    isTokenRequest('authorization_code', realm)
  );

  await section(page, configId)
    .getByRole('button', { name: `Login with ${configId}` })
    .click();

  expect((await (await tokenRequest).response())?.status()).toBe(200);
  await expect(userData(page)).toContainText(USER_NAMES[realm]);
}

test('should be unauthenticated for all configs on first visit', async ({
  page,
}) => {
  await page.goto('/');

  for (const { configId } of CONFIGS) {
    await expect(
      page.getByRole('heading', { name: configId, exact: true })
    ).toBeVisible();
  }

  for (const name of Object.values(USER_NAMES)) {
    await expect(userData(page)).not.toContainText(name);
  }
});

test('should log in with each config against its own IdP', async ({ page }) => {
  await page.goto('/');

  const authorizeRequest = page.waitForRequest(isAuthorizeRequest('idp2'));

  await login(page, 1);

  const authorizeUrl = new URL((await authorizeRequest).url());

  expect(authorizeUrl.searchParams.get('client_id')).toBe('client-idp2');
  expect(authorizeUrl.searchParams.get('prompt')).toBe('select_account');

  await login(page, 0);
  await login(page, 2);

  // All three sessions are kept side by side.
  for (const { configId, realm } of CONFIGS) {
    await expect(userData(page)).toContainText(`"configId": "${configId}"`);
    await expect(userData(page)).toContainText(USER_NAMES[realm]);
  }
});

test('should stay authenticated with all configs after a page reload', async ({
  page,
}) => {
  await page.goto('/');
  await login(page, 0);
  await login(page, 2);

  const authorizeRequests = collectRequests(page, (request) =>
    request.url().includes('/authorize')
  );

  await page.reload();

  await expect(userData(page)).toContainText(USER_NAMES.idp1);
  await expect(userData(page)).toContainText(USER_NAMES.idp3);
  expect(authorizeRequests).toEqual([]);
});

test('should renew the configs with refresh tokens silently', async ({
  page,
}) => {
  await page.goto('/');
  await login(page, 0);
  await login(page, 1);

  await Promise.all([
    waitForRefreshTokenRenew(page, 'idp1'),
    waitForRefreshTokenRenew(page, 'idp2'),
  ]);

  await expect(userData(page)).toContainText(USER_NAMES.idp1);
  await expect(userData(page)).toContainText(USER_NAMES.idp2);
});

test('should refresh the session of one config on demand', async ({ page }) => {
  await page.goto('/');
  await login(page, 0);
  await login(page, 1);

  const otherRefreshes = collectRequests(
    page,
    isTokenRequest('refresh_token', 'idp1')
  );
  const refresh = waitForRefreshTokenRenew(page, 'idp2');

  await section(page, '1-client-idp2')
    .getByRole('button', { name: 'Refresh session' })
    .click();

  await refresh;
  expect(otherRefreshes).toEqual([]);
  await expect(userData(page)).toContainText(USER_NAMES.idp2);
});

test('should log out one config and keep the others', async ({
  page,
  baseURL,
}) => {
  await page.goto('/');
  await login(page, 0);
  await login(page, 1);

  const logoutRequest = page.waitForRequest(isLogoutRequest('idp1'));

  await section(page, '0-client-idp1')
    .getByRole('button', { name: 'Logout' })
    .click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(baseURL);

  await page.waitForURL(`${baseURL}/home`);
  await expect(userData(page)).not.toContainText(USER_NAMES.idp1);
  await expect(userData(page)).toContainText(USER_NAMES.idp2);
});
