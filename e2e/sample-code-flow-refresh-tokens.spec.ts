import { Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  formParams,
  idp,
  isAuthorizeRequest,
  isLogoutRequest,
  isRevocationRequest,
  isTokenRequest,
  test,
  waitForRefreshTokenRenew,
} from './helpers';

// Code flow + PKCE with refresh tokens, NgModule based, login via button.

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

test('is unauthenticated on first visit', async ({ page }) => {
  await page.goto('/');

  await expectUnauthenticated(page);
});

test('logs in with the code flow and PKCE', async ({ page }) => {
  await page.goto('/');

  const authorizeRequest = page.waitForRequest(isAuthorizeRequest());
  const tokenRequest = page.waitForRequest(
    isTokenRequest('authorization_code')
  );

  await page.getByRole('button', { name: 'Login', exact: true }).click();

  const authorizeUrl = new URL((await authorizeRequest).url());

  expect(authorizeUrl.searchParams.get('response_type')).toBe('code');
  expect(authorizeUrl.searchParams.get('client_id')).toBe('client-idp1');
  expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');
  expect(authorizeUrl.searchParams.get('code_challenge')).toBeTruthy();
  expect(authorizeUrl.searchParams.get('state')).toBeTruthy();
  expect(authorizeUrl.searchParams.get('nonce')).toBeTruthy();

  const tokenParams = formParams(await tokenRequest);

  expect(tokenParams.get('code_verifier')).toBeTruthy();
  expect((await (await tokenRequest).response())?.status()).toBe(200);

  await expectAuthenticated(page);
  // The code and state are removed from the URL after the callback.
  await expect(page).not.toHaveURL(/[?&](code|state)=/);
});

test('stays authenticated after a page reload', async ({ page }) => {
  await login(page);

  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  await page.reload();

  await expectAuthenticated(page);
  expect(authorizeRequests).toEqual([]);
});

test('renews the tokens silently with rotating refresh tokens', async ({
  page,
}) => {
  await login(page);

  const firstRefreshToken = await waitForRefreshTokenRenew(page);
  const secondRefreshToken = await waitForRefreshTokenRenew(page);

  // The test IdP rotates refresh tokens, so the second renew only succeeds
  // if the library stored the refresh token returned by the first renew.
  expect(secondRefreshToken).not.toBe(firstRefreshToken);
  await expectAuthenticated(page);
});

test('refreshes the session on demand', async ({ page }) => {
  await login(page);

  const refresh = waitForRefreshTokenRenew(page);

  await page.getByRole('button', { name: 'Refresh session' }).click();

  await refresh;
  await expectAuthenticated(page);
});

test('keeps independent sessions in multiple tabs', async ({
  context,
  page,
}) => {
  await login(page);

  // Each tab keeps its own session in sessionStorage, so the second tab
  // starts unauthenticated and logs in through the IdP's SSO session.
  const secondTab = await context.newPage();

  await login(secondTab);

  await Promise.all([
    waitForRefreshTokenRenew(page),
    waitForRefreshTokenRenew(secondTab),
  ]);

  await expectAuthenticated(page);
  await expectAuthenticated(secondTab);

  await secondTab.reload();
  await expectAuthenticated(secondTab);
  await expectAuthenticated(page);
});

test('revokes the refresh token', async ({ page }) => {
  await login(page);

  const revocation = page.waitForRequest(isRevocationRequest());

  await page.getByRole('button', { name: 'Revoke refresh token' }).click();

  const params = formParams(await revocation);

  expect(params.get('token_type_hint')).toBe('refresh_token');
  expect((await (await revocation).response())?.status()).toBe(200);
});

test('logs out and revokes the tokens', async ({ page }) => {
  await login(page);

  const revocation = page.waitForRequest(isRevocationRequest());
  const logout = page.waitForRequest(isLogoutRequest());

  await page.getByRole('button', { name: 'Logout and revoke tokens' }).click();

  await revocation;
  await logout;
  await expectUnauthenticated(page);
});

test('logs out through the end session endpoint', async ({ page }) => {
  await login(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());

  await page.getByRole('button', { name: 'Logout', exact: true }).click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.origin + logoutUrl.pathname).toBe(`${idp()}/logout`);
  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
    'http://localhost:4318'
  );

  await expectUnauthenticated(page);
});
