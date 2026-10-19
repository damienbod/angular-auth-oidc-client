import { Page, Response } from '@playwright/test';
import {
  collectRequests,
  expect,
  idp,
  isAuthorizeRequest,
  isLogoutRequest,
  test,
} from './helpers';

// Implicit flow (id_token token) with an auto login on every unauthenticated
// route. The app remembers the requested route and returns to it after login.

const ORIGIN = 'http://localhost:4316';

async function expectAuthenticated(page: Page): Promise<void> {
  await expect(page.getByText('Is Authenticated: true')).toBeVisible();
  await expect(page.getByText('Test User IDP1')).toBeVisible();
}

// The IdP answers the implicit authorize request with a redirect that carries
// the tokens in the URL fragment.
function fragmentOf(authorizeResponse: Response): URLSearchParams {
  const location = authorizeResponse.headers()['location'] ?? '';

  return new URLSearchParams(location.split('#')[1] ?? '');
}

test('should log in automatically with the implicit flow', async ({ page }) => {
  const tokenRequests = collectRequests(page, (request) =>
    request.url().startsWith(`${idp()}/token`)
  );
  const authorizeResponse = page.waitForResponse((response) =>
    isAuthorizeRequest()(response.request())
  );

  await page.goto('/home');

  const response = await authorizeResponse;
  const authorizeUrl = new URL(response.url());

  expect(authorizeUrl.searchParams.get('response_type')).toBe('id_token token');
  expect(authorizeUrl.searchParams.get('client_id')).toBe('client-idp1');
  expect(authorizeUrl.searchParams.get('nonce')).toBeTruthy();
  expect(authorizeUrl.searchParams.get('state')).toBeTruthy();
  expect(authorizeUrl.searchParams.get('code_challenge')).toBeNull();

  const fragment = fragmentOf(response);

  expect(fragment.get('id_token')).toBeTruthy();
  expect(fragment.get('access_token')).toBeTruthy();
  expect(fragment.get('state')).toBe(authorizeUrl.searchParams.get('state'));

  await expectAuthenticated(page);
  await expect(page).toHaveURL(`${ORIGIN}/home`);
  // The implicit flow gets the tokens without calling the token endpoint.
  expect(tokenRequests).toEqual([]);
});

test('should return to the requested route after the login', async ({
  page,
}) => {
  await page.goto('/forbidden');

  await expect(
    page.getByText('403: You have no rights to access this.')
  ).toBeVisible();
  await expect(page).toHaveURL(`${ORIGIN}/forbidden`);
  await expect(page.getByText('Logout')).toBeVisible();
});

test('should reject an access token that does not match the at_hash', async ({
  page,
}) => {
  const atHashRejected = page.waitForEvent('console', {
    predicate: (message) =>
      message.text().includes('authCallback incorrect at_hash'),
    timeout: 15_000,
  });
  let tampered = false;

  // Swap the access token in the first redirect from the IdP, so it no longer
  // matches the at_hash claim of the id_token.
  await page.route(`${idp()}/authorize?*`, async (route) => {
    if (tampered) {
      return route.fallback();
    }

    tampered = true;

    const response = await route.fetch({ maxRedirects: 0 });
    const [url, hash] = response.headers()['location'].split('#');
    const fragment = new URLSearchParams(hash);

    fragment.set('access_token', 'tampered-access-token');

    await route.fulfill({
      status: 302,
      headers: { location: `${url}#${fragment}` },
    });
  });

  const secondAuthorize = page.waitForRequest(
    (request) => tampered && isAuthorizeRequest()(request)
  );

  await page.goto('/home');

  await atHashRejected;
  // The rejected callback leaves the app unauthenticated, so it starts a new
  // login, which succeeds with the untouched tokens.
  await secondAuthorize;
  await expectAuthenticated(page);
});

test('should log out through the end session endpoint', async ({ page }) => {
  await page.goto('/home');
  await expectAuthenticated(page);

  const logoutRequest = page.waitForRequest(isLogoutRequest());
  const unauthorizedRoute = page.waitForRequest(`${ORIGIN}/unauthorized`);

  await page.getByText('Logout').click();

  const logoutUrl = new URL((await logoutRequest).url());

  expect(logoutUrl.searchParams.get('id_token_hint')).toBeTruthy();
  expect(logoutUrl.searchParams.get('post_logout_redirect_uri')).toBe(
    `${ORIGIN}/unauthorized`
  );

  // The IdP redirects back to the unauthorized route. As every unauthenticated
  // route auto logs in, the app then starts a new login right away.
  await unauthorizedRoute;
});
