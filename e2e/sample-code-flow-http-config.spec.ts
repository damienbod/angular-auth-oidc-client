import { BrowserContext, Page } from '@playwright/test';
import {
  collectRequests,
  expect,
  idp,
  isAuthorizeRequest,
  isLogoutRequest,
  isTokenRequest,
  test,
  waitForIframeRenew,
} from './helpers';

// The config is loaded over HTTP with StsConfigHttpLoader, the silent renew
// runs in an iframe (silent-renew.html) without refresh tokens. The sample is
// tested unchanged: the config request is intercepted and answered with a
// config that points at the test IdP.

const CONFIG_URL =
  'https://offeringsolutions-sts.azurewebsites.net/api/ClientAppSettings';

async function serveClientAppSettings(
  context: BrowserContext,
  origin: string
): Promise<void> {
  await context.route(CONFIG_URL, (route) =>
    route.fulfill({
      headers: { 'Access-Control-Allow-Origin': '*' },
      json: {
        stsServer: idp(),
        redirect_url: origin,
        client_id: 'client-idp1',
        response_type: 'code',
        scope: 'openid profile email',
        post_logout_redirect_uri: origin,
        start_checksession: true,
        silent_renew: true,
        startup_route: '/home',
        forbidden_route: '/forbidden',
        unauthorized_route: '/unauthorized',
        max_id_token_iat_offset_allowed_in_seconds: 10,
      },
    })
  );
}

test.beforeEach(async ({ context, baseURL }) => {
  await serveClientAppSettings(context, baseURL ?? '');
});

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

test('should load the config over HTTP', async ({ page }) => {
  const configRequest = page.waitForRequest(CONFIG_URL);

  await page.goto('/');

  await configRequest;
  await expectUnauthenticated(page);
  // The loaded config is shown on the page.
  await expect(page.getByText(`"clientId": "client-idp1"`)).toBeVisible();
  await expect(page.getByText(`"authority": "${idp()}"`)).toBeVisible();
});

test('should log in with the code flow and PKCE', async ({ page }) => {
  await page.goto('/');

  const authorizeRequest = page.waitForRequest(isAuthorizeRequest());

  await page.getByRole('button', { name: 'Login', exact: true }).click();

  const authorizeUrl = new URL((await authorizeRequest).url());

  expect(authorizeUrl.searchParams.get('client_id')).toBe('client-idp1');
  expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');

  await expectAuthenticated(page);
  await expect(page).toHaveURL(/\/home$/);
});

test('should stay authenticated after a page reload', async ({ page }) => {
  await login(page);

  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  await page.reload();

  await expectAuthenticated(page);
  expect(authorizeRequests).toEqual([]);
});

test('should refresh the session in an iframe', async ({ page }) => {
  await login(page);

  const renew = waitForIframeRenew(page);
  const refreshTokenRequests = collectRequests(
    page,
    isTokenRequest('refresh_token')
  );

  await page.getByRole('button', { name: 'refreshSession' }).click();

  await renew;
  await expectAuthenticated(page);
  expect(refreshTokenRequests).toEqual([]);
  expect(
    page.frames().some((frame) => frame.url().includes('/silent-renew.html'))
  ).toBe(true);
});

test('should log off locally without calling the IdP', async ({ page }) => {
  await login(page);

  const logoutRequests = collectRequests(page, isLogoutRequest());

  await page.getByRole('button', { name: 'Logoff Local' }).click();

  await expectUnauthenticated(page);
  expect(logoutRequests).toEqual([]);
});

test('should log out through the end session endpoint', async ({
  page,
  baseURL,
}) => {
  await login(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());

  await page.getByRole('button', { name: 'Logout', exact: true }).click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(baseURL);

  await expectUnauthenticated(page);
});
