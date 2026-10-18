import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  createEnvironmentInjector,
  EnvironmentInjector,
  ɵINJECTOR_SCOPE as INJECTOR_SCOPE,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  AbstractSecurityStorage,
  DefaultLocalStorageService,
  EventTypes,
  LogLevel,
  OidcSecurityService,
  OpenIdConfiguration,
  provideAuth,
  PublicEventsService,
} from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';

const idpHost = 'http://localhost:8081';
const configId = 'idp1';

function createConfig(
  overrides: Partial<OpenIdConfiguration> = {}
): OpenIdConfiguration {
  return {
    configId,
    authority: `${idpHost}/idp1`,
    redirectUrl: `${window.location.origin}/callback`,
    postLogoutRedirectUri: `${window.location.origin}/`,
    clientId: 'client-idp1',
    responseType: 'code',
    scope: 'openid profile email offline_access',
    silentRenew: false,
    useRefreshToken: true,
    useRefreshTokenLock: true,
    logLevel: LogLevel.Warn,
    ...overrides,
  };
}

// Every "tab" gets its own root-scoped injector, so all library services are
// separate instances, while localStorage and navigator.locks are shared, just
// like two browser tabs of the same origin.
function createTab(
  config: OpenIdConfiguration,
  interceptors: HttpInterceptorFn[] = []
): { injector: EnvironmentInjector; oidc: OidcSecurityService } {
  const injector = createEnvironmentInjector(
    [
      { provide: INJECTOR_SCOPE, useValue: 'root' },
      provideHttpClient(withInterceptors(interceptors)),
      provideAuth({ config }),
      {
        provide: AbstractSecurityStorage,
        useClass: DefaultLocalStorageService,
      },
    ],
    TestBed.inject(EnvironmentInjector)
  );

  return { injector, oidc: injector.get(OidcSecurityService) };
}

function startLogin(oidc: OidcSecurityService): Promise<string> {
  return new Promise<string>((resolve) => {
    oidc.authorize(configId, {
      customParams: { test_response_mode: 'json' },
      urlHandler: resolve,
    });
  });
}

async function finishLogin(
  oidc: OidcSecurityService,
  authorizeUrl: string
): Promise<boolean> {
  const authorizeResponse = await fetch(authorizeUrl, {
    credentials: 'include',
  });
  const { redirect_to } = await authorizeResponse.json();
  const loginResponse = await firstValueFrom(
    oidc.checkAuth(redirect_to, configId)
  );

  return loginResponse.isAuthenticated;
}

async function login(oidc: OidcSecurityService): Promise<void> {
  expect(await finishLogin(oidc, await startLogin(oidc))).toBe(true);
}

describe('Multi-tab refresh token lock', () => {
  const tabs: EnvironmentInjector[] = [];

  beforeAll(async () => {
    const healthResponse = await fetch(`${idpHost}/health`);

    expect(healthResponse.ok).toBe(true);
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    tabs.forEach((tab) => {
      // stops the periodic token check, which outlives the injector otherwise
      tab.get(OidcSecurityService).logoffLocal(configId);
      tab.destroy();
    });
    tabs.length = 0;
    localStorage.clear();
  });

  it('keeps both tabs authenticated when they force a refresh at the same time', async () => {
    // Arrange
    const config = createConfig();
    const tab1 = createTab(config);
    const tab2 = createTab(config);

    tabs.push(tab1.injector, tab2.injector);

    await login(tab1.oidc);
    await firstValueFrom(tab2.oidc.checkAuth(window.location.href, configId));

    // Act
    const [result1, result2] = await Promise.all([
      firstValueFrom(tab1.oidc.forceRefreshSession(undefined, configId)),
      firstValueFrom(tab2.oidc.forceRefreshSession(undefined, configId)),
    ]);

    // Assert
    expect(result1.isAuthenticated).toBe(true);
    expect(result2.isAuthenticated).toBe(true);
    expect(result2.accessToken).toBe(result1.accessToken);
  }, 30000);

  it('keeps a refresh and a login in another tab valid when they overlap', async () => {
    // Arrange
    const config = createConfig();
    let tab2LoginUrl: Promise<string> | null = null;
    // a freshly opened tab, whose guard redirects to the login, starts the code
    // flow while tab1 waits for the response of its refresh token request
    const startTab2LoginOnRefresh: HttpInterceptorFn = (req, next) => {
      if (String(req.body).includes('grant_type=refresh_token')) {
        tab2LoginUrl = startLogin(tab2.oidc);
      }

      return next(req);
    };
    const tab1 = createTab(config, [startTab2LoginOnRefresh]);
    const tab2 = createTab(config);

    tabs.push(tab1.injector, tab2.injector);

    await login(tab1.oidc);

    // Act
    const refreshResult = await firstValueFrom(
      tab1.oidc.forceRefreshSession(undefined, configId)
    );
    const isTab2LoggedIn =
      tab2LoginUrl !== null &&
      (await finishLogin(tab2.oidc, await tab2LoginUrl));

    // Assert
    expect(refreshResult.isAuthenticated).toBe(true);
    expect(isTab2LoggedIn).toBe(true);
  }, 30000);

  it('keeps both tabs authenticated while the periodic silent renew runs in both', async () => {
    // Arrange
    // tokens live 300s, so with 298s renew offset every tab wants to refresh
    // ~2s after each renewal
    const config = createConfig({
      silentRenew: true,
      tokenRefreshInSeconds: 1,
      renewTimeBeforeTokenExpiresInSeconds: 298,
    });
    const tab1 = createTab(config);
    const tab2 = createTab(config);
    const failures: string[] = [];

    tabs.push(tab1.injector, tab2.injector);

    [tab1, tab2].forEach((tab, i) =>
      tab.injector
        .get(PublicEventsService)
        .registerForEvents()
        .subscribe((event) => {
          if (event.type === EventTypes.SilentRenewFailed) {
            failures.push(`tab${i + 1}: ${String(event.value)}`);
          }
        })
    );

    await login(tab1.oidc);
    await firstValueFrom(tab2.oidc.checkAuth(window.location.href, configId));

    // Act
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const isTab1Authenticated = await firstValueFrom(
      tab1.oidc.isAuthenticated(configId)
    );
    const isTab2Authenticated = await firstValueFrom(
      tab2.oidc.isAuthenticated(configId)
    );

    // Assert
    expect(failures).toEqual([]);
    expect(isTab1Authenticated).toBe(true);
    expect(isTab2Authenticated).toBe(true);
  }, 30000);
});
