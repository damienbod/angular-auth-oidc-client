import { Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  idp,
  isLogoutRequest,
  isSilentRenewRequest,
  test,
} from './helpers';

// Implicit flow (id_token token) with silent renew in an iframe. On start the
// app calls checkAuthIncludingServer(), which tries a silent login
// (prompt=none) against the IdP session.

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

// Waits for a silent (prompt=none) authorize request from the renew iframe
// and returns the URL fragment the IdP redirected the iframe to.
async function waitForSilentAuthorize(page: Page): Promise<URLSearchParams> {
  const response = await page.waitForResponse(
    (candidate) => isSilentRenewRequest()(candidate.request()),
    { timeout: 30_000 }
  );
  const location = response.headers()['location'] ?? '';

  expect(response.request().frame()).not.toBe(page.mainFrame());
  expect(location).toContain('/silent-renew.html#');

  return new URLSearchParams(location.split('#')[1]);
}

async function waitForSilentRenew(page: Page): Promise<string> {
  const fragment = await waitForSilentAuthorize(page);

  expect(fragment.get('error')).toBeNull();
  expect(fragment.get('access_token')).toBeTruthy();

  return fragment.get('id_token') ?? '';
}

async function login(page: Page): Promise<void> {
  await page.goto('/');
  await expectUnauthenticated(page);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expectAuthenticated(page);
}

test('stays unauthenticated without an IdP session', async ({ page }) => {
  const silentLogin = waitForSilentAuthorize(page);

  await page.goto('/');

  // checkAuthIncludingServer() tries a silent login, which the IdP refuses.
  expect((await silentLogin).get('error')).toBe('login_required');
  await expectUnauthenticated(page);
});

test('logs in with the implicit flow', async ({ page }) => {
  await login(page);

  await expect(page).not.toHaveURL(/#|id_token|access_token/);
});

test('logs in silently in a new tab with the IdP session', async ({
  context,
  page,
}) => {
  await login(page);

  // sessionStorage is per tab, so the new tab has no tokens yet and gets them
  // through the silent login with the IdP's SSO session.
  const secondTab = await context.newPage();
  const silentLogin = waitForSilentRenew(secondTab);
  const authorizeRedirects = collectRequests(
    secondTab,
    (request) =>
      request.isNavigationRequest() &&
      request.frame() === secondTab.mainFrame() &&
      request.url().startsWith(idp())
  );

  await secondTab.goto('/');

  await silentLogin;
  await expectAuthenticated(secondTab);
  expect(authorizeRedirects).toEqual([]);
});

test('renews the tokens silently in an iframe', async ({ page }) => {
  await login(page);

  const firstIdToken = await waitForSilentRenew(page);
  const secondIdToken = await waitForSilentRenew(page);

  expect(secondIdToken).not.toBe(firstIdToken);
  await expectAuthenticated(page);
});

test('refreshes the session on demand', async ({ page }) => {
  await login(page);

  const renew = waitForSilentRenew(page);

  await page.getByRole('button', { name: 'RefreshSession' }).click();

  await renew;
  await expectAuthenticated(page);
});

test('logs out through the end session endpoint', async ({ page }) => {
  await login(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());
  // The app is shown authenticated until the IdP redirects back to the same
  // URL, so wait for that new document before checking the state.
  const backOnApp = page.waitForEvent('load');

  await page.getByRole('button', { name: 'Logout', exact: true }).click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
    'http://localhost:4317'
  );

  // After the logout the IdP session (SSO cookie) still exists, so the
  // silent login of checkAuthIncludingServer() signs the user in again.
  await backOnApp;
  await expectAuthenticated(page);
});
