import { Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  formParams,
  isAuthorizeRequest,
  isLogoutRequest,
  isRevocationRequest,
  isTokenRequest,
  test,
  waitForRefreshTokenRenew,
} from './helpers';

// Code flow + PKCE with refresh tokens and Auth0 style custom parameters:
// an `audience` on the authorize request and a `scope` on refresh requests.

const AUTH0_SCOPE = 'openid profile offline_access auth0-user-api-spa';

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

async function login(page: Page): Promise<void> {
  await page.goto('/');
  await expectUnauthenticated(page);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expectAuthenticated(page);
}

test('should be unauthenticated on first visit', async ({ page }) => {
  await page.goto('/');

  await expectUnauthenticated(page);
});

test('should log in and sends the audience custom parameter', async ({
  page,
}) => {
  await page.goto('/');

  const authorizeRequest = page.waitForRequest(isAuthorizeRequest());
  const tokenRequest = page.waitForRequest(
    isTokenRequest('authorization_code')
  );

  await page.getByRole('button', { name: 'Login', exact: true }).click();

  const authorizeUrl = new URL((await authorizeRequest).url());

  expect(authorizeUrl.searchParams.get('audience')).toBe(
    'https://auth0-api-spa'
  );
  expect(authorizeUrl.searchParams.get('scope')).toBe(AUTH0_SCOPE);
  expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');
  expect(formParams(await tokenRequest).get('code_verifier')).toBeTruthy();

  await expectAuthenticated(page);
  await expect(page).not.toHaveURL(/[?&](code|state)=/);
});

test('should stay authenticated after a page reload', async ({ page }) => {
  await login(page);

  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  await page.reload();

  await expectAuthenticated(page);
  expect(authorizeRequests).toEqual([]);
});

test('should renew silently with the custom scope on the refresh request', async ({
  page,
}) => {
  await login(page);

  const refreshRequest = page.waitForRequest(isTokenRequest('refresh_token'), {
    timeout: 30_000,
  });
  const firstRefreshToken = await waitForRefreshTokenRenew(page);

  expect(formParams(await refreshRequest).get('scope')).toBe(AUTH0_SCOPE);

  const secondRefreshToken = await waitForRefreshTokenRenew(page);

  expect(secondRefreshToken).not.toBe(firstRefreshToken);
  await expectAuthenticated(page);
});

test('should refresh the session on demand', async ({ page }) => {
  await login(page);

  const refresh = waitForRefreshTokenRenew(page);

  await page.getByRole('button', { name: 'Refresh session' }).click();

  await refresh;
  await expectAuthenticated(page);
});

test('should revoke the refresh token', async ({ page }) => {
  await login(page);

  const revocation = page.waitForRequest(isRevocationRequest());

  await page.getByRole('button', { name: 'Revoke refresh token' }).click();

  expect(formParams(await revocation).get('token_type_hint')).toBe(
    'refresh_token'
  );
  expect((await (await revocation).response())?.status()).toBe(200);
});

test('should log out and revokes the tokens', async ({ page }) => {
  await login(page);

  const revocation = page.waitForRequest(isRevocationRequest());
  const logout = page.waitForRequest(isLogoutRequest());

  await page.getByRole('button', { name: 'Logout and revoke tokens' }).click();

  await revocation;
  await logout;
  await expectUnauthenticated(page);
});

test('should log out through the end session endpoint', async ({ page }) => {
  await login(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());

  await page.getByRole('button', { name: 'Logout', exact: true }).click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
    'http://localhost:4301'
  );
  await expectUnauthenticated(page);
});
