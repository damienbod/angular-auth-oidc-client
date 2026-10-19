import { Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  isAuthorizeRequest,
  isLogoutRequest,
  test,
  waitForRefreshTokenRenew,
} from './helpers';

// Auto login with the functional autoLoginPartialRoutesGuard in a standalone app
// (provideAuth, signals): guarded routes (and the lazy
// loaded customers module) redirect to the IdP and return to the requested
// route after login. The home route is public.

const AUTO_LOGIN_LINK = "Route to 'protected' Route & Auto Login";

async function expectAuthenticatedHome(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'home', exact: true }).click();
  await expect(page.getByText('Is Authenticated: true')).toBeVisible();
  await expect(page.getByText('Test User IDP1')).toBeVisible();
}

async function loginViaProtectedRoute(page: Page): Promise<void> {
  await page.goto('/protected');
  await expect(page.getByText('protected works!')).toBeVisible();
  await expect(page).toHaveURL(/\/protected$/);
}

test('should show the public home route without logging in', async ({
  page,
}) => {
  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  await page.goto('/');

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText('Is Authenticated: false')).toBeVisible();
  await expect(page.getByRole('link', { name: AUTO_LOGIN_LINK })).toBeVisible();
  expect(authorizeRequests).toEqual([]);
});

test('should log in automatically when navigating to a guarded route', async ({
  page,
}) => {
  await page.goto('/');

  const authorizeRequest = page.waitForRequest(isAuthorizeRequest());

  await page.getByRole('link', { name: AUTO_LOGIN_LINK }).click();

  await authorizeRequest;
  await expect(page.getByText('protected works!')).toBeVisible();
  await expect(page).toHaveURL(/\/protected$/);
  await expectAuthenticatedHome(page);
});

test('should return to a deep linked guarded route after login', async ({
  page,
}) => {
  await loginViaProtectedRoute(page);
});

test.describe('lazy loaded routes guarded with canMatch', () => {
  test('should log in automatically when loading the lazy loaded module', async ({
    page,
  }) => {
    await page.goto('/customers/details');

    await expect(page.getByText('customers works!')).toBeVisible();
    await expect(page).toHaveURL(/\/customers\/details$/);
  });

  test('should open the lazy loaded module once authenticated', async ({
    page,
  }) => {
    await loginViaProtectedRoute(page);

    await page.getByRole('link', { name: 'lazy customers' }).click();

    await expect(page.getByText('customers works!')).toBeVisible();
  });
});

test('should navigate guarded routes without a new login once authenticated', async ({
  page,
}) => {
  await loginViaProtectedRoute(page);

  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  await page.getByRole('link', { name: 'forbidden' }).click();
  await expect(
    page.getByText('Normally you should not see this, authenticated == true')
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByText('Normally you should not see this, authenticated == true')
  ).toBeVisible();
  expect(authorizeRequests).toEqual([]);
});

test('should renew the tokens silently with refresh tokens', async ({
  page,
}) => {
  await loginViaProtectedRoute(page);

  await waitForRefreshTokenRenew(page);

  await expectAuthenticatedHome(page);
});

test('should log out through the end session endpoint', async ({ page }) => {
  await loginViaProtectedRoute(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());

  // The logout anchor has no href, so it has no link role.
  await page.getByText('Logout', { exact: true }).click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
    'http://localhost:4315'
  );
  await expect(page.getByText('Is Authenticated: false')).toBeVisible();
  await expect(page.getByRole('link', { name: AUTO_LOGIN_LINK })).toBeVisible();
});
