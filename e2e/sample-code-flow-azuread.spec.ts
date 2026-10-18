import { Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  idp,
  isAuthorizeRequest,
  isLogoutRequest,
  isTokenRequest,
  navLink,
  test,
  waitForRefreshTokenRenew,
} from './helpers';

// Entra ID options (well-known URL without suffix, iss validation off, no user
// info endpoint call), standalone with withAppInitializerAuthCheck() and the
// functional autoLoginPartialRoutesGuard.

async function expectAuthenticated(page: Page): Promise<void> {
  await expect(page.getByText('Is Authenticated: true')).toBeVisible();
  // autoUserInfo is off, so the user data comes from the id_token claims.
  await expect(page.getByText('Test User IDP1')).toBeVisible();
}

test('logs in automatically when opening a guarded route', async ({ page }) => {
  const wellKnown = page.waitForRequest(
    `${idp()}/.well-known/openid-configuration`
  );
  const authorizeRequest = page.waitForRequest(isAuthorizeRequest());
  const userInfoRequests = collectRequests(page, (request) =>
    request.url().startsWith(`${idp()}/userinfo`)
  );

  await page.goto('/home');

  await wellKnown;
  const authorizeUrl = new URL((await authorizeRequest).url());

  expect(authorizeUrl.searchParams.get('prompt')).toBe('select_account');
  expect(authorizeUrl.searchParams.get('client_id')).toBe('client-idp1');

  await expectAuthenticated(page);
  await expect(page).toHaveURL(/\/home$/);
  expect(userInfoRequests).toEqual([]);
});

test('logs in from an unguarded route with the login link', async ({
  page,
}) => {
  await page.goto('/unauthorized');

  await expect(page.getByText('unauthorized works!')).toBeVisible();

  const tokenRequest = page.waitForRequest(
    isTokenRequest('authorization_code')
  );

  await navLink(page, 'Login').click();

  await tokenRequest;
  await expectAuthenticated(page);
});

test('returns to the requested route after login', async ({ page }) => {
  await page.goto('/protected');

  await expect(page.getByText('protected works!')).toBeVisible();
  await expect(page).toHaveURL(/\/protected$/);
});

test('stays authenticated after a page reload', async ({ page }) => {
  await page.goto('/home');
  await expectAuthenticated(page);

  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  await page.reload();

  await expectAuthenticated(page);
  expect(authorizeRequests).toEqual([]);
});

test('renews the tokens silently with refresh tokens', async ({ page }) => {
  await page.goto('/home');
  await expectAuthenticated(page);

  await waitForRefreshTokenRenew(page);

  await expectAuthenticated(page);
});

test('refreshes the session on demand', async ({ page }) => {
  await page.goto('/home');
  await expectAuthenticated(page);

  const refresh = waitForRefreshTokenRenew(page);

  await navLink(page, 'Refresh Session').click();

  await refresh;
  await expectAuthenticated(page);
});

test('logs out through the end session endpoint', async ({ page }) => {
  await page.goto('/home');
  await expectAuthenticated(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());
  // Back on the app, the guard on /home starts a new login right away. The
  // test IdP keeps its SSO session after logout, so the user is logged in again.
  const reLogin = page.waitForRequest(isTokenRequest('authorization_code'));

  await navLink(page, 'Logout').click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
    new URL(page.url()).origin
  );

  await reLogin;
  await expectAuthenticated(page);
});
