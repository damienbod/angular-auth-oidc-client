import { provideHttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  AuthModule,
  OidcSecurityService,
  StsConfigLoader,
} from 'angular-auth-oidc-client';
import { firstValueFrom, of } from 'rxjs';

const idpHost = 'http://localhost:8081';
const configId = 'idp1';

@Injectable()
class TestStsConfigLoaderWithRefreshTokens extends StsConfigLoader {
  override loadConfigs() {
    return of([
      {
        configId,
        authority: `${idpHost}/idp1`,
        redirectUrl: `${window.location.origin}/callback`,
        postLogoutRedirectUri: `${window.location.origin}/`,
        clientId: 'client-idp1',
        responseType: 'code',
        scope: 'openid profile email offline_access',
        silentRenew: false,
        useRefreshToken: true,
        renewUserInfoAfterTokenRenew: true,
      },
    ]);
  }
}

describe('Manual refresh-token concurrency', () => {
  let oidcSecurityService: OidcSecurityService;

  beforeAll(async () => {
    const healthResponse = await fetch(`${idpHost}/health`);
    expect(healthResponse.ok).toBe(true);
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [
        AuthModule.forRoot({
          loader: {
            provide: StsConfigLoader,
            useClass: TestStsConfigLoaderWithRefreshTokens,
          },
        }),
      ],
      providers: [provideHttpClient()],
    });

    oidcSecurityService = TestBed.inject(OidcSecurityService);
  });

  afterEach(() => {
    oidcSecurityService.logoffLocalMultiple();
  });

  it('keeps concurrent forceRefreshSession calls aligned with the freshly stored tokens', async () => {
    const authorizeUrl = await new Promise<string>((resolve) => {
      oidcSecurityService.authorize(configId, {
        customParams: {
          test_response_mode: 'json',
        },
        urlHandler: resolve,
      });
    });

    const authorizeResponse = await fetch(authorizeUrl, {
      credentials: 'include',
    });
    const authorizeResult = await authorizeResponse.json();

    expect(authorizeResult.redirect_to).toContain('/callback?code=');

    const loginResponse = await firstValueFrom(
      oidcSecurityService.checkAuth(authorizeResult.redirect_to, configId)
    );

    expect(loginResponse.isAuthenticated).toBe(true);

    const initialAccessToken = await firstValueFrom(
      oidcSecurityService.getAccessToken(configId)
    );
    const initialRefreshToken = await firstValueFrom(
      oidcSecurityService.getRefreshToken(configId)
    );

    const [firstRefreshResult, secondRefreshResult] = await Promise.all([
      firstValueFrom(
        oidcSecurityService.forceRefreshSession(undefined, configId)
      ),
      firstValueFrom(
        oidcSecurityService.forceRefreshSession(undefined, configId)
      ),
    ]);

    const currentAccessToken = await firstValueFrom(
      oidcSecurityService.getAccessToken(configId)
    );
    const currentIdToken = await firstValueFrom(
      oidcSecurityService.getIdToken(configId)
    );
    const currentRefreshToken = await firstValueFrom(
      oidcSecurityService.getRefreshToken(configId)
    );

    expect(firstRefreshResult.isAuthenticated).toBe(true);
    expect(secondRefreshResult.isAuthenticated).toBe(true);
    expect(firstRefreshResult.accessToken).not.toBe(initialAccessToken);
    expect(secondRefreshResult.accessToken).toBe(
      firstRefreshResult.accessToken
    );
    expect(secondRefreshResult.idToken).toBe(firstRefreshResult.idToken);
    expect(currentAccessToken).toBe(firstRefreshResult.accessToken);
    expect(currentIdToken).toBe(firstRefreshResult.idToken);
    expect(currentRefreshToken).not.toBe(initialRefreshToken);
  });
});
