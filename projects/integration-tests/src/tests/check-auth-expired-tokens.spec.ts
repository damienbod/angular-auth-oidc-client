import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
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
    silentRenew: true,
    useRefreshToken: true,
    logLevel: LogLevel.None,
    ...overrides,
  };
}

function updateStoredAuthData(update: (data: any) => void): void {
  const data = JSON.parse(localStorage.getItem(configId) as string);

  update(data);
  localStorage.setItem(configId, JSON.stringify(data));
}

describe('checkAuth with expired tokens', () => {
  const apps: EnvironmentInjector[] = [];

  // Every call starts the application anew: all library services are new
  // instances, only the tokens in localStorage are kept.
  function startApp(config: OpenIdConfiguration): {
    injector: EnvironmentInjector;
    oidc: OidcSecurityService;
  } {
    const injector = createEnvironmentInjector(
      [
        { provide: INJECTOR_SCOPE, useValue: 'root' },
        provideHttpClient(),
        provideAuth({ config }),
        {
          provide: AbstractSecurityStorage,
          useClass: DefaultLocalStorageService,
        },
      ],
      TestBed.inject(EnvironmentInjector)
    );

    apps.push(injector);

    return { injector, oidc: injector.get(OidcSecurityService) };
  }

  async function login(): Promise<string> {
    const { oidc } = startApp(createConfig({ silentRenew: false }));
    const authorizeUrl = await new Promise<string>((resolve) => {
      oidc.authorize(configId, {
        customParams: { test_response_mode: 'json' },
        urlHandler: resolve,
      });
    });
    const authorizeResponse = await fetch(authorizeUrl, {
      credentials: 'include',
    });
    const { redirect_to } = await authorizeResponse.json();
    const { isAuthenticated, accessToken } = await firstValueFrom(
      oidc.checkAuth(redirect_to, configId)
    );

    expect(isAuthenticated).toBe(true);

    return accessToken;
  }

  beforeAll(async () => {
    const healthResponse = await fetch(`${idpHost}/health`);

    expect(healthResponse.ok).toBe(true);
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    apps.forEach((app) => {
      // stops the periodic token check, which outlives the injector otherwise
      app.get(OidcSecurityService).logoffLocal(configId);
      app.destroy();
    });
    apps.length = 0;
    localStorage.clear();
  });

  it('should renew the tokens with the refresh token when the application starts with an expired access token', async () => {
    // Arrange
    const staleAccessToken = await login();
    const { oidc } = startApp(createConfig());

    updateStoredAuthData((data) => {
      data.access_token_expires_at = Date.now() - 60000;
    });

    // Act
    const result = await firstValueFrom(
      oidc.checkAuth(window.location.href, configId)
    );

    // Assert
    expect(result.isAuthenticated).toBe(true);
    expect(result.accessToken).toBeTruthy();
    expect(result.accessToken).not.toBe(staleAccessToken);
    expect(await firstValueFrom(oidc.isAuthenticated(configId))).toBe(true);
  });

  it('should leave the user unauthenticated when the identity provider rejects the refresh token', async () => {
    // Arrange
    await login();
    updateStoredAuthData((data) => {
      data.access_token_expires_at = Date.now() - 60000;
      data.authnResult.refresh_token = 'rejected-refresh-token';
    });

    const { injector, oidc } = startApp(createConfig());
    const eventTypes: EventTypes[] = [];

    injector
      .get(PublicEventsService)
      .registerForEvents()
      .subscribe(({ type }) => eventTypes.push(type));

    // Act
    const result = await firstValueFrom(
      oidc.checkAuth(window.location.href, configId)
    );

    // Assert
    expect(result.isAuthenticated).toBe(false);
    expect(result.errorMessage).toBeUndefined();
    expect(eventTypes).toContain(EventTypes.SilentRenewFailed);
    expect(eventTypes).toContain(EventTypes.CheckingAuthFinished);
    expect(eventTypes).not.toContain(EventTypes.CheckingAuthFinishedWithError);
  });
});
