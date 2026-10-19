import { Page } from '@playwright/test';
import {
  expect,
  formParams,
  IDP_ORIGIN,
  isAuthorizeRequest,
  isLogoutRequest,
  isTokenRequest,
  test,
  waitForRefreshTokenRenew,
} from './helpers';

// Code flow + PKCE with refresh tokens, logging in through a popup window
// instead of a full page redirect.

async function expectAuthenticated(page: Page): Promise<void> {
  await expect(page.getByText('Is Authenticated: true')).toBeVisible();
  await expect(page.getByText('Test User IDP1')).toBeVisible();
}

async function expectUnauthenticated(page: Page): Promise<void> {
  await expect(page.getByText('You are NOT authenticated')).toBeVisible();
  await expect(page.getByText('Is Authenticated: true')).toBeHidden();
}

async function loginWithPopup(page: Page): Promise<Page> {
  const popupPromise = page.waitForEvent('popup');

  await page.getByRole('button', { name: 'Login using popup' }).click();

  const popup = await popupPromise;

  // The popup hands the callback URL to the opener and closes itself.
  await popup.waitForEvent('close');

  return popup;
}

async function login(page: Page): Promise<void> {
  await page.goto('/');
  await expectUnauthenticated(page);
  await loginWithPopup(page);
  await expectAuthenticated(page);
}

test('should be unauthenticated on first visit', async ({ page }) => {
  await page.goto('/');

  await expectUnauthenticated(page);
});

test('should log in through a popup without leaving the page', async ({
  context,
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

  const tokenRequest = page.waitForRequest(
    isTokenRequest('authorization_code')
  );
  const popupPromise = page.waitForEvent('popup');
  // The popup can be closed again before a listener on it would be attached.
  const authorizeRequestPromise = context.waitForEvent('request', {
    predicate: isAuthorizeRequest(),
  });

  await page.getByRole('button', { name: 'Login using popup' }).click();

  const popup = await popupPromise;
  const authorizeRequest = await authorizeRequestPromise;

  expect(authorizeRequest.frame().page()).toBe(popup);

  expect(
    new URL(authorizeRequest.url()).searchParams.get('code_challenge')
  ).toBeTruthy();
  await popup.waitForEvent('close');

  // The opener exchanges the code that the popup received.
  expect(formParams(await tokenRequest).get('code_verifier')).toBeTruthy();
  await expectAuthenticated(page);
  expect(navigations.filter((url) => url.startsWith(IDP_ORIGIN))).toEqual([]);
});

test('should stay authenticated after a page reload', async ({ page }) => {
  await login(page);

  await page.reload();

  await expectAuthenticated(page);
});

test('should renew the tokens silently with refresh tokens', async ({
  page,
}) => {
  await login(page);

  await waitForRefreshTokenRenew(page);

  await expectAuthenticated(page);
});

test('should refresh the session on demand', async ({ page }) => {
  await login(page);

  const refresh = waitForRefreshTokenRenew(page);

  await page.getByRole('button', { name: 'RefreshSession' }).click();

  await refresh;
  await expectAuthenticated(page);
});

test('should log out through the end session endpoint', async ({ page }) => {
  await login(page);

  const logout = page.waitForRequest(isLogoutRequest());

  await page.getByRole('button', { name: 'Logout' }).click();

  const logoutUrl = new URL((await logout).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  await expectUnauthenticated(page);
});
