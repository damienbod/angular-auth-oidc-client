import { Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  isAuthorizeRequest,
  isLogoutRequest,
  isTokenRequest,
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

  // The root shell (with the "Free stuff" heading and the lazy link) is also
  // on the page before the redirect, so wait for the code exchange to be on
  // the app again before opening the lazy module.
  const tokenRequest = page.waitForRequest(
    isTokenRequest('authorization_code')
  );

  await page.getByRole('button', { name: 'Click here to login' }).click();
  expect((await (await tokenRequest).response())?.status()).toBe(200);
  await expect(
    page.getByText('Free stuff where the user does not have to authenticate')
  ).toBeVisible();
  await openLazyModule(page);
  await expect(page.getByText('user is authenticated: true')).toBeVisible();
}

test('should show the public root and an unauthenticated lazy module', async ({
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

test('should log in from inside the lazy loaded module', async ({ page }) => {
  await login(page);

  await expect(
    page.getByRole('button', { name: 'Click here to logout' })
  ).toBeVisible();
});

test('should stay authenticated after reloading the lazy route', async ({
  page,
}) => {
  await login(page);

  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  await page.reload();

  await expect(page.getByText('user is authenticated: true')).toBeVisible();
  expect(authorizeRequests).toEqual([]);
});

test('should renew the tokens silently with refresh tokens', async ({
  page,
}) => {
  await login(page);

  await waitForRefreshTokenRenew(page);

  await expect(page.getByText('user is authenticated: true')).toBeVisible();
});

test('should log out from inside the lazy loaded module', async ({
  page,
  baseURL,
}) => {
  await login(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());

  await page.getByRole('button', { name: 'Click here to logout' }).click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
    'http://localhost:4307'
  );
  // The IdP redirects back to the root; the lazy route stays on screen until
  // then, so wait for the new document before opening the lazy module again.
  await page.waitForURL(`${baseURL}/`);
  await expect(
    page.getByText('Free stuff where the user does not have to authenticate')
  ).toBeVisible();
  await openLazyModule(page);
  await expect(page.getByText('user is authenticated: false')).toBeVisible();
});
