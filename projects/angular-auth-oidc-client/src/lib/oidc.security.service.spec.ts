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
import { StoragePersistenceService } from './storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from './storage/storage-persistence.service-mock';
import { UserServiceMock } from './userData/user-service-mock';
import { UserService } from './userData/user.service';
import { TokenHelperService } from './utils/tokenHelper/token-helper.service';
import { TokenHelperServiceMock } from './utils/tokenHelper/token-helper.service-mock';

describe('OidcSecurityService', () => {
  let oidcSecurityService: OidcSecurityService;
  let configurationProvider: ConfigurationProvider;
  let authStateService: AuthStateService;
  let userService: UserService;
  let checkSessionService: CheckSessionService;
  let tokenHelperService: TokenHelperService;
  let flowsDataService: FlowsDataService;
  let logoffRevocationService: LogoffRevocationService;
  let loginService: LoginService;
  let refreshSessionService: RefreshSessionService;
  let storagePersistenceService: StoragePersistenceService;
  let checkAuthService: CheckAuthService;

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
        {
          provide: StoragePersistenceService,
          useClass: StoragePersistenceServiceMock,
        },
        { provide: RefreshSessionService, useClass: RefreshSessionServiceMock },
      ],
    });
  });

  beforeEach(() => {
    oidcSecurityService = TestBed.inject(OidcSecurityService);
    checkSessionService = TestBed.inject(CheckSessionService);
    userService = TestBed.inject(UserService);
    tokenHelperService = TestBed.inject(TokenHelperService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    authStateService = TestBed.inject(AuthStateService);
    flowsDataService = TestBed.inject(FlowsDataService);
    logoffRevocationService = TestBed.inject(LogoffRevocationService);
    loginService = TestBed.inject(LoginService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    refreshSessionService = TestBed.inject(RefreshSessionService);
    checkAuthService = TestBed.inject(CheckAuthService);
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
          expect(spy).toHaveBeenCalledOnceWith(undefined);
        });
      })
    );

    it('calls checkAuthService.checkAuth() with url if is passed', () => {
      const spy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
      oidcSecurityService.checkAuth('any-thing-url-like').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('any-thing-url-like');
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
  });

  describe('configuration', () => {
    it('is not of type observable', () => {
      expect(oidcSecurityService.getConfigurations).not.toEqual(jasmine.any(Observable));
    });

    it('returns configProvider.configuration', () => {
      const spy = spyOn(configurationProvider, 'getOpenIDConfiguration');
      oidcSecurityService.getConfigurations;
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('userData', () => {
    it('is of type observable', () => {
      expect(oidcSecurityService.userData$).toEqual(jasmine.any(Observable));
    });

    it('returns userService.userData$', () => {
      const spy = spyOnProperty(userService, 'userData$', 'get');
      oidcSecurityService.userData$;
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('forceRefreshSession', () => {
    it(
      'calls refreshSessionService forceRefreshSession',
      waitForAsync(() => {
        const spy = spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(of(null));
        oidcSecurityService.forceRefreshSession().subscribe(() => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'calls storagePersistenceService.write when customParams are given',
      waitForAsync(() => {
        const spy = spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(of(null));
        const writeSpy = spyOn(storagePersistenceService, 'write');
        oidcSecurityService.forceRefreshSession({ my: 'custom', params: 1 }).subscribe(() => {
          expect(spy).toHaveBeenCalled();
          expect(writeSpy).toHaveBeenCalledWith('storageCustomParamsAuthRequest', { my: 'custom', params: 1 }, 'configId');
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
          expect(spy).toHaveBeenCalledWith('configId', { customParams: { any: 'thing' } }, undefined);
        });
      })
    );

    it(
      'calls login service loginWithPopUp with params and popupparams if given',
      waitForAsync(() => {
        const somePopupOptions = { width: 500, height: 500, left: 50, top: 50 };
        const spy = spyOn(loginService, 'loginWithPopUp').and.callFake(() => of(null));
        oidcSecurityService.authorizeWithPopUp({ customParams: { any: 'thing' } }, somePopupOptions).subscribe(() => {
          expect(spy).toHaveBeenCalledWith('configId', { customParams: { any: 'thing' } }, somePopupOptions);
        });
      })
    );
  });

  describe('isAuthenticated', () => {
    it('is of type observable', () => {
      expect(oidcSecurityService.isAuthenticated$).toEqual(jasmine.any(Observable));
    });

    it(
      'returns authStateService.authorized$',
      waitForAsync(() => {
        const spy = spyOnProperty(authStateService, 'authenticated$', 'get').and.returnValue(of(null));
        oidcSecurityService.isAuthenticated$.subscribe(() => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );
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

  describe('getToken', () => {
    it(
      'calls authStateService.getAccessToken()',
      waitForAsync(() => {
        const spy = spyOn(authStateService, 'getAccessToken');

        oidcSecurityService.getIdToken();
        expect(spy).toHaveBeenCalled();
      })
    );
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
  });

  describe('getPayloadFromIdToken', () => {
    it(
      'calls `getIdToken` method',
      waitForAsync(() => {
        const spy = spyOn(oidcSecurityService, 'getIdToken');

        oidcSecurityService.getPayloadFromIdToken();
        expect(spy).toHaveBeenCalled();
      })
    );

    it(
      'without parameters calls with encode = false (default)',
      waitForAsync(() => {
        spyOn(oidcSecurityService, 'getIdToken').and.returnValue('aaa');
        const spy = spyOn(tokenHelperService, 'getPayloadFromToken');

        oidcSecurityService.getPayloadFromIdToken();
        expect(spy).toHaveBeenCalledWith('aaa', false, 'configId');
      })
    );

    it(
      'with parameters calls with encode = true',
      waitForAsync(() => {
        spyOn(oidcSecurityService, 'getIdToken').and.returnValue('aaa');
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
        const spy = spyOn(flowsDataService, 'setAuthStateControl');

        oidcSecurityService.setState('anyString');
        expect(spy).toHaveBeenCalledWith('anyString', 'configId');
      })
    );
  });

  describe('setState', () => {
    it(
      'calls flowsDataService.getAuthStateControl',
      waitForAsync(() => {
        const spy = spyOn(flowsDataService, 'getAuthStateControl');

        oidcSecurityService.getState();
        expect(spy).toHaveBeenCalled();
      })
    );
  });

  describe('logoffAndRevokeTokens', () => {
    it(
      'calls logoffRevocationService.logoffAndRevokeTokens if no urlHandler is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoffAndRevokeTokens');

        oidcSecurityService.logoffAndRevokeTokens();
        expect(spy).toHaveBeenCalledWith(undefined);
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
        expect(spy).toHaveBeenCalledWith(undefined, undefined);
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
      'calls logoffRevocationService.logoffLocal ',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'logoffLocal');

        oidcSecurityService.logoffLocal();
        expect(spy).toHaveBeenCalled();
      })
    );
  });

  describe('revokeAccessToken', () => {
    it(
      'calls logoffRevocationService.revokeAccessToken without param if non is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeAccessToken');

        oidcSecurityService.revokeAccessToken();
        expect(spy).toHaveBeenCalledWith(undefined);
      })
    );

    it(
      'calls logoffRevocationService.revokeAccessToken without param if non is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeAccessToken');

        oidcSecurityService.revokeAccessToken('aParam');
        expect(spy).toHaveBeenCalledWith('aParam');
      })
    );
  });

  describe('revokeRefreshToken', () => {
    it(
      'calls logoffRevocationService.revokeRefreshToken without param if non is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeRefreshToken');

        oidcSecurityService.revokeRefreshToken();
        expect(spy).toHaveBeenCalledWith(undefined);
      })
    );

    it(
      'calls logoffRevocationService.revokeRefreshToken without param if non is given',
      waitForAsync(() => {
        const spy = spyOn(logoffRevocationService, 'revokeRefreshToken');

        oidcSecurityService.revokeRefreshToken('aParam');
        expect(spy).toHaveBeenCalledWith('aParam');
      })
    );
  });

  describe('getEndSessionUrl', () => {
    it('calls logoffRevocationService.getEndSessionUrl ', () => {
      const spy = spyOn(logoffRevocationService, 'getEndSessionUrl');

      oidcSecurityService.getEndSessionUrl();
      expect(spy).toHaveBeenCalled();
    });
  });
});
