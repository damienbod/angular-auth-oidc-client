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
  EventTypes,
  LogLevel,
  OidcSecurityService,
  OpenIdConfiguration,
  provideAuth,
  PublicEventsService,
} from 'angular-auth-oidc-client';
import { delay, firstValueFrom } from 'rxjs';

const idpHost = 'http://localhost:8081';
const configId = 'idp1';

describe('Periodic silent renew with refresh tokens', () => {
  let app: EnvironmentInjector;

  // The test IDP rotates the refresh token with every request, and rejects a
  // refresh token that has been used before.
  function startApp(
    interceptors: HttpInterceptorFn[],
    overrides: Partial<OpenIdConfiguration>
  ): OidcSecurityService {
    const config: OpenIdConfiguration = {
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

    app = createEnvironmentInjector(
      [
        { provide: INJECTOR_SCOPE, useValue: 'root' },
        provideHttpClient(withInterceptors(interceptors)),
        provideAuth({ config }),
      ],
      TestBed.inject(EnvironmentInjector)
    );

    return app.get(OidcSecurityService);
  }

  async function login(oidc: OidcSecurityService): Promise<void> {
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
    const { isAuthenticated } = await firstValueFrom(
      oidc.checkAuth(redirect_to, configId)
    );

    expect(isAuthenticated).toBe(true);
  }

  beforeAll(async () => {
    const healthResponse = await fetch(`${idpHost}/health`);

    expect(healthResponse.ok).toBe(true);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    // stops the periodic token check, which outlives the injector otherwise
    app.get(OidcSecurityService).logoffLocal(configId);
    app.destroy();
  });

  it('should keep the session when the token endpoint answers slower than the periodic check runs', async () => {
    // Arrange
    const isRefreshRequest = (body: unknown): boolean =>
      String(body).includes('grant_type=refresh_token');
    const slowRefreshResponses: HttpInterceptorFn = (req, next) =>
      isRefreshRequest(req.body) ? next(req).pipe(delay(2500)) : next(req);
    // tokens live 300s, so the 298s offset asks for a renew after ~2s
    const oidc = startApp([slowRefreshResponses], {
      tokenRefreshInSeconds: 1,
      renewTimeBeforeTokenExpiresInSeconds: 298,
    });
    const failures: unknown[] = [];

    app
      .get(PublicEventsService)
      .registerForEvents()
      .subscribe(({ type, value }) => {
        if (type === EventTypes.SilentRenewFailed) {
          failures.push(value);
        }
      });
    await login(oidc);
    const initialAccessToken = await firstValueFrom(
      oidc.getAccessToken(configId)
    );

    // Act
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Assert
    expect(failures).toEqual([]);
    expect(await firstValueFrom(oidc.getAccessToken(configId))).not.toBe(
      initialAccessToken
    );
    expect(await firstValueFrom(oidc.isAuthenticated(configId))).toBe(true);
  }, 30000);
});
