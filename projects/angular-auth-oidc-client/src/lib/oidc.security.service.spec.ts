import { TestBed, waitForAsync } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AuthStateService } from './authState/auth-state.service';
import { AuthStateServiceMock } from './authState/auth-state.service-mock';
import { CallbackService } from './callback/callback.service';
import { CallbackServiceMock } from './callback/callback.service-mock';
import { RefreshSessionService } from './callback/refresh-session.service';
import { RefreshSessionServiceMock } from './callback/refresh-session.service.mock';
import { CheckAuthService } from './check-auth.service';
import { CheckAuthServiceMock } from './check-auth.service-mock';
import { ConfigurationProvider } from './config/provider/config.provider';
import { ConfigurationProviderMock } from './config/provider/config.provider-mock';
import { FlowsDataService } from './flows/flows-data.service';
import { FlowsDataServiceMock } from './flows/flows-data.service-mock';
import { CheckSessionService } from './iframe/check-session.service';
import { CheckSessionServiceMock } from './iframe/check-session.service-mock';
import { LoginService } from './login/login.service';
import { LoginServiceMock } from './login/login.service-mock';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { LogoffRevocationServiceMock } from './logoffRevoke/logoff-revocation.service-mock';
import { OidcSecurityService } from './oidc.security.service';
import { UserServiceMock } from './userData/user-service-mock';
import { UserService } from './userData/user.service';
import { TokenHelperService } from './utils/tokenHelper/token-helper.service';
import { TokenHelperServiceMock } from './utils/tokenHelper/token-helper.service-mock';

