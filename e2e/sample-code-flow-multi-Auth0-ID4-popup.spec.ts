import { Page } from '@playwright/test';
import {
  expect,
  formParams,
  IDP_ORIGIN,
  isLogoutRequest,
  isTokenRequest,
  Realm,
  section,
  test,
  USER_NAMES,
} from './helpers';

// Two configs (checkAuthMultiple) against two IdP realms, both logging in
// through a popup window instead of a full page redirect.

const CONFIGS: { configId: string; realm: Realm }[] = [
  { configId: '0-client-idp1', realm: 'idp1' },
  { configId: '1-client-idp2', realm: 'idp2' },
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

async function loginWithPopup(page: Page, configId: string): Promise<void> {
  const popupPromise = page.waitForEvent('popup');

  await section(page, configId)
    .getByRole('button', { name: 'Login using popup' })
    .click();

  const popup = await popupPromise;

  // The popup hands the callback URL to the opener and closes itself.
  await popup.waitForEvent('close');
}

async function loginToBoth(page: Page): Promise<void> {
  await page.goto('/');
  await loginWithPopup(page, CONFIGS[0].configId);
  await expectConfigsWithUserData(page, [CONFIGS[0].configId]);
  await loginWithPopup(page, CONFIGS[1].configId);
  await expectConfigsWithUserData(
    page,
    CONFIGS.map((config) => config.configId)
  );
}

test('should be unauthenticated for both configs on first visit', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('pre').first()).toContainText('allUserData');
  await expectConfigsWithUserData(page, []);
});

test('should log in to both configs with popups without leaving the page', async ({
  page,
}) => {
  await page.goto('/');

  // Only the popup visits the IdP; the opener just cleans up its own URL.
  const navigations: string[] = [];

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      navigations.push(frame.url());
    }
  });

  for (const { configId, realm } of CONFIGS) {
    const tokenRequest = page.waitForRequest(
      isTokenRequest('authorization_code', realm)
    );

    await loginWithPopup(page, configId);

    // The opener exchanges the code that the popup received.
    expect(formParams(await tokenRequest).get('code_verifier')).toBeTruthy();
  }

  await expectConfigsWithUserData(
    page,
    CONFIGS.map((config) => config.configId)
  );
  await expect(page.locator('pre').first()).toContainText(USER_NAMES.idp1);
  await expect(page.locator('pre').first()).toContainText(USER_NAMES.idp2);
  expect(navigations.filter((url) => url.startsWith(IDP_ORIGIN))).toEqual([]);
});

test('should keep both sessions after a page reload', async ({ page }) => {
  await loginToBoth(page);

  await page.reload();

  await expectConfigsWithUserData(
    page,
    CONFIGS.map((config) => config.configId)
  );
});

test('should refresh each config on demand', async ({ page }) => {
  await loginToBoth(page);

  for (const { configId, realm } of CONFIGS) {
    const refresh = page.waitForRequest(isTokenRequest('refresh_token', realm));

    await section(page, configId)
      .getByRole('button', { name: 'Refresh session' })
      .click();
    expect((await (await refresh).response())?.status()).toBe(200);
  }
});

test('should log out of one config while the other stays authenticated', async ({
  page,
}) => {
  await loginToBoth(page);

  const logout = page.waitForRequest(isLogoutRequest('idp1'));

  await section(page, CONFIGS[0].configId)
    .getByRole('button', { name: 'Logout', exact: true })
    .click();

  await logout;
  await expectConfigsWithUserData(page, [CONFIGS[1].configId]);
});
