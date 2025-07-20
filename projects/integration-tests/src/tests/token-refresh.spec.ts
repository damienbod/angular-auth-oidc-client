import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {firstValueFrom, of} from 'rxjs';
import {take, filter, toArray} from 'rxjs/operators';
import {AuthModule, OidcSecurityService, StsConfigLoader, EventTypes, PublicEventsService} from 'angular-auth-oidc-client';
// Note: Test IDP server should be running on port 8081 before running this test

/**
 * E2E Test: Force Refresh Session with Automatic Token Renewal
 *
 * Test Flow:
 * 1. Initial auth check (should be false)
 * 2. Force refresh session to authenticate via silent renew
 * 3. Wait for automatic token refresh before expiration
 * 4. Verify tokens are refreshed correctly
 *
 * This test validates:
 * - Force refresh session works correctly
 * - Automatic token renewal works correctly before expiration
 * - Token refresh maintains authentication state
 * - All configured IDPs are refreshed
 *
 * Note: This test uses 5-minute token expiration (300 seconds) with
 * renewal 290 seconds before expiration (10 seconds after issue).
 * This means tokens are only kept for 10 seconds before being refreshed.
 */
const idp_host = "http://localhost:8081"
const renewSecBeforeExp = 290
const configIdIdp1 = "idp1"
const configIdIdp2 = "idp2"
const configIdIdp3 = "idp3"

@Injectable()
class TestStsConfigLoaderWithAutoRefresh extends StsConfigLoader {
  private readonly silentRenewUrl = `${window.location.origin}/assets/silent-renew.html`;
  constructor() {
    super();
    console.log('Constructed silent renew URL:', this.silentRenewUrl);
  }
  override loadConfigs() {

    const baseConfig = {
      redirectUrl: `${idp_host}/callback`,
      silentRenewUrl: this.silentRenewUrl,
      postLogoutRedirectUri: `${idp_host}/`,
      responseType: 'code',
      // Enable automatic silent renewal
      silentRenew: true,
      // Renew 290 seconds before token expires (for 300 second/5 minute tokens)
      // This means tokens are only kept for 10 seconds before refresh
      renewTimeBeforeTokenExpiresInSeconds: renewSecBeforeExp,
      renewUserInfoAfterTokenRenew: true,
      // Enable periodic token checks every 2 seconds for faster detection
      tokenRefreshInSeconds: 2,
      // Enable automatic refresh when ID token is about to expire
      triggerRefreshWhenIdTokenExpired: true,
      useRefreshToken: false
    };

    return of([
      {
        ...baseConfig,
        configId: configIdIdp1,
        authority: `${idp_host}/idp1`,
        clientId: 'client-idp1',
        scope: 'openid profile email'
      },
      {
        ...baseConfig,
        configId: configIdIdp2,
        authority: `${idp_host}/idp2`,
        clientId: 'client-idp2',
        scope: 'openid profile'
      },
      {
        ...baseConfig,
        configId: configIdIdp3,
        authority: `${idp_host}/idp3`,
        clientId: 'client-idp3',
        scope: 'openid email'
      }
    ]);
  }
}


