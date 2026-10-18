import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockProvider } from '../test/auto-mock';
import { AuthStateService } from './auth-state/auth-state.service';
import { CheckAuthService } from './auth-state/check-auth.service';
import { CallbackService } from './callback/callback.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { AuthWellKnownService } from './config/auth-well-known/auth-well-known.service';
import { ConfigurationService } from './config/config.service';
import { FlowsDataService } from './flows/flows-data.service';
import { CheckSessionService } from './iframe/check-session.service';
import { LoginResponse } from './login/login-response';
import { LoginService } from './login/login.service';
import { LogoffRevocationService } from './logoff-revoke/logoff-revocation.service';
import { OidcSecurityService } from './oidc.security.service';
import { UserService } from './user-data/user.service';
import { TokenHelperService } from './utils/tokenHelper/token-helper.service';
import { UrlService } from './utils/url/url.service';

describe('OidcSecurityService', () => {
  let oidcSecurityService: OidcSecurityService;
  let configurationService: ConfigurationService;
  let authStateService: AuthStateService;
  let authWellKnownService: AuthWellKnownService;
  let tokenHelperService: TokenHelperService;
  let flowsDataService: FlowsDataService;
  let logoffRevocationService: LogoffRevocationService;
  let loginService: LoginService;
  let refreshSessionService: RefreshSessionService;
  let checkAuthService: CheckAuthService;
  let checkSessionService: CheckSessionService;
  let userService: UserService;
  let urlService: UrlService;
  let callbackService: CallbackService;
  let authenticatedSpy: Mock;
  let userDataSpy: Mock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        OidcSecurityService,
        mockProvider(CheckSessionService),
        mockProvider(CheckAuthService),
        mockProvider(UserService),
        mockProvider(TokenHelperService),
        mockProvider(ConfigurationService),
        mockProvider(AuthStateService),
        mockProvider(FlowsDataService),
        mockProvider(CallbackService),
        mockProvider(LogoffRevocationService),
        mockProvider(LoginService),
        mockProvider(RefreshSessionService),
        mockProvider(UrlService),
        mockProvider(AuthWellKnownService),
      ],
    });
  });

  beforeEach(() => {
    authStateService = TestBed.inject(AuthStateService);
    tokenHelperService = TestBed.inject(TokenHelperService);
    configurationService = TestBed.inject(ConfigurationService);
    flowsDataService = TestBed.inject(FlowsDataService);
    logoffRevocationService = TestBed.inject(LogoffRevocationService);
    loginService = TestBed.inject(LoginService);
    refreshSessionService = TestBed.inject(RefreshSessionService);
    checkAuthService = TestBed.inject(CheckAuthService);
    userService = TestBed.inject(UserService);
    urlService = TestBed.inject(UrlService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    checkSessionService = TestBed.inject(CheckSessionService);
    callbackService = TestBed.inject(CallbackService);

    // this is required because these methods will be invoked by the signal properties when the service is created
    authenticatedSpy = vi
      .spyOn(authStateService, 'authenticated$', 'get')
      .mockReturnValue(
        of({ isAuthenticated: false, allConfigsAuthenticated: [] })
      );
    userDataSpy = vi
      .spyOn(userService, 'userData$', 'get')
      .mockReturnValue(of({ userData: null, allUserData: [] }));
    oidcSecurityService = TestBed.inject(OidcSecurityService);
  });

  it('should create', () => {
    expect(oidcSecurityService).toBeTruthy();
  });

  describe('userData$', () => {
    it('should call userService.userData$', async () => {
      await firstValueFrom(oidcSecurityService.userData$);

      // 1x from this subscribe
      // 1x by the signal property
      expect(userDataSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('userData', () => {
    it('should call userService.userData$', () => {
      const _userdata = oidcSecurityService.userData();

      expect(userDataSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('isAuthenticated$', () => {
    it('should call authStateService.isAuthenticated$', async () => {
      await firstValueFrom(oidcSecurityService.isAuthenticated$);

      // 1x from this subscribe
      // 1x by the signal property
      expect(authenticatedSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('authenticated', () => {
    it('should call authStateService.isAuthenticated$', () => {
      const _authenticated = oidcSecurityService.authenticated();

      expect(authenticatedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkSessionChanged$', () => {
    it('should call checkSessionService.checkSessionChanged$', async () => {
      const spy = vi
        .spyOn(checkSessionService, 'checkSessionChanged$', 'get')
        .mockReturnValue(of(true));

      await firstValueFrom(oidcSecurityService.checkSessionChanged$);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('stsCallback$', () => {
    it('should call callbackService.stsCallback$', () => {
      const spy = vi
        .spyOn(callbackService, 'stsCallback$', 'get')
        .mockReturnValue(of());
      let completed = false;

      oidcSecurityService.stsCallback$.subscribe({
        complete: () => {
          completed = true;
        },
      });

      expect(completed).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('preloadAuthWellKnownDocument', () => {
    it('should call authWellKnownService.queryAndStoreAuthWellKnownEndPoints with config', async () => {
      const config = { configId: 'configid1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      const spy = vi
        .spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints')
        .mockReturnValue(of({}));

      await firstValueFrom(oidcSecurityService.preloadAuthWellKnownDocument());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config);
    });
  });

  describe('getConfigurations', () => {
    it('should not be of type observable', () => {
      vi.spyOn(configurationService, 'getAllConfigurations').mockReturnValue(
        []
      );

      expect(oidcSecurityService.getConfigurations()).not.toEqual(
        expect.any(Observable)
      );
    });

    it('should call configurationProvider.getAllConfigurations', () => {
      const spy = vi
        .spyOn(configurationService, 'getAllConfigurations')
        .mockReturnValue(undefined as any);

      oidcSecurityService.getConfigurations();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConfiguration', () => {
    it('should be of type observable', () => {
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(null)
      );

      expect(oidcSecurityService.getConfiguration()).toEqual(
        expect.any(Observable)
      );
    });

    it('should call configurationProvider.getOpenIDConfiguration with passed configId when configId is passed', () => {
      const spy = vi
        .spyOn(configurationService, 'getOpenIDConfiguration')
        .mockReturnValue(undefined as any);

      oidcSecurityService.getConfiguration('configId');

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('configId');
    });
  });

  describe('getUserData', () => {
    it('should call userService.getUserDataFromStore with config', async () => {
      const config = { configId: 'configId1' };
      const configSpy = vi
        .spyOn(configurationService, 'getOpenIDConfiguration')
        .mockReturnValue(of(config));
      const spy = vi
        .spyOn(userService, 'getUserDataFromStore')
        .mockReturnValue({
          some: 'thing',
        });

      await firstValueFrom(oidcSecurityService.getUserData('configId1'));

      expect(configSpy).toHaveBeenCalledWith('configId1');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config);
    });

    it('should return userdata', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue({
        some: 'thing',
      });

      const result = await firstValueFrom(
        oidcSecurityService.getUserData('configId')
      );

      expect(result).toEqual({ some: 'thing' });
    });
  });

  describe('checkAuth', () => {
    it('should call checkAuthService.checkAuth() without url if none is passed', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );

      const spy = vi
        .spyOn(checkAuthService, 'checkAuth')
        .mockReturnValue(of({} as LoginResponse));

      await firstValueFrom(oidcSecurityService.checkAuth());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, [config], undefined);
    });

    it('should call checkAuthService.checkAuth() with url if one is passed', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );

      const spy = vi
        .spyOn(checkAuthService, 'checkAuth')
        .mockReturnValue(of({} as LoginResponse));

      await firstValueFrom(oidcSecurityService.checkAuth('some-url'));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, [config], 'some-url');
    });
  });

  describe('checkAuthMultiple', () => {
    it('should call checkAuthService.checkAuthMultiple() without url if none is passed', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );

      const spy = vi
        .spyOn(checkAuthService, 'checkAuthMultiple')
        .mockReturnValue(of([{}] as LoginResponse[]));

      await firstValueFrom(oidcSecurityService.checkAuthMultiple());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith([config], undefined);
    });

    it('should call checkAuthService.checkAuthMultiple() with url if one is passed', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );

      const spy = vi
        .spyOn(checkAuthService, 'checkAuthMultiple')
        .mockReturnValue(of([{}] as LoginResponse[]));

      await firstValueFrom(oidcSecurityService.checkAuthMultiple('some-url'));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith([config], 'some-url');
    });
  });

  describe('isAuthenticated()', () => {
    it('should call authStateService.isAuthenticated with passed configId when configId is passed', async () => {
      const config = { configId: 'configId1' };
      const configSpy = vi
        .spyOn(configurationService, 'getOpenIDConfiguration')
        .mockReturnValue(of(config));
      const spy = vi
        .spyOn(authStateService, 'isAuthenticated')
        .mockReturnValue(true);

      await firstValueFrom(oidcSecurityService.isAuthenticated('configId1'));

      expect(configSpy).toHaveBeenCalledWith('configId1');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config);
    });
  });

  describe('checkAuthIncludingServer', () => {
    it('should call checkAuthService.checkAuthIncludingServer()', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );

      const spy = vi
        .spyOn(checkAuthService, 'checkAuthIncludingServer')
        .mockReturnValue(of({} as LoginResponse));

      await firstValueFrom(oidcSecurityService.checkAuthIncludingServer());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, [config]);
    });
  });

  describe('getAccessToken', () => {
    it('should call authStateService.getAccessToken()', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );

      const spy = vi
        .spyOn(authStateService, 'getAccessToken')
        .mockReturnValue('');

      await firstValueFrom(oidcSecurityService.getAccessToken());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config);
    });
  });

  describe('getIdToken', () => {
    it('should call authStateService.getIdToken()', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );

      const spy = vi.spyOn(authStateService, 'getIdToken').mockReturnValue('');

      await firstValueFrom(oidcSecurityService.getIdToken());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config);
    });
  });

  describe('getRefreshToken', () => {
    it('should call authStateService.getRefreshToken()', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      const spy = vi
        .spyOn(authStateService, 'getRefreshToken')
        .mockReturnValue('');

      await firstValueFrom(oidcSecurityService.getRefreshToken());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config);
    });
  });

  describe('getAuthenticationResult', () => {
    it('should call authStateService.getAuthenticationResult()', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );

      const spy = vi
        .spyOn(authStateService, 'getAuthenticationResult')
        .mockReturnValue(null);

      await firstValueFrom(oidcSecurityService.getAuthenticationResult());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config);
    });
  });

  describe('getPayloadFromIdToken', () => {
    it('should call `authStateService.getIdToken` method, encode = false', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('some-token');
      const spy = vi
        .spyOn(tokenHelperService, 'getPayloadFromToken')
        .mockReturnValue(null);

      await firstValueFrom(oidcSecurityService.getPayloadFromIdToken());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('some-token', false, config);
    });

    it('should call `authStateService.getIdToken` method, encode = true', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('some-token');
      const spy = vi
        .spyOn(tokenHelperService, 'getPayloadFromToken')
        .mockReturnValue(null);

      await firstValueFrom(oidcSecurityService.getPayloadFromIdToken(true));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('some-token', true, config);
    });
  });

  describe('getPayloadFromAccessToken', () => {
    it('should call `authStateService.getAccessToken` method, encode = false', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
        'some-access-token'
      );
      const spy = vi
        .spyOn(tokenHelperService, 'getPayloadFromToken')
        .mockReturnValue(null);

      await firstValueFrom(oidcSecurityService.getPayloadFromAccessToken());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('some-access-token', false, config);
    });

    it('should call `authStateService.getAccessToken` method, encode = true', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
        'some-access-token'
      );
      const spy = vi
        .spyOn(tokenHelperService, 'getPayloadFromToken')
        .mockReturnValue(null);

      await firstValueFrom(oidcSecurityService.getPayloadFromAccessToken(true));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('some-access-token', true, config);
    });
  });

  describe('setState', () => {
    it('should call flowsDataService.setAuthStateControl with param', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      const spy = vi
        .spyOn(flowsDataService, 'setAuthStateControl')
        .mockReturnValue(undefined as any);

      await firstValueFrom(oidcSecurityService.setState('anyString'));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('anyString', config);
    });
  });

  describe('getState', () => {
    it('should call flowsDataService.getAuthStateControl', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      const spy = vi
        .spyOn(flowsDataService, 'getAuthStateControl')
        .mockReturnValue(undefined as any);

      await firstValueFrom(oidcSecurityService.getState());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config);
    });
  });

  describe('authorize', () => {
    it('should call login service login', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      const spy = vi.spyOn(loginService, 'login').mockReturnValue(undefined);

      oidcSecurityService.authorize();

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith(config, undefined);
    });

    it('should call login service login with authoptions', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      const spy = vi.spyOn(loginService, 'login').mockReturnValue(undefined);

      oidcSecurityService.authorize('configId', {
        customParams: { some: 'param' },
      });

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith(config, {
        customParams: { some: 'param' },
      });
    });
  });

  describe('authorizeWithPopUp', () => {
    it('should call login service loginWithPopUp', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );
      const spy = vi
        .spyOn(loginService, 'loginWithPopUp')
        .mockImplementation(() => of({} as LoginResponse));

      await firstValueFrom(oidcSecurityService.authorizeWithPopUp());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, [config], undefined, undefined);
    });
  });

  describe('forceRefreshSession', () => {
    it('should call refreshSessionService userForceRefreshSession with configId from config when none is passed', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );

      const spy = vi
        .spyOn(refreshSessionService, 'userForceRefreshSession')
        .mockReturnValue(of({} as LoginResponse));

      await firstValueFrom(oidcSecurityService.forceRefreshSession());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, [config], undefined);
    });
  });

  describe('logoffAndRevokeTokens', () => {
    it('should call logoffRevocationService.logoffAndRevokeTokens', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );
      const spy = vi
        .spyOn(logoffRevocationService, 'logoffAndRevokeTokens')
        .mockReturnValue(of(null));

      await firstValueFrom(oidcSecurityService.logoffAndRevokeTokens());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, [config], undefined);
    });
  });

  describe('logoff', () => {
    it('should call logoffRevocationService.logoff', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );
      const spy = vi
        .spyOn(logoffRevocationService, 'logoff')
        .mockReturnValue(of(null));

      await firstValueFrom(oidcSecurityService.logoff());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, [config], undefined);
    });
  });

  describe('logoffLocal', () => {
    it('should call logoffRevocationService.logoffLocal', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );
      const spy = vi
        .spyOn(logoffRevocationService, 'logoffLocal')
        .mockReturnValue(undefined);

      oidcSecurityService.logoffLocal();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, [config]);
    });
  });

  describe('logoffLocalMultiple', () => {
    it('should call logoffRevocationService.logoffLocalMultiple', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfigurations').mockReturnValue(
        of({ allConfigs: [config], currentConfig: config })
      );
      const spy = vi
        .spyOn(logoffRevocationService, 'logoffLocalMultiple')
        .mockReturnValue(undefined);

      oidcSecurityService.logoffLocalMultiple();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith([config]);
    });
  });

  describe('revokeAccessToken', () => {
    it('should call logoffRevocationService.revokeAccessToken', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      const spy = vi
        .spyOn(logoffRevocationService, 'revokeAccessToken')
        .mockReturnValue(of(null));

      await firstValueFrom(oidcSecurityService.revokeAccessToken());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, undefined);
    });

    it('should call logoffRevocationService.revokeAccessToken with accesstoken', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      const spy = vi
        .spyOn(logoffRevocationService, 'revokeAccessToken')
        .mockReturnValue(of(null));

      await firstValueFrom(
        oidcSecurityService.revokeAccessToken('access_token')
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, 'access_token');
    });
  });

  describe('revokeRefreshToken', () => {
    it('should call logoffRevocationService.revokeRefreshToken', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      const spy = vi
        .spyOn(logoffRevocationService, 'revokeRefreshToken')
        .mockReturnValue(of(null));

      await firstValueFrom(oidcSecurityService.revokeRefreshToken());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, undefined);
    });

    it('should call logoffRevocationService.revokeRefreshToken with refresh token', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );
      const spy = vi
        .spyOn(logoffRevocationService, 'revokeRefreshToken')
        .mockReturnValue(of(null));

      await firstValueFrom(
        oidcSecurityService.revokeRefreshToken('refresh_token')
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, 'refresh_token');
    });
  });

  describe('getEndSessionUrl', () => {
    it('should call urlService.getEndSessionUrl', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );

      const spy = vi
        .spyOn(urlService, 'getEndSessionUrl')
        .mockReturnValue(null);

      await firstValueFrom(oidcSecurityService.getEndSessionUrl());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, undefined);
    });

    it('should call urlService.getEndSessionUrl with customparams', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );

      const spy = vi
        .spyOn(urlService, 'getEndSessionUrl')
        .mockReturnValue(null);

      await firstValueFrom(
        oidcSecurityService.getEndSessionUrl({ custom: 'params' })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, { custom: 'params' });
    });
  });

  describe('getAuthorizeUrl', () => {
    it('should call urlService.getAuthorizeUrl', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );

      const spy = vi
        .spyOn(urlService, 'getAuthorizeUrl')
        .mockReturnValue(of(null));

      await firstValueFrom(oidcSecurityService.getAuthorizeUrl());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, undefined);
    });

    it('should call urlService.getAuthorizeUrl with customparams', async () => {
      const config = { configId: 'configId1' };

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(config)
      );

      const spy = vi
        .spyOn(urlService, 'getAuthorizeUrl')
        .mockReturnValue(of(null));

      await firstValueFrom(
        oidcSecurityService.getAuthorizeUrl({ custom: 'params' })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(config, {
        customParams: { custom: 'params' },
      });
    });
  });
});
