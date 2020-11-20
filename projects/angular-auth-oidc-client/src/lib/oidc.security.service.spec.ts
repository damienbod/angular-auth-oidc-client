import { HttpClientModule } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';
import { PublicEventsService } from '../public-api';
import { AuthModule } from './auth.module';
import { AuthStateService } from './authState/auth-state.service';
import { CallbackService } from './callback/callback.service';
import { PeriodicallyTokenCheckService } from './callback/periodically-token-check.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { ConfigurationProvider } from './config/config.provider';
import { FlowsDataService } from './flows/flows-data.service';
import { FlowsService } from './flows/flows.service';
import { CheckSessionService } from './iframe/check-session.service';
import { IFrameService } from './iframe/existing-iframe.service';
import { SilentRenewService } from './iframe/silent-renew.service';
import { LoggerService } from './logging/logger.service';
import { LoggerServiceMock } from './logging/logger.service-mock';
import { LoginService } from './login/login.service';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { OidcSecurityService } from './oidc.security.service';
import { StoragePersistanceService } from './storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from './storage/storage-persistance.service-mock';
import { UserService } from './userData/user-service';
import { RedirectService } from './utils/redirect/redirect.service';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';
import { UrlService } from './utils/url/url.service';
import { TokenValidationService } from './validation/token-validation.service';

