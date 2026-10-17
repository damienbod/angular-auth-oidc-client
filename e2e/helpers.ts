import { expect, Locator, Page, Request, test as base } from '@playwright/test';

export const IDP_ORIGIN = 'http://localhost:8081';

export type Realm = 'idp1' | 'idp2' | 'idp3';

export const USER_NAMES: Record<Realm, string> = {
  idp1: 'Test User IDP1',
  idp2: 'Test User IDP2',
  idp3: 'testuser3',
};

export function idp(realm: Realm = 'idp1'): string {
  return `${IDP_ORIGIN}/${realm}`;
}

// Fails a test on uncaught errors in any page of the browser context,
// including popups and additional tabs.
export const test = base.extend<{ pageErrors: Error[] }>({
  pageErrors: [
    async ({ context }, use) => {
      const errors: Error[] = [];
      const watch = (page: Page): void => {
        page.on('pageerror', (error) => errors.push(error));
      };

      context.pages().forEach(watch);
      context.on('page', watch);
      await use(errors);
      expect(errors, 'uncaught errors in the app').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export function formParams(request: Request): URLSearchParams {
  return new URLSearchParams(request.postData() ?? '');
}

export function isTokenRequest(grantType: string, realm: Realm = 'idp1') {
  return (request: Request): boolean =>
    request.method() === 'POST' &&
    request.url() === `${idp(realm)}/token` &&
    formParams(request).get('grant_type') === grantType;
}

export function isAuthorizeRequest(realm: Realm = 'idp1') {
  return (request: Request): boolean =>
    request.url().startsWith(`${idp(realm)}/authorize`);
}

export function isSilentRenewRequest(realm: Realm = 'idp1') {
  return (request: Request): boolean =>
    isAuthorizeRequest(realm)(request) &&
    new URL(request.url()).searchParams.get('prompt') === 'none';
}

export function isLogoutRequest(realm: Realm = 'idp1') {
  return (request: Request): boolean =>
    request.url().startsWith(`${idp(realm)}/logout`);
}

export function isRevocationRequest(realm: Realm = 'idp1') {
  return (request: Request): boolean =>
    request.method() === 'POST' && request.url() === `${idp(realm)}/revoke`;
}

// Waits for a refresh token grant and returns the refresh token it sent.
export async function waitForRefreshTokenRenew(
  page: Page,
  realm: Realm = 'idp1'
): Promise<string> {
  const request = await page.waitForRequest(
    isTokenRequest('refresh_token', realm),
    { timeout: 30_000 }
  );
  const response = await request.response();

  expect(response?.status()).toBe(200);

  return formParams(request).get('refresh_token') ?? '';
}

// Waits for an iframe based silent renew (prompt=none) and its code exchange.
export async function waitForIframeRenew(
  page: Page,
  realm: Realm = 'idp1'
): Promise<void> {
  await page.waitForRequest(isSilentRenewRequest(realm), { timeout: 30_000 });
  const tokenRequest = await page.waitForRequest(
    isTokenRequest('authorization_code', realm)
  );

  expect((await tokenRequest.response())?.status()).toBe(200);
}

// The block of a multi-config sample that belongs to one config: its <h3>
// with the config id and the buttons next to it.
export function section(page: Page, configId: string): Locator {
  return page
    .getByRole('heading', { name: configId, exact: true })
    .locator('..');
}

// Nav links with a (click) handler and no href, which getByRole('link')
// does not find.
export function navLink(page: Page, name: string): Locator {
  return page.locator('a.nav-link', { hasText: new RegExp(`^${name}$`) });
}

// Collects matching requests from now on, e.g. to assert none happened.
export function collectRequests(
  page: Page,
  predicate: (request: Request) => boolean
): Request[] {
  const requests: Request[] = [];

  page.on('request', (request) => {
    if (predicate(request)) {
      requests.push(request);
    }
  });

  return requests;
}