describe('Force Refresh Session with Automatic Token Renewal', () => {
  let oidcSecurityService: OidcSecurityService;
  let publicEventsService: PublicEventsService;

  beforeAll(async () => {
    // Check that IDP server is running
    console.log(`Checking IDP server health at ${idp_host}/health...`);
    
    try {
      const healthResponse = await fetch(`${idp_host}/health`);
      
      expect(healthResponse.ok).withContext(
        `IDP server health check failed. Status: ${healthResponse.status}. ` +
        `Make sure the test IDP server is running at ${idp_host}. ` +
        `Start it with: cd projects/integration-tests/test-idp-server && ./start.sh`
      ).toBe(true);
      
      const healthData = await healthResponse.json();
      expect(healthData.status).withContext(
        `IDP server returned unhealthy status: ${JSON.stringify(healthData)}`
      ).toBe('ok');
      
      console.log('✅ IDP server is healthy:', healthData);
    } catch (error) {
      fail(
        `Failed to connect to IDP server at ${idp_host}. ` +
        `Error: ${error instanceof Error ? error.message : error}. ` +
        `\n\nMake sure the test IDP server is running:\n` +
        `  cd projects/integration-tests/test-idp-server && ./start.sh\n\n` +
        `The server should be accessible at ${idp_host}`
      );
    }
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [
        AuthModule.forRoot({
          loader: {
            provide: StsConfigLoader,
            useClass: TestStsConfigLoaderWithAutoRefresh
          }
        })
      ],
      providers: [
        provideHttpClient()
      ]
    });

    oidcSecurityService = TestBed.inject(OidcSecurityService);
    publicEventsService = TestBed.inject(PublicEventsService);
  });

  afterEach(() => {
    oidcSecurityService.logoffLocalMultiple();
  });

  it('should force refresh session and automatically renew tokens before expiration', async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

    console.log('=== TEST FLOW: Automatic Token Refresh ===');

    console.log('STEP 1: Initial authentication check');

    const beforeInitRefreshAuthState = await firstValueFrom(oidcSecurityService.checkAuthMultiple());

    console.log('Initial auth check results:', beforeInitRefreshAuthState.map(r => ({
      configId: r.configId,
      isAuthenticated: r.isAuthenticated
    })));

    expect(beforeInitRefreshAuthState.every(r => !r.isAuthenticated)).toBe(true);

    console.log('Force refresh session for all configs');
    const forceRefreshPromises = beforeInitRefreshAuthState.map(config => {
      console.log(`Preparing force refresh for config: ${config.configId}`);
      return firstValueFrom(oidcSecurityService.forceRefreshSession(undefined, config.configId));
    });

    try {
      // Wait parallel refresh operations
      await Promise.all(forceRefreshPromises);
      console.log('All force refresh sessions completed successfully');
    } catch (error: any) {
      console.error('Failed to force refresh one or more configs:', error);

      // Check if iframe was created
      const iframes = document.querySelectorAll('iframe');
      console.error('Number of iframes:', iframes.length);
      iframes.forEach((iframe, i) => {
        console.error(`Iframe ${i} src:`, iframe.src);
      });

      throw error;
    }

    const afterInitRefreshAuthState = await firstValueFrom(oidcSecurityService.checkAuthMultiple());

    expect(afterInitRefreshAuthState.every(r => r.isAuthenticated)).toBe(true);

    const initRefreshIdp1Claims = await getTokenClaims(oidcSecurityService, configIdIdp1);
    const initRefreshIdp2Claims = await getTokenClaims(oidcSecurityService, configIdIdp2);
    const initRefreshIdp3Claims = await getTokenClaims(oidcSecurityService, configIdIdp3);

    console.log('Initial token IATs:');
    console.log(`IDP1: ${new Date(initRefreshIdp1Claims.iat * 1000).toISOString()} (${initRefreshIdp1Claims.iat})`);
    console.log(`IDP2: ${new Date(initRefreshIdp2Claims.iat * 1000).toISOString()} (${initRefreshIdp2Claims.iat})`);
    console.log(`IDP3: ${new Date(initRefreshIdp3Claims.iat * 1000).toISOString()} (${initRefreshIdp3Claims.iat})`);

    const uniqueInitialIats = new Set([
      initRefreshIdp1Claims.iat,
      initRefreshIdp2Claims.iat,
      initRefreshIdp3Claims.iat
    ]);
    console.log(`Unique initial IAT timestamps: ${uniqueInitialIats.size} (should be 3 for independent refreshes)`);
    expect(uniqueInitialIats.size).toBe(3);

    const now = Date.now();
    const timeUntilRefreshIdp1 = ((initRefreshIdp1Claims.exp * 1000) - (renewSecBeforeExp * 1000)) - now;
    const timeUntilRefreshIdp2 = ((initRefreshIdp2Claims.exp * 1000) - (renewSecBeforeExp * 1000)) - now;
    const timeUntilRefreshIdp3 = ((initRefreshIdp3Claims.exp * 1000) - (renewSecBeforeExp * 1000)) - now;

    console.log('Time until next refresh for each IDP:');
    console.log(`IDP1: ${timeUntilRefreshIdp1 / 1000} seconds`);
    console.log(`IDP2: ${timeUntilRefreshIdp2 / 1000} seconds`);
    console.log(`IDP3: ${timeUntilRefreshIdp3 / 1000} seconds`);

    expect(timeUntilRefreshIdp1).toBeGreaterThan(1000);
    expect(timeUntilRefreshIdp2).toBeGreaterThan(1000);
    expect(timeUntilRefreshIdp3).toBeGreaterThan(1000);

    console.log('STEP 2: Waiting for automatic token refresh...');

    // Wait for all 3 token renewals
    await waitForTokenRenewals(publicEventsService, 3);

    const autoRefreshIdp1Claims = await getTokenClaims(oidcSecurityService, configIdIdp1);
    const autoRefreshIdp2Claims = await getTokenClaims(oidcSecurityService, configIdIdp2);
    const autoRefreshIdp3Claims = await getTokenClaims(oidcSecurityService, configIdIdp3);

    const uniqueIats = new Set([
      autoRefreshIdp1Claims.iat,
      autoRefreshIdp2Claims.iat,
      autoRefreshIdp3Claims.iat
    ]);
    console.log(`Unique IAT timestamps: ${uniqueIats.size} (should be 3 for independent renewals)`);

    expect(uniqueIats.size).toBe(3);
    expect(autoRefreshIdp1Claims.iat).toBeGreaterThan(initRefreshIdp1Claims.iat);
    expect(autoRefreshIdp2Claims.iat).toBeGreaterThan(initRefreshIdp2Claims.iat);
    expect(autoRefreshIdp3Claims.iat).toBeGreaterThan(initRefreshIdp3Claims.iat);

    console.log('\n✅ TEST COMPLETE: Automatic token refresh works correctly');
  }, 60000);
});


function parseJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

function waitForTokenRenewals(publicEventsService: PublicEventsService, count: number) {
  return firstValueFrom(
    publicEventsService.registerForEvents()
      .pipe(
        filter(event =>
          event.type === EventTypes.NewAuthenticationResult &&
          event.value?.isRenewProcess === true
        ),
        take(count),
        toArray()
      )
  );
}

async function getTokenClaims(oidcSecurityService: OidcSecurityService, configId: string): Promise<any> {
  const authResult = await firstValueFrom(oidcSecurityService.getAuthenticationResult(configId));
  return parseJwt(authResult!.id_token!);
}
