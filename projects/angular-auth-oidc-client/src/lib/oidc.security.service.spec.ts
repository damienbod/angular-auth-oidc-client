import { TestBed, waitForAsync } from '@angular/core/testing';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { mockClass } from '../test/auto-mock';
import { AuthStateService } from './auth-state/auth-state.service';
import { CheckAuthService } from './auth-state/check-auth.service';
import { CallbackService } from './callback/callback.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { AuthWellKnownService } from './config/auth-well-known/auth-well-known.service';
import { ConfigurationService } from './config/config.service';
import { FlowsDataService } from './flows/flows-data.service';
import { CheckSessionService } from './iframe/check-session.service';
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        OidcSecurityService,
        {
          provide: CheckSessionService,
          useClass: mockClass(CheckSessionService),
        },
        {
          provide: CheckAuthService,
          useClass: mockClass(CheckAuthService),
        },
        {
          provide: UserService,
          useClass: mockClass(UserService),
        },
        {
          provide: TokenHelperService,
          useClass: mockClass(TokenHelperService),
        },
        {
          provide: ConfigurationService,
          useClass: mockClass(ConfigurationService),
        },
        {
          provide: AuthStateService,
          useClass: mockClass(AuthStateService),
        },
        { provide: FlowsDataService, useClass: mockClass(FlowsDataService) },
        { provide: CallbackService, useClass: mockClass(CallbackService) },
        { provide: LogoffRevocationService, useClass: mockClass(LogoffRevocationService) },
        { provide: LoginService, useClass: mockClass(LoginService) },
        { provide: RefreshSessionService, useClass: mockClass(RefreshSessionService) },
        { provide: UrlService, useClass: mockClass(UrlService) },
        { provide: AuthWellKnownService, useClass: mockClass(AuthWellKnownService) },
      ],
    });
  });

  beforeEach(() => {
    oidcSecurityService = TestBed.inject(OidcSecurityService);
    tokenHelperService = TestBed.inject(TokenHelperService);
    configurationService = TestBed.inject(ConfigurationService);
    authStateService = TestBed.inject(AuthStateService);
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
  });

  it('should create', () => {
    expect(oidcSecurityService).toBeTruthy();
  });

  describe('userData$', () => {
    it('calls userService.userData$', waitForAsync(() => {
      const spy = spyOnProperty(userService, 'userData$').and.returnValue(of({ some: 'data' }));

      oidcSecurityService.userData$.subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    }));
  });

  describe('isAuthenticated$', () => {
    it('calls authStateService.isAuthenticated$', waitForAsync(() => {
      const spy = spyOnProperty(authStateService, 'authenticated$').and.returnValue(of({ some: 'data' }));

      oidcSecurityService.isAuthenticated$.subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    }));
  });

  describe('checkSessionChanged$', () => {
    it('calls checkSessionService.checkSessionChanged$', waitForAsync(() => {
      const spy = spyOnProperty(checkSessionService, 'checkSessionChanged$').and.returnValue(of(true));

      oidcSecurityService.checkSessionChanged$.subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    }));
  });

  describe('stsCallback$', () => {
    it('calls callbackService.stsCallback$', waitForAsync(() => {
      const spy = spyOnProperty(callbackService, 'stsCallback$').and.returnValue(of({ some: 'data' }));

      oidcSecurityService.stsCallback$.subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    }));
  });

  describe('preloadAuthWellKnownDocument', () => {
    it('calls authWellKnownService.queryAndStoreAuthWellKnownEndPoints with config', waitForAsync(() => {
      const config = { configId: 'configid1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      const spy = spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of(null));

      oidcSecurityService.preloadAuthWellKnownDocument().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config);
      });
    }));
  });

  describe('getConfigurations', () => {
    it('is not of type observable', () => {
      expect(oidcSecurityService.getConfigurations).not.toEqual(jasmine.any(Observable));
    });

    it('calls configurationProvider.getAllConfigurations', () => {
      const spy = spyOn(configurationService, 'getAllConfigurations');

      oidcSecurityService.getConfigurations();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConfiguration', () => {
    it('is not of type observable', () => {
      expect(oidcSecurityService.getConfiguration).not.toEqual(jasmine.any(Observable));
    });

    it('calls configurationProvider.getOpenIDConfiguration with passed configId when configId is passed', () => {
      const spy = spyOn(configurationService, 'getOpenIDConfiguration');

      oidcSecurityService.getConfiguration('configId');

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });
  });

  describe('getUserData', () => {
    it('calls configurationProvider.getOpenIDConfiguration with config', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));

      const spy = spyOn(userService, 'getUserDataFromStore').and.returnValue({ some: 'thing' });

      oidcSecurityService.getUserData('configId').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config);
      });
    }));

    it('returns userdata', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));

      spyOn(userService, 'getUserDataFromStore').and.returnValue({ some: 'thing' });

      oidcSecurityService.getUserData('configId').subscribe((result) => {
        expect(result).toEqual({ some: 'thing' });
      });
    }));
  });

  describe('checkAuth', () => {
    it('calls checkAuthService.checkAuth() without url if none is passed', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));

      const spy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));

      oidcSecurityService.checkAuth().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, [config], undefined);
      });
    }));

    it('calls checkAuthService.checkAuth() with url if one is passed', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));

      const spy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));

      oidcSecurityService.checkAuth('some-url').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, [config], 'some-url');
      });
    }));
  });

  describe('checkAuthMultiple', () => {
    it('calls checkAuthService.checkAuth() without url if none is passed', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));

      const spy = spyOn(checkAuthService, 'checkAuthMultiple').and.returnValue(of(null));

      oidcSecurityService.checkAuthMultiple().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith([config], undefined);
      });
    }));

    it('calls checkAuthService.checkAuthMultiple() with url if one is passed', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));

      const spy = spyOn(checkAuthService, 'checkAuthMultiple').and.returnValue(of(null));

      oidcSecurityService.checkAuthMultiple('some-url').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith([config], 'some-url');
      });
    }));
  });

  describe('isAuthenticated()', () => {
    it('calls authStateService.isAuthenticated with passed configId when configId is passed', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));

      const spy = spyOn(authStateService, 'isAuthenticated').and.returnValue(true);

      oidcSecurityService.isAuthenticated().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config);
      });
    }));
  });

  describe('checkAuthIncludingServer', () => {
    it('calls checkAuthService.checkAuthIncludingServer()', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));

      const spy = spyOn(checkAuthService, 'checkAuthIncludingServer').and.returnValue(of(null));

      oidcSecurityService.checkAuthIncludingServer().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, [config]);
      });
    }));
  });

  describe('getAccessToken', () => {
    it('calls authStateService.getAccessToken()', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));

      const spy = spyOn(authStateService, 'getAccessToken').and.returnValue('');

      oidcSecurityService.getAccessToken().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config);
      });
    }));
  });

  describe('getIdToken', () => {
    it('calls authStateService.getIdToken()', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));

      const spy = spyOn(authStateService, 'getIdToken').and.returnValue('');

      oidcSecurityService.getIdToken().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config);
      });
    }));
  });

  describe('getRefreshToken', () => {
    it('calls authStateService.getRefreshToken()', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      const spy = spyOn(authStateService, 'getRefreshToken').and.returnValue('');

      oidcSecurityService.getRefreshToken().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config);
      });
    }));
  });

  describe('getAuthenticationResult', () => {
    it('calls authStateService.getAuthenticationResult()', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));

      const spy = spyOn(authStateService, 'getAuthenticationResult').and.returnValue(null);

      oidcSecurityService.getAuthenticationResult().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config);
      });
    }));
  });

  describe('getPayloadFromIdToken', () => {
    it('calls `authStateService.getIdToken` method, encode = false', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      spyOn(authStateService, 'getIdToken').and.returnValue('some-token');
      const spy = spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(null);

      oidcSecurityService.getPayloadFromIdToken().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('some-token', false, config);
      });
    }));

    it('calls `authStateService.getIdToken` method, encode = true', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      spyOn(authStateService, 'getIdToken').and.returnValue('some-token');
      const spy = spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(null);

      oidcSecurityService.getPayloadFromIdToken(true).subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('some-token', true, config);
      });
    }));
  });

  describe('getPayloadFromAccessToken', () => {
    it('calls `authStateService.getAccessToken` method, encode = false', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      spyOn(authStateService, 'getAccessToken').and.returnValue('some-access-token');
      const spy = spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(null);

      oidcSecurityService.getPayloadFromAccessToken().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('some-access-token', false, config);
      });
    }));

    it('calls `authStateService.getIdToken` method, encode = true', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      spyOn(authStateService, 'getAccessToken').and.returnValue('some-access-token');
      const spy = spyOn(tokenHelperService, 'getPayloadFromToken').and.returnValue(null);

      oidcSecurityService.getPayloadFromAccessToken(true).subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('some-access-token', true, config);
      });
    }));
  });

  describe('setState', () => {
    it('calls flowsDataService.setAuthStateControl with param', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      const spy = spyOn(flowsDataService, 'setAuthStateControl');

      oidcSecurityService.setState('anyString').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('anyString', config);
      });
    }));
  });

  describe('getState', () => {
    it('calls flowsDataService.getAuthStateControl', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      const spy = spyOn(flowsDataService, 'getAuthStateControl');

      oidcSecurityService.getState().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config);
      });
    }));
  });

  describe('authorize', () => {
    it('calls login service login', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      const spy = spyOn(loginService, 'login');

      oidcSecurityService.authorize();

      expect(spy).toHaveBeenCalledOnceWith(config, undefined);
    }));

    it('calls login service login with authoptions', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      const spy = spyOn(loginService, 'login');

      oidcSecurityService.authorize('configId', { customParams: { some: 'param' } });

      expect(spy).toHaveBeenCalledOnceWith(config, { customParams: { some: 'param' } });
    }));
  });

  describe('authorizeWithPopUp', () => {
    it('calls login service loginWithPopUp', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      const spy = spyOn(loginService, 'loginWithPopUp').and.callFake(() => of(null));

      oidcSecurityService.authorizeWithPopUp().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, [config], undefined, undefined);
      });
    }));
  });

  describe('forceRefreshSession', () => {
    it('calls refreshSessionService userForceRefreshSession with configId from config when none is passed', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));

      const spy = spyOn(refreshSessionService, 'userForceRefreshSession').and.returnValue(of(null));

      oidcSecurityService.forceRefreshSession().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, [config], undefined);
      });
    }));
  });

  describe('logoffAndRevokeTokens', () => {
    it('calls logoffRevocationService.logoffAndRevokeTokens', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      const spy = spyOn(logoffRevocationService, 'logoffAndRevokeTokens').and.returnValue(of(null));

      oidcSecurityService.logoffAndRevokeTokens().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, [config], undefined);
      });
    }));
  });

  describe('logoff', () => {
    it('calls logoffRevocationService.logoff ', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      const spy = spyOn(logoffRevocationService, 'logoff');

      oidcSecurityService.logoff();
      expect(spy).toHaveBeenCalledOnceWith(config, [config], undefined);
    }));
  });

  describe('logoffLocal', () => {
    it('calls logoffRevocationService.logoffLocal', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      const spy = spyOn(logoffRevocationService, 'logoffLocal');

      oidcSecurityService.logoffLocal();
      expect(spy).toHaveBeenCalledOnceWith(config, [config]);
    }));
  });

  describe('logoffLocalMultiple', () => {
    it('calls logoffRevocationService.logoffLocalMultiple', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      const spy = spyOn(logoffRevocationService, 'logoffLocalMultiple');

      oidcSecurityService.logoffLocalMultiple();
      expect(spy).toHaveBeenCalledOnceWith([config]);
    }));
  });

  describe('revokeAccessToken', () => {
    it('calls logoffRevocationService.revokeAccessToken', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      const spy = spyOn(logoffRevocationService, 'revokeAccessToken').and.returnValue(of(null));

      oidcSecurityService.revokeAccessToken().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, undefined);
      });
    }));

    it('calls logoffRevocationService.revokeAccessToken with accesstoken', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      const spy = spyOn(logoffRevocationService, 'revokeAccessToken').and.returnValue(of(null));

      oidcSecurityService.revokeAccessToken('access_token').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, 'access_token');
      });
    }));
  });

  describe('revokeRefreshToken', () => {
    it('calls logoffRevocationService.revokeRefreshToken', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      const spy = spyOn(logoffRevocationService, 'revokeRefreshToken').and.returnValue(of(null));

      oidcSecurityService.revokeRefreshToken().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, undefined);
      });
    }));

    it('calls logoffRevocationService.revokeRefreshToken with refresh token', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));
      const spy = spyOn(logoffRevocationService, 'revokeRefreshToken').and.returnValue(of(null));

      oidcSecurityService.revokeRefreshToken('refresh_token').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, 'refresh_token');
      });
    }));
  });

  describe('getEndSessionUrl', () => {
    it('calls logoffRevocationService.getEndSessionUrl ', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));

      const spy = spyOn(logoffRevocationService, 'getEndSessionUrl').and.returnValue(null);

      oidcSecurityService.getEndSessionUrl().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, undefined);
      });
    }));

    it('calls logoffRevocationService.getEndSessionUrl with customparams', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));

      const spy = spyOn(logoffRevocationService, 'getEndSessionUrl').and.returnValue(null);

      oidcSecurityService.getEndSessionUrl({ custom: 'params' }).subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, { custom: 'params' });
      });
    }));
  });

  describe('getAuthorizeUrl', () => {
    it('calls urlService.getAuthorizeUrl ', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));

      const spy = spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of(null));

      oidcSecurityService.getAuthorizeUrl().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, undefined);
      });
    }));

    it('calls urlService.getAuthorizeUrl with customparams', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of(config));

      const spy = spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of(null));

      oidcSecurityService.getAuthorizeUrl({ custom: 'params' }).subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(config, { customParams: { custom: 'params' } });
      });
    }));
  });

  describe('isLoading$', () => {
    it('should emit true', waitForAsync(() => {
      oidcSecurityService.isLoading$.subscribe((x) => expect(x).toBeTrue());
    }));

    it('should emit false after checkauth is called', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));

      oidcSecurityService
        .checkAuth()
        .pipe(switchMap(() => oidcSecurityService.isLoading$))
        .subscribe((x) => expect(x).toBeFalse());
    }));

    it('should emit false on error in checkauth', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      spyOn(checkAuthService, 'checkAuth').and.returnValue(throwError(() => new Error('Error')));

      oidcSecurityService
        .checkAuth()
        .pipe(catchError(() => oidcSecurityService.isLoading$))
        .subscribe((x) => expect(x).toBeFalse());
    }));

    it('should emit false after checkauthMultiple is called', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      spyOn(checkAuthService, 'checkAuthMultiple').and.returnValue(of(null));

      oidcSecurityService
        .checkAuthMultiple()
        .pipe(switchMap(() => oidcSecurityService.isLoading$))
        .subscribe((x) => expect(x).toBeFalse());
    }));

    it('should emit false on error in checkauthMultiple', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      spyOn(checkAuthService, 'checkAuthMultiple').and.returnValue(throwError(() => new Error('Error')));

      oidcSecurityService
        .checkAuthMultiple()
        .pipe(catchError(() => oidcSecurityService.isLoading$))
        .subscribe((x) => expect(x).toBeFalse());
    }));

    it('should emit false after checkAuthIncludingServer is called', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      spyOn(checkAuthService, 'checkAuthIncludingServer').and.returnValue(of(null));

      oidcSecurityService
        .checkAuthIncludingServer()
        .pipe(switchMap(() => oidcSecurityService.isLoading$))
        .subscribe((x) => expect(x).toBeFalse());
    }));

    it('should emit false on error in checkAuthIncludingServer', waitForAsync(() => {
      const config = { configId: 'configId1' };

      spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));
      spyOn(checkAuthService, 'checkAuthIncludingServer').and.returnValue(throwError(() => new Error('Error')));

      oidcSecurityService
        .checkAuthIncludingServer()
        .pipe(catchError(() => oidcSecurityService.isLoading$))
        .subscribe((x) => expect(x).toBeFalse());
    }));
  });
});
