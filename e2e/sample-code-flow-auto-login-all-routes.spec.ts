import { Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  isAuthorizeRequest,
  isLogoutRequest,
  test,
  waitForRefreshTokenRenew,
} from './helpers';

// Every route except /unauthorized and /callback is guarded with
// AutoLoginPartialRoutesGuard, so any visit logs in automatically. The IdP
// redirects back to a dedicated /callback route.

async function expectAuthenticatedHome(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText('Is Authenticated: true')).toBeVisible();
  await expect(page.getByText('Test User IDP1')).toBeVisible();
}

test('should log in automatically on the first visit via the callback route', async ({
  page,
}) => {
  const authorizeRequest = page.waitForRequest(isAuthorizeRequest());
  const callbackNavigation = page.waitForURL(/\/callback\?code=/);

  await page.goto('/');

  const authorizeUrl = new URL((await authorizeRequest).url());

  expect(authorizeUrl.searchParams.get('redirect_uri')).toBe(
    'http://localhost:4303/callback'
  );
  await callbackNavigation;
  await expectAuthenticatedHome(page);
});

test('should return to a deep linked route after login', async ({ page }) => {
  await page.goto('/customers/details');

  await expect(page.getByText('customers works!')).toBeVisible();
  await expect(page).toHaveURL(/\/customers\/details$/);
});

test('should stay authenticated across reloads and guarded routes', async ({
  page,
}) => {
  await page.goto('/');
  await expectAuthenticatedHome(page);

  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  await page.reload();
  await expectAuthenticatedHome(page);

  await page.getByRole('link', { name: 'protected' }).click();
  await expect(page.getByText('protected works!')).toBeVisible();
  await page.getByRole('link', { name: 'lazy customers' }).click();
  await expect(page.getByText('customers works!')).toBeVisible();
  expect(authorizeRequests).toEqual([]);
});

test('should renew the tokens silently with refresh tokens', async ({
  page,
}) => {
  await page.goto('/');
  await expectAuthenticatedHome(page);

  await waitForRefreshTokenRenew(page);

  await expectAuthenticatedHome(page);
});

test('should log out and is logged in again by the guard', async ({ page }) => {
  await page.goto('/');
  await expectAuthenticatedHome(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());
  const reLogin = page.waitForRequest(isAuthorizeRequest());

  // The logout anchor has no href, so it has no link role.
  await page.getByText('Logout', { exact: true }).click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
    'http://localhost:4303'
  );

  // The post logout redirect lands on a guarded route, which logs in again
  // through the IdP's SSO session.
  await reLogin;
  await expectAuthenticatedHome(page);
});
