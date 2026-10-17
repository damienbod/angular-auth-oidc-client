import { Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  isAuthorizeRequest,
  isLogoutRequest,
  test,
  waitForRefreshTokenRenew,
} from './helpers';

// The auth module is configured in the root module, but login and logout
// happen inside a lazy loaded module. The root route is public; the IdP
// redirects back to the root, so the tests navigate to the lazy route.

async function openLazyModule(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Lazy loaded module' }).click();
  await expect(
    page.getByText('lazy works! Inside the lazy loaded module')
  ).toBeVisible();
}

async function login(page: Page): Promise<void> {
  await page.goto('/');
  await openLazyModule(page);
  await page.getByRole('button', { name: 'Click here to login' }).click();
  await expect(
    page.getByText('Free stuff where the user does not have to authenticate')
  ).toBeVisible();
  await openLazyModule(page);
  await expect(page.getByText('user is authenticated: true')).toBeVisible();
}

test('shows the public root and an unauthenticated lazy module', async ({
  page,
}) => {
  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  await page.goto('/');
  await expect(
    page.getByText('Free stuff where the user does not have to authenticate')
  ).toBeVisible();
  await openLazyModule(page);

  await expect(page.getByText('user is authenticated: false')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Click here to logout' })
  ).toBeHidden();
  expect(authorizeRequests).toEqual([]);
});

test('logs in from inside the lazy loaded module', async ({ page }) => {
  await login(page);

  await expect(
    page.getByRole('button', { name: 'Click here to logout' })
  ).toBeVisible();
});

test('stays authenticated after reloading the lazy route', async ({ page }) => {
  await login(page);

  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  await page.reload();

  await expect(page.getByText('user is authenticated: true')).toBeVisible();
  expect(authorizeRequests).toEqual([]);
});

test('renews the tokens silently with refresh tokens', async ({ page }) => {
  await login(page);

  await waitForRefreshTokenRenew(page);

  await expect(page.getByText('user is authenticated: true')).toBeVisible();
});

test('logs out from inside the lazy loaded module', async ({ page }) => {
  await login(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());

  await page.getByRole('button', { name: 'Click here to logout' }).click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
    'http://localhost:4307'
  );
  await expect(
    page.getByText('Free stuff where the user does not have to authenticate')
  ).toBeVisible();
  await openLazyModule(page);
  await expect(page.getByText('user is authenticated: false')).toBeVisible();
});