describe('OidcSecurityService', () => {
    let oidcSecurityService: OidcSecurityService;
    let configurationProvider: ConfigurationProvider;
    let storagePersistanceService: StoragePersistanceService;
    let urlService: UrlService;
    let authStateService: AuthStateService;
    let userService: UserService;
    let checkSessionService: CheckSessionService;
    let callBackService: CallbackService;
    let publicEventsService: PublicEventsService;
    let silentRenewService: SilentRenewService;
    let tokenHelperService: TokenHelperService;
    let flowsDataService: FlowsDataService;
    let loggerService: LoggerService;
    let tokenValidationService: TokenValidationService;
    let flowsService: FlowsService;
    let redirectService: RedirectService;
    let logoffRevocationService: LogoffRevocationService;
    let loginService: LoginService;
    let refreshSessionService: RefreshSessionService;
    let periodicallyTokenCheckService: PeriodicallyTokenCheckService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule, HttpClientModule, RouterTestingModule, AuthModule.forRoot()],
            providers: [
                OidcSecurityService,
                {
                    provide: StoragePersistanceService,
                    useClass: StoragePersistanceServiceMock,
                },
                { provide: LoggerService, useClass: LoggerServiceMock },
                UrlService,
                ConfigurationProvider,
                IFrameService,
                LogoffRevocationService,
                AuthStateService,
                UserService,
                CheckSessionService,
                CallbackService,
                PublicEventsService,
                SilentRenewService,
                TokenHelperService,
                FlowsDataService,
                TokenValidationService,
                FlowsService,
                RedirectService,
                LoginService,
                RefreshSessionService,
                PeriodicallyTokenCheckService,
            ],
        });
    });

    beforeEach(() => {
        oidcSecurityService = TestBed.inject(OidcSecurityService);
        configurationProvider = TestBed.inject(ConfigurationProvider);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
        urlService = TestBed.inject(UrlService);
        userService = TestBed.inject(UserService);
        authStateService = TestBed.inject(AuthStateService);
        checkSessionService = TestBed.inject(CheckSessionService);
        callBackService = TestBed.inject(CallbackService);
        publicEventsService = TestBed.inject(PublicEventsService);
        silentRenewService = TestBed.inject(SilentRenewService);
        tokenHelperService = TestBed.inject(TokenHelperService);
        flowsDataService = TestBed.inject(FlowsDataService);
        loggerService = TestBed.inject(LoggerService);
        tokenValidationService = TestBed.inject(TokenValidationService);
        flowsService = TestBed.inject(FlowsService);
        redirectService = TestBed.inject(RedirectService);
        logoffRevocationService = TestBed.inject(LogoffRevocationService);
        loginService = TestBed.inject(LoginService);
        refreshSessionService = TestBed.inject(RefreshSessionService);

        periodicallyTokenCheckService = TestBed.inject(PeriodicallyTokenCheckService);
    });

    it('should create', () => {
        expect(oidcSecurityService).toBeTruthy();
    });

    describe('configuration', () => {
        it('is not of type observable', () => {
            expect(oidcSecurityService.configuration).not.toEqual(jasmine.any(Observable));
        });

        it('returns configProvider.configuration', () => {
            const spy = spyOnProperty(configurationProvider, 'openIDConfiguration', 'get');
            const result = oidcSecurityService.configuration;
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('userData', () => {
        it('is of type observable', () => {
            expect(oidcSecurityService.userData$).toEqual(jasmine.any(Observable));
        });

        it('returns userService.userData$', () => {
            const spy = spyOnProperty(userService, 'userData$', 'get');
            const result = oidcSecurityService.userData$;
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('forceRefreshSession', () => {
        it('calls refreshSessionService forceRefreshSession', async(() => {
            const spy = spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(of(null));
            oidcSecurityService.forceRefreshSession().subscribe(() => {
                expect(spy).toHaveBeenCalled();
            });
        }));
    });

    describe('authorize', () => {
        it('calls loginservice login', () => {
            const spy = spyOn(loginService, 'login');
            oidcSecurityService.authorize();
            expect(spy).toHaveBeenCalled();
        });

        it('calls loginservice login with params if given', () => {
            const spy = spyOn(loginService, 'login');
            oidcSecurityService.authorize({ customParams: { any: 'thing' } });
            expect(spy).toHaveBeenCalledWith({ customParams: { any: 'thing' } });
        });
    });

    describe('isAuthenticated', () => {
        it('is of type observable', () => {
            expect(oidcSecurityService.isAuthenticated$).toEqual(jasmine.any(Observable));
        });

        it('returns authStateService.authorized$', () => {
            const spy = spyOnProperty(authStateService, 'authorized$', 'get');
            const result = oidcSecurityService.isAuthenticated$;
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('checkSessionChanged', () => {
        it('is of type observable', () => {
            expect(oidcSecurityService.checkSessionChanged$).toEqual(jasmine.any(Observable));
        });

        it('returns checkSessionService.checkSessionChanged$', () => {
            const spy = spyOnProperty(checkSessionService, 'checkSessionChanged$', 'get');
            const result = oidcSecurityService.checkSessionChanged$;
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('stsCallback', () => {
        it('is of type observable', () => {
            expect(oidcSecurityService.stsCallback$).toEqual(jasmine.any(Observable));
        });

        it('returns callbackService.stsCallback$', () => {
            const spy = spyOnProperty(callBackService, 'stsCallback$', 'get');
            const result = oidcSecurityService.stsCallback$;
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('checkAuth', () => {
        it('if not has valid config -> return false', () => {
            expect(oidcSecurityService.stsCallback$).toEqual(jasmine.any(Observable));
        });

        it('returns callbackService.stsCallback$', async(() => {
            const spy = spyOn(configurationProvider, 'hasValidConfig').and.returnValue(false);
            oidcSecurityService.checkAuth().subscribe((result) => expect(result).toBeFalse());
        }));

        it('calls callbackService.handlePossibleStsCallback with current url when callback is true', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'isCallback').and.returnValue(true);
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
            const spy = spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
            oidcSecurityService.checkAuth().subscribe((result) => {
                expect(result).toBeTrue();
                expect(spy).toHaveBeenCalled();
            });
        }));

        it('does NOT call handleCallbackAndFireEvents with current url when callback is false', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'isCallback').and.returnValue(false);
            const spy = spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
            oidcSecurityService.checkAuth().subscribe((result) => {
                expect(result).toBeFalse();
                expect(spy).not.toHaveBeenCalled();
            });
        }));

        it('does fire the auth and userdata events when it is not a callback from the sts and is authenticated', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'isCallback').and.returnValue(false);
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
            spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));

            const setAuthorizedAndFireEventSpy = spyOn(authStateService, 'setAuthorizedAndFireEvent');
            const userServiceSpy = spyOn(userService, 'publishUserdataIfExists');
            oidcSecurityService.checkAuth().subscribe((result) => {
                expect(result).toBeTrue();
                expect(setAuthorizedAndFireEventSpy).toHaveBeenCalled();
                expect(userServiceSpy).toHaveBeenCalled();
            });
        }));

        it('does NOT fire the auth and userdata events when it is not a callback from the sts and is NOT authenticated', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'isCallback').and.returnValue(false);
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
            spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));

            const setAuthorizedAndFireEventSpy = spyOn(authStateService, 'setAuthorizedAndFireEvent');
            const userServiceSpy = spyOn(userService, 'publishUserdataIfExists');
            oidcSecurityService.checkAuth().subscribe((result) => {
                expect(result).toBeFalse();
                expect(setAuthorizedAndFireEventSpy).not.toHaveBeenCalled();
                expect(userServiceSpy).not.toHaveBeenCalled();
            });
        }));

        it('if authenticated return true', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

            oidcSecurityService.checkAuth().subscribe((result) => {
                expect(result).toBeTrue();
            });
        }));

        it('if authenticated set auth and fires event ', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

            const spy = spyOn(authStateService, 'setAuthorizedAndFireEvent');

            oidcSecurityService.checkAuth().subscribe((result) => {
                expect(spy).toHaveBeenCalled();
            });
        }));

        it('if authenticated publishUserdataIfExists ', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

            const spy = spyOn(userService, 'publishUserdataIfExists');

            oidcSecurityService.checkAuth().subscribe((result) => {
                expect(spy).toHaveBeenCalled();
            });
        }));

        it('if authenticated callbackService startTokenValidationPeriodically', async(() => {
            const config = {
                stsServer: 'stsServer',
                tokenRefreshInSeconds: 7,
            };
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue(config);
            spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

            const spy = spyOn(periodicallyTokenCheckService, 'startTokenValidationPeriodically');

            oidcSecurityService.checkAuth().subscribe((result) => {
                expect(spy).toHaveBeenCalledWith(7);
            });
        }));

        it('if isCheckSessionConfigured call checkSessionService.start()', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

            spyOn(checkSessionService, 'isCheckSessionConfigured').and.returnValue(true);
            const spy = spyOn(checkSessionService, 'start');

            oidcSecurityService.checkAuth().subscribe((result) => {
                expect(spy).toHaveBeenCalled();
            });
        }));

        it('if isSilentRenewConfigured call getOrCreateIframe()', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

            spyOn(silentRenewService, 'isSilentRenewConfigured').and.returnValue(true);
            const spy = spyOn(silentRenewService, 'getOrCreateIframe');

            oidcSecurityService.checkAuth().subscribe((result) => {
                expect(spy).toHaveBeenCalled();
            });
        }));
    });

    describe('checkAuthIncludingServer', () => {
        it('if isSilentRenewConfigured call getOrCreateIframe()', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

            spyOn(silentRenewService, 'isSilentRenewConfigured').and.returnValue(true);
            const spy = spyOn(silentRenewService, 'getOrCreateIframe');

            oidcSecurityService.checkAuthIncludingServer().subscribe((result) => {
                expect(spy).toHaveBeenCalled();
            });
        }));

        it('does forceRefreshSession get called and is NOT authenticated', async(() => {
            spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
            spyOn(callBackService, 'isCallback').and.returnValue(false);
            spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
            spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));

            spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(
                of({
                    idToken: 'idToken',
                    accessToken: 'access_token',
                })
            );

            oidcSecurityService.checkAuthIncludingServer().subscribe((result) => {
                expect(result).toBeTruthy();
            });
        }));
    });

    describe('getToken', () => {
        it('calls authStateService.getAccessToken()', async(() => {
            const spy = spyOn(authStateService, 'getAccessToken');

            oidcSecurityService.getToken();
            expect(spy).toHaveBeenCalled();
        }));
    });

    describe('getIdToken', () => {
        it('calls authStateService.getIdToken()', async(() => {
            const spy = spyOn(authStateService, 'getIdToken');

            oidcSecurityService.getIdToken();
            expect(spy).toHaveBeenCalled();
        }));
    });

    describe('getRefreshToken', () => {
        it('calls authStateService.getRefreshToken()', async(() => {
            const spy = spyOn(authStateService, 'getRefreshToken');

            oidcSecurityService.getRefreshToken();
            expect(spy).toHaveBeenCalled();
        }));
    });

    describe('getPayloadFromIdToken', () => {
        it('calls `getIdToken` method', async(() => {
            const spy = spyOn(oidcSecurityService, 'getIdToken');

            oidcSecurityService.getPayloadFromIdToken();
            expect(spy).toHaveBeenCalled();
        }));

        it('without parameters calls with encode = false (default)', async(() => {
            spyOn(oidcSecurityService, 'getIdToken').and.returnValue('aaa');
            const spy = spyOn(tokenHelperService, 'getPayloadFromToken');

            oidcSecurityService.getPayloadFromIdToken();
            expect(spy).toHaveBeenCalledWith('aaa', false);
        }));

        it('with parameters calls with encode = true', async(() => {
            spyOn(oidcSecurityService, 'getIdToken').and.returnValue('aaa');
            const spy = spyOn(tokenHelperService, 'getPayloadFromToken');

            oidcSecurityService.getPayloadFromIdToken(true);
            expect(spy).toHaveBeenCalledWith('aaa', true);
        }));
    });

    describe('setState', () => {
        it('calls flowsDataService.setAuthStateControl with param', async(() => {
            const spy = spyOn(flowsDataService, 'setAuthStateControl');

            oidcSecurityService.setState('anyString');
            expect(spy).toHaveBeenCalledWith('anyString');
        }));
    });

    describe('setState', () => {
        it('calls flowsDataService.getAuthStateControl', async(() => {
            const spy = spyOn(flowsDataService, 'getAuthStateControl');

            oidcSecurityService.getState();
            expect(spy).toHaveBeenCalled();
        }));
    });

    describe('authorize', () => {});

    describe('logoffAndRevokeTokens', () => {
        it('calls logoffRevocationService.logoffAndRevokeTokens if no urlHandler is given', async(() => {
            const spy = spyOn(logoffRevocationService, 'logoffAndRevokeTokens');

            oidcSecurityService.logoffAndRevokeTokens();
            expect(spy).toHaveBeenCalledWith(undefined);
        }));

        it('calls logoffRevocationService.logoffAndRevokeTokens with urlHandler if it is given', async(() => {
            const spy = spyOn(logoffRevocationService, 'logoffAndRevokeTokens');

            const urlHandler = () => {};

            oidcSecurityService.logoffAndRevokeTokens(urlHandler);
            expect(spy).toHaveBeenCalledWith(urlHandler);
        }));
    });

    describe('logoff', () => {
        it('calls logoffRevocationService.logoff if no urlHandler is given', async(() => {
            const spy = spyOn(logoffRevocationService, 'logoff');

            oidcSecurityService.logoff();
            expect(spy).toHaveBeenCalledWith(undefined);
        }));

        it('calls logoffRevocationService.logoff with urlHandler if it is given', async(() => {
            const spy = spyOn(logoffRevocationService, 'logoff');

            const urlHandler = () => {};

            oidcSecurityService.logoff(urlHandler);
            expect(spy).toHaveBeenCalledWith(urlHandler);
        }));
    });

    describe('logoffLocal', () => {
        it('calls logoffRevocationService.logoffLocal ', async(() => {
            const spy = spyOn(logoffRevocationService, 'logoffLocal');

            oidcSecurityService.logoffLocal();
            expect(spy).toHaveBeenCalled();
        }));
    });

    describe('revokeAccessToken', () => {
        it('calls logoffRevocationService.revokeAccessToken without param if non is given', async(() => {
            const spy = spyOn(logoffRevocationService, 'revokeAccessToken');

            oidcSecurityService.revokeAccessToken();
            expect(spy).toHaveBeenCalledWith(undefined);
        }));

        it('calls logoffRevocationService.revokeAccessToken without param if non is given', async(() => {
            const spy = spyOn(logoffRevocationService, 'revokeAccessToken');

            oidcSecurityService.revokeAccessToken('aParam');
            expect(spy).toHaveBeenCalledWith('aParam');
        }));
    });

    describe('revokeRefreshToken', () => {
        it('calls logoffRevocationService.revokeRefreshToken without param if non is given', async(() => {
            const spy = spyOn(logoffRevocationService, 'revokeRefreshToken');

            oidcSecurityService.revokeRefreshToken();
            expect(spy).toHaveBeenCalledWith(undefined);
        }));

        it('calls logoffRevocationService.revokeRefreshToken without param if non is given', async(() => {
            const spy = spyOn(logoffRevocationService, 'revokeRefreshToken');

            oidcSecurityService.revokeRefreshToken('aParam');
            expect(spy).toHaveBeenCalledWith('aParam');
        }));
    });

    describe('getEndSessionUrl', () => {
        it('calls logoffRevocationService.getEndSessionUrl ', () => {
            const spy = spyOn(logoffRevocationService, 'getEndSessionUrl');

            oidcSecurityService.getEndSessionUrl();
            expect(spy).toHaveBeenCalled();
        });
    });
});
