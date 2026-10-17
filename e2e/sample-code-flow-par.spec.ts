import { BrowserContext, Page, Request } from '@playwright/test';
import {
  expect,
  formParams,
  idp,
  isAuthorizeRequest,
  isLogoutRequest,
  isTokenRequest,
  test,
  waitForRefreshTokenRenew,
} from './helpers';

// Code flow + PKCE with pushed authorization requests (PAR) and refresh tokens.

interface PushedAuthorizationRequest {
  params: URLSearchParams;
  requestUri: string;
}

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

// Records the PAR request and the request_uri the IdP answered with. The
// response body is read through a route, because the page navigates away
// right after the response arrives.
async function recordPushedAuthorizationRequest(
  page: Page
): Promise<() => PushedAuthorizationRequest> {
  let pushed: PushedAuthorizationRequest | undefined;

  await page.route(`${idp()}/par`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();

    expect(response.status()).toBe(201);
    pushed = {
      params: formParams(route.request()),
      requestUri: body.request_uri,
    };
    await route.fulfill({ response, json: body });
  });

  return () => {
    expect(pushed, 'no PAR request was sent').toBeDefined();

    return pushed!;
  };
}

// Authorize requests are watched on the context, because the popup closes
// itself as soon as the test IdP redirects back.
function waitForAuthorizeRequest(context: BrowserContext): Promise<Request> {
  return context.waitForEvent('request', isAuthorizeRequest());
}

// The authorize request carries only the client_id and the request_uri
// returned by the PAR endpoint; all other parameters were pushed.
async function expectPushedAuthorizeRequest(
  getPushed: () => PushedAuthorizationRequest,
  authorizeRequest: Request
): Promise<void> {
  const authorizeUrl = new URL(authorizeRequest.url());
  const { params, requestUri } = getPushed();

  expect(params.get('client_id')).toBe('client-idp1');
  expect(params.get('response_type')).toBe('code');
  expect(params.get('code_challenge_method')).toBe('S256');
  expect(params.get('code_challenge')).toBeTruthy();
  expect(params.get('state')).toBeTruthy();
  expect(params.get('prompt')).toBe('consent');
  expect(requestUri).toMatch(/^urn:ietf:params:oauth:request_uri:/);

  expect([...authorizeUrl.searchParams.keys()].sort()).toEqual([
    'client_id',
    'request_uri',
  ]);
  expect(authorizeUrl.searchParams.get('request_uri')).toBe(requestUri);
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

test('logs in with a pushed authorization request', async ({
  context,
  page,
}) => {
  await page.goto('/');

  const getPushed = await recordPushedAuthorizationRequest(page);
  const authorizeRequest = waitForAuthorizeRequest(context);
  const tokenRequest = page.waitForRequest(
    isTokenRequest('authorization_code')
  );

  await page.getByRole('button', { name: 'Login', exact: true }).click();

  await expectPushedAuthorizeRequest(getPushed, await authorizeRequest);
  expect(formParams(await tokenRequest).get('code_verifier')).toBeTruthy();
  expect((await (await tokenRequest).response())?.status()).toBe(200);

  await expectAuthenticated(page);
  await expect(page).not.toHaveURL(/[?&](code|state)=/);
});

test('logs in with a pushed authorization request in a popup', async ({
  context,
  page,
}) => {
  await page.goto('/');

  const getPushed = await recordPushedAuthorizationRequest(page);
  const authorizeRequest = waitForAuthorizeRequest(context);
  const popup = page.waitForEvent('popup');

  await page.getByRole('button', { name: 'Login Popup' }).click();

  // The popup is opened with the PAR based authorize URL.
  await popup;
  await expectPushedAuthorizeRequest(getPushed, await authorizeRequest);

  await expectAuthenticated(page);
});

test('refreshes the session with the refresh token', async ({ page }) => {
  await login(page);

  const refresh = waitForRefreshTokenRenew(page);

  await page.getByRole('button', { name: 'Refresh session' }).click();

  await refresh;
  await expectAuthenticated(page);
});

test('logs out through the end session endpoint', async ({ page }) => {
  await login(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());

  await page.getByRole('button', { name: 'Logout', exact: true }).click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
    'http://localhost:4313'
  );

  await expectUnauthenticated(page);
});