describe('OidcSecurityService', () => {
  let oidcSecurityService: OidcSecurityService;
  let configurationProvider: ConfigurationProvider;
  let authStateService: AuthStateService;
  let checkSessionService: CheckSessionService;
  let tokenHelperService: TokenHelperService;
  let flowsDataService: FlowsDataService;
  let logoffRevocationService: LogoffRevocationService;
  let loginService: LoginService;
  let refreshSessionService: RefreshSessionService;
  let checkAuthService: CheckAuthService;
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        OidcSecurityService,
        {
          provide: CheckSessionService,
          useClass: CheckSessionServiceMock,
        },
        {
          provide: CheckAuthService,
          useClass: CheckAuthServiceMock,
        },
        {
          provide: UserService,
          useClass: UserServiceMock,
        },
        {
          provide: TokenHelperService,
          useClass: TokenHelperServiceMock,
        },
        {
          provide: ConfigurationProvider,
          useClass: ConfigurationProviderMock,
        },
        {
          provide: AuthStateService,
          useClass: AuthStateServiceMock,
        },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: CallbackService, useClass: CallbackServiceMock },
        { provide: LogoffRevocationService, useClass: LogoffRevocationServiceMock },
        { provide: LoginService, useClass: LoginServiceMock },
        { provide: RefreshSessionService, useClass: RefreshSessionServiceMock },
      ],
    });
  });

  beforeEach(() => {
    oidcSecurityService = TestBed.inject(OidcSecurityService);
    checkSessionService = TestBed.inject(CheckSessionService);
    tokenHelperService = TestBed.inject(TokenHelperService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    authStateService = TestBed.inject(AuthStateService);
    flowsDataService = TestBed.inject(FlowsDataService);
    logoffRevocationService = TestBed.inject(LogoffRevocationService);
    loginService = TestBed.inject(LoginService);
    refreshSessionService = TestBed.inject(RefreshSessionService);
    checkAuthService = TestBed.inject(CheckAuthService);
    userService = TestBed.inject(UserService);
  });

  it('should create', () => {
    expect(oidcSecurityService).toBeTruthy();
  });

  describe('checkAuth', () => {
    it(
      'calls checkAuthService.checkAuth() without url if none is passed',
      waitForAsync(() => {
        const spy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        oidcSecurityService.checkAuth().subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith(undefined, undefined);
        });
      })
    );

    it(
      'calls checkAuthService.checkAuth() without configId if one is passed',
      waitForAsync(() => {
        const spy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        oidcSecurityService.checkAuth(null, 'configId').subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith('configId', null);
        });
      })
    );

    it('calls checkAuthService.checkAuth() with url if is passed', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
      const spy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
      oidcSecurityService.checkAuth('any-thing-url-like', 'configId').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('configId', 'any-thing-url-like');
      });
    });
  });

  describe('checkAuthMultiple', () => {
    it(
      'calls checkAuthService.checkAuthMultiple() without url if none is passed',
      waitForAsync(() => {
        const spy = spyOn(checkAuthService, 'checkAuthMultiple').and.returnValue(of(null));
        oidcSecurityService.checkAuthMultiple().subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith(undefined, undefined);
        });
      })
    );

    it(
      'calls checkAuthService.checkAuthMultiple() without configId if one is passed',
      waitForAsync(() => {
        const spy = spyOn(checkAuthService, 'checkAuthMultiple').and.returnValue(of(null));
        oidcSecurityService.checkAuthMultiple(null, 'configId').subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith('configId', null);
        });
      })
    );

    it('calls checkAuthService.checkAuthMultiple() with url if is passed', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
      const spy = spyOn(checkAuthService, 'checkAuthMultiple').and.returnValue(of(null));
      oidcSecurityService.checkAuthMultiple('any-thing-url-like', 'configId').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('configId', 'any-thing-url-like');
      });
    });
  });

  describe('checkAuthIncludingServer', () => {
    it(
      'calls checkAuthService.checkAuthIncludingServer()',
      waitForAsync(() => {
        const spy = spyOn(checkAuthService, 'checkAuthIncludingServer').and.returnValue(of(null));
        oidcSecurityService.checkAuthIncludingServer().subscribe(() => {
          expect(spy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'calls checkAuthService.checkAuthIncludingServer() with passed configId',
      waitForAsync(() => {
        const spy = spyOn(checkAuthService, 'checkAuthIncludingServer').and.returnValue(of(null));
        oidcSecurityService.checkAuthIncludingServer('configId').subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith('configId');
        });
      })
    );

    it(
      'calls checkAuthService.checkAuthIncludingServer() with passed configId',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
        const spy = spyOn(checkAuthService, 'checkAuthIncludingServer').and.returnValue(of(null));
        oidcSecurityService.checkAuthIncludingServer().subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith('configId');
        });
      })
    );
  });

  describe('getConfigurations', () => {
    it('is not of type observable', () => {
      expect(oidcSecurityService.getConfigurations).not.toEqual(jasmine.any(Observable));
    });

    it('calls configurationProvider.getAllConfigurations', () => {
      const spy = spyOn(configurationProvider, 'getAllConfigurations');

      oidcSecurityService.getConfigurations();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConfiguration', () => {
    it('is not of type observable', () => {
      expect(oidcSecurityService.getConfiguration).not.toEqual(jasmine.any(Observable));
    });

    it('calls configurationProvider.getOpenIDConfiguration with passed configId when configId is passed', () => {
      const spy = spyOn(configurationProvider, 'getOpenIDConfiguration');

      oidcSecurityService.getConfiguration('configId');

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });

    it('calls configurationProvider.getOpenIDConfiguration when NO configId is passed', () => {
      const spy = spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });

      oidcSecurityService.getConfiguration();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual([]);
      expect(spy.calls.argsFor(1)).toEqual(['configId']);
    });
  });

  describe('userData$', () => {
    it('is of type observable', () => {
      expect(oidcSecurityService.userData$).toEqual(jasmine.any(Observable));
    });
  });

  describe('getUserData', () => {
    it('calls configurationProvider.getOpenIDConfiguration with passed configId when configId is passed', () => {
      const spy = spyOn(userService, 'getUserDataFromStore');

      oidcSecurityService.getUserData('configId');

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });

    it('calls userService.getUserDataFromStore with id from config when NO configId is passed', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
      const spy = spyOn(userService, 'getUserDataFromStore');

      oidcSecurityService.getUserData();

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });
  });

  describe('forceRefreshSession', () => {
    it(
      'calls refreshSessionService userForceRefreshSession with configId from config when none is passed',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });

        const spy = spyOn(refreshSessionService, 'userForceRefreshSession').and.returnValue(of(null));
        oidcSecurityService.forceRefreshSession().subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith('configId', undefined);
        });
      })
    );

    it(
      'calls refreshSessionService userForceRefreshSession with configId when configId is passed',
      waitForAsync(() => {
        const spy = spyOn(refreshSessionService, 'userForceRefreshSession').and.returnValue(of(null));
        oidcSecurityService.forceRefreshSession(undefined, 'configId').subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith('configId', undefined);
        });
      })
    );

    it(
      'calls refreshSessionService userForceRefreshSession with configId and customparams when configId is passed',
      waitForAsync(() => {
        const spy = spyOn(refreshSessionService, 'userForceRefreshSession').and.returnValue(of(null));
        oidcSecurityService.forceRefreshSession({ custom: 'params' }, 'configId').subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith('configId', { custom: 'params' });
        });
      })
    );
  });

  describe('authorize', () => {
    it('calls login service login', () => {
      const spy = spyOn(loginService, 'login');
      oidcSecurityService.authorize();
      expect(spy).toHaveBeenCalled();
    });

    it('calls login service login with params if given', () => {
      const spy = spyOn(loginService, 'login');
      oidcSecurityService.authorize('configId', { customParams: { any: 'thing' } });
      expect(spy).toHaveBeenCalledWith('configId', { customParams: { any: 'thing' } });
    });
  });

  describe('authorizeWithPopUp', () => {
    it(
      'calls login service loginWithPopUp',
      waitForAsync(() => {
        const spy = spyOn(loginService, 'loginWithPopUp').and.callFake(() => of(null));
        oidcSecurityService.authorizeWithPopUp().subscribe(() => {
          expect(spy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'calls login service loginWithPopUp with params if given',
      waitForAsync(() => {
        const spy = spyOn(loginService, 'loginWithPopUp').and.callFake(() => of(null));
        oidcSecurityService.authorizeWithPopUp({ customParams: { any: 'thing' } }, null, 'configId').subscribe(() => {
          expect(spy).toHaveBeenCalledWith('configId', { customParams: { any: 'thing' } }, null);
        });
      })
    );

    it(
      'calls login service loginWithPopUp with params and popupparams if given',
      waitForAsync(() => {
        const somePopupOptions = { width: 500, height: 500, left: 50, top: 50 };
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
        const spy = spyOn(loginService, 'loginWithPopUp').and.callFake(() => of(null));
        oidcSecurityService.authorizeWithPopUp({ customParams: { any: 'thing' } }, somePopupOptions).subscribe(() => {
          expect(spy).toHaveBeenCalledWith('configId', { customParams: { any: 'thing' } }, somePopupOptions);
        });
      })
    );
  });

  describe('isAuthenticated$', () => {
    it('is of type observable', () => {
      expect(oidcSecurityService.isAuthenticated$).toEqual(jasmine.any(Observable));
    });

    it(
      'returns authStateService.authenticated$',
      waitForAsync(() => {
        const spy = spyOnProperty(authStateService, 'authenticated$', 'get').and.returnValue(of(null));
        oidcSecurityService.isAuthenticated$.subscribe(() => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );
  });

  describe('isAuthenticated()', () => {
    it('calls authStateService.isAuthenticated with passed configId when configId is passed', () => {
      const spy = spyOn(authStateService, 'isAuthenticated');

      oidcSecurityService.isAuthenticated('configId');

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });

    it('calls authStateService.isAuthenticated with id from config when NO configId is passed', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
      const spy = spyOn(authStateService, 'isAuthenticated');

      oidcSecurityService.isAuthenticated();

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });
  });

  describe('checkSessionChanged', () => {
    it('is of type observable', () => {
      expect(oidcSecurityService.checkSessionChanged$).toEqual(jasmine.any(Observable));
    });

    it(
      'emits false initially',
      waitForAsync(() => {
        spyOnProperty(oidcSecurityService, 'checkSessionChanged$', 'get').and.callThrough();
        oidcSecurityService.checkSessionChanged$.subscribe((result) => {
          expect(result).toBe(false);
        });
      })
    );

    it(
      'emits false then true when emitted',
      waitForAsync(() => {
        const expectedResultsInOrder = [false, true];
        let counter = 0;
        oidcSecurityService.checkSessionChanged$.subscribe((result) => {
          expect(result).toBe(expectedResultsInOrder[counter]);
          counter++;
        });

        (checkSessionService as any).checkSessionChangedInternal$.next(true);
      })
    );
  });

  describe('stsCallback', () => {
    it('is of type observable', () => {
      expect(oidcSecurityService.stsCallback$).toEqual(jasmine.any(Observable));
    });
  });

  describe('getAccessToken', () => {
    it(
      'calls authStateService.getAccessToken()',
      waitForAsync(() => {
        const spy = spyOn(authStateService, 'getAccessToken');

        oidcSecurityService.getAccessToken();
        expect(spy).toHaveBeenCalled();
      })
    );

    it('calls authStateService.getAccessToken() with passed configId when configId is passed', () => {
      const spy = spyOn(authStateService, 'getAccessToken');

      oidcSecurityService.getAccessToken('configId');

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });

    it('calls authStateService.getAccessToken() with id from config when NO configId is passed', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
      const spy = spyOn(authStateService, 'getAccessToken');

      oidcSecurityService.getAccessToken();

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });
  });

  describe('getIdToken', () => {
    it(
      'calls authStateService.getIdToken()',
      waitForAsync(() => {
        const spy = spyOn(authStateService, 'getIdToken');

        oidcSecurityService.getIdToken();
        expect(spy).toHaveBeenCalled();
      })
    );

    it('calls authStateService.getIdToken() with passed configId when configId is passed', () => {
      const spy = spyOn(authStateService, 'getIdToken');

      oidcSecurityService.getIdToken('configId');

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });

    it('calls authStateService.getIdToken() with id from config when NO configId is passed', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
      const spy = spyOn(authStateService, 'getIdToken');

      oidcSecurityService.getIdToken();

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });
  });

  describe('getRefreshToken', () => {
    it(
      'calls authStateService.getRefreshToken()',
      waitForAsync(() => {
        const spy = spyOn(authStateService, 'getRefreshToken');

        oidcSecurityService.getRefreshToken();
        expect(spy).toHaveBeenCalled();
      })
    );

    it('calls authStateService.getRefreshToken() with passed configId when configId is passed', () => {
      const spy = spyOn(authStateService, 'getRefreshToken');

      oidcSecurityService.getRefreshToken('configId');

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });

    it('calls authStateService.getRefreshToken() with id from config when NO configId is passed', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
      const spy = spyOn(authStateService, 'getRefreshToken');

      oidcSecurityService.getRefreshToken();

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });
  });

  describe('getPayloadFromIdToken', () => {
    it(
      'calls `authStateService.getIdToken` method',
      waitForAsync(() => {
        const spy = spyOn(authStateService, 'getIdToken');

        oidcSecurityService.getPayloadFromIdToken();
        expect(spy).toHaveBeenCalled();
      })
    );

    it(
      'calls `authStateService.getIdToken` with configId when passed',
      waitForAsync(() => {
        const spy = spyOn(authStateService, 'getIdToken');

        oidcSecurityService.getPayloadFromIdToken(true, 'configId');
        expect(spy).toHaveBeenCalledOnceWith('configId');
      })
    );

    it(
      'without parameters calls with encode = false (default)',
      waitForAsync(() => {
        spyOn(authStateService, 'getIdToken').and.returnValue('aaa');
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
        const spy = spyOn(tokenHelperService, 'getPayloadFromToken');

        oidcSecurityService.getPayloadFromIdToken();
        expect(spy).toHaveBeenCalledWith('aaa', false, 'configId');
      })
    );

    it(
      'with parameters calls with encode = true',
      waitForAsync(() => {
        spyOn(authStateService, 'getIdToken').and.returnValue('aaa');
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
        const spy = spyOn(tokenHelperService, 'getPayloadFromToken');

        oidcSecurityService.getPayloadFromIdToken(true);
        expect(spy).toHaveBeenCalledWith('aaa', true, 'configId');
      })
    );
  });

  describe('setState', () => {
    it(
      'calls flowsDataService.setAuthStateControl with param',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
        const spy = spyOn(flowsDataService, 'setAuthStateControl');

        oidcSecurityService.setState('anyString');
        expect(spy).toHaveBeenCalledWith('anyString', 'configId');
      })
    );

    it(
      'calls flowsDataService.setAuthStateControl with param and passed configId when passed',
      waitForAsync(() => {
        const spy = spyOn(flowsDataService, 'setAuthStateControl');

        oidcSecurityService.setState('anyString', 'someConfigId');
        expect(spy).toHaveBeenCalledWith('anyString', 'someConfigId');
      })
    );
  });

  describe('getState', () => {
    it(
      'calls flowsDataService.getAuthStateControl',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });

        const spy = spyOn(flowsDataService, 'getAuthStateControl');

        oidcSecurityService.getState();
        expect(spy).toHaveBeenCalledOnceWith('configId');
      })
    );

    it(
      'calls flowsDataService.setAuthStateControl with param and passed configId when passed',
      waitForAsync(() => {
        const spy = spyOn(flowsDataService, 'getAuthStateControl');

        oidcSecurityService.getState('someConfigId');
        expect(spy).toHaveBeenCalledWith('someConfigId');
      })
    );
  });

  describe('logoffAndRevokeTokens', () => {
    it(
      'calls logoffRevocationService.logoffAndRevokeTokens if no urlHandler is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoffAndRevokeTokens');

        oidcSecurityService.logoffAndRevokeTokens();
        expect(spy).toHaveBeenCalledWith(undefined, undefined);
      })
    );

    it(
      'calls logoffRevocationService.logoffAndRevokeTokens with urlHandler if it is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoffAndRevokeTokens');

        const urlHandler = () => {};

        oidcSecurityService.logoffAndRevokeTokens('configId', urlHandler);
        expect(spy).toHaveBeenCalledWith('configId', urlHandler);
      })
    );
  });

  describe('logoff', () => {
    it(
      'calls logoffRevocationService.logoff if no urlHandler is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoff');

        oidcSecurityService.logoff();
        expect(spy).toHaveBeenCalledWith(undefined, undefined, undefined);
      })
    );

    it(
      'calls logoffRevocationService.logoff with urlHandler if it is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoff');

        const urlHandler = () => {};

        oidcSecurityService.logoff('configId', { urlHandler });
        expect(spy).toHaveBeenCalledWith('configId', urlHandler, undefined);
      })
    );

    it(
      'calls logoffRevocationService.logoff with urlHandler if it is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoff');

        const urlHandler = () => {};
        const customParams = { my: 'custom', params: 1 };

        oidcSecurityService.logoff('configId', { urlHandler, customParams });
        expect(spy).toHaveBeenCalledWith('configId', urlHandler, customParams);
      })
    );
  });

  describe('logoffLocal', () => {
    it(
      'calls logoffRevocationService.logoffLocal',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoffLocal');

        oidcSecurityService.logoffLocal();
        expect(spy).toHaveBeenCalled();
      })
    );

    it('calls logoffRevocationService.logoffLocal with passed configId when configId is passed', () => {
      const spy = spyOn(logoffRevocationService, 'logoffLocal');

      oidcSecurityService.logoffLocal('configId');

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });

    it('calls logoffRevocationService.logoffLocal with id from config when NO configId is passed', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
      const spy = spyOn(logoffRevocationService, 'logoffLocal');

      oidcSecurityService.logoffLocal();

      expect(spy).toHaveBeenCalledOnceWith('configId');
    });
  });

  describe('logoffLocalMultiple', () => {
    it(
      'calls logoffRevocationService.logoffLocalMultiple',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoffLocalMultiple');

        oidcSecurityService.logoffLocalMultiple();
        expect(spy).toHaveBeenCalledTimes(1);
      })
    );
  });

  describe('revokeAccessToken', () => {
    it(
      'calls logoffRevocationService.revokeAccessToken without param if non is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeAccessToken');

        oidcSecurityService.revokeAccessToken();
        expect(spy).toHaveBeenCalledWith(undefined, undefined);
      })
    );

    it(
      'calls logoffRevocationService.revokeAccessToken with param if param is given',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });

        const spy = spyOn(logoffRevocationService, 'revokeAccessToken');

        oidcSecurityService.revokeAccessToken('aParam');
        expect(spy).toHaveBeenCalledWith('configId', 'aParam');
      })
    );

    it(
      'calls logoffRevocationService.revokeAccessToken with configId if configId is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeAccessToken');

        oidcSecurityService.revokeAccessToken('aParam', 'configId');
        expect(spy).toHaveBeenCalledWith('configId', 'aParam');
      })
    );
  });

  describe('revokeRefreshToken', () => {
    it(
      'calls logoffRevocationService.revokeRefreshToken without param if non is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeRefreshToken');

        oidcSecurityService.revokeRefreshToken();
        expect(spy).toHaveBeenCalledWith(undefined, undefined);
      })
    );

    it(
      'calls logoffRevocationService.revokeRefreshToken with param if param is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeRefreshToken');
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });

        oidcSecurityService.revokeRefreshToken('aParam');
        expect(spy).toHaveBeenCalledWith('configId', 'aParam');
      })
    );

    it(
      'calls logoffRevocationService.revokeRefreshToken with configId if configId is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeRefreshToken');

        oidcSecurityService.revokeRefreshToken('aParam', 'configId');
        expect(spy).toHaveBeenCalledWith('configId', 'aParam');
      })
    );
  });

  describe('getEndSessionUrl', () => {
    it('calls logoffRevocationService.getEndSessionUrl ', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });

      const spy = spyOn(logoffRevocationService, 'getEndSessionUrl');

      oidcSecurityService.getEndSessionUrl();
      expect(spy).toHaveBeenCalledOnceWith('configId', undefined);
    });

    it('calls logoffRevocationService.getEndSessionUrl with customparams', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });

      const spy = spyOn(logoffRevocationService, 'getEndSessionUrl');

      oidcSecurityService.getEndSessionUrl({ custom: 'params' });
      expect(spy).toHaveBeenCalledOnceWith('configId', { custom: 'params' });
    });

    it('calls logoffRevocationService.getEndSessionUrl with customparams and configId', () => {
      const spy = spyOn(logoffRevocationService, 'getEndSessionUrl');

      oidcSecurityService.getEndSessionUrl({ custom: 'params' }, 'configId');
      expect(spy).toHaveBeenCalledOnceWith('configId', { custom: 'params' });
    });
  });
});
