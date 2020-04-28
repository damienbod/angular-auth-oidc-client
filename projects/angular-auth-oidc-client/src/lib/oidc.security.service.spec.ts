import { HttpClientModule } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs';
import { AuthModule } from './auth.module';
import { AuthStateService } from './authState/auth-state.service';
import { CallbackService } from './callback/callback.service';
import { ConfigurationProvider } from './config';
import { CheckSessionService } from './iframe';
import { IFrameService } from './iframe/existing-iframe.service';
import { LoggerService } from './logging/logger.service';
import { LoggerServiceMock } from './logging/logger.service-mock';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { OidcSecurityService } from './oidc.security.service';
import { StoragePersistanceService } from './storage';
import { StoragePersistanceServiceMock } from './storage/storage-persistance.service-mock';
import { UserService } from './userData/user-service';
import { UrlService } from './utils';

fdescribe('OidcSecurityService', () => {
    let oidcSecurityService: OidcSecurityService;
    let configurationProvider: ConfigurationProvider;
    let storagePersistanceService: StoragePersistanceService;
    let urlService: UrlService;
    let authStateService: AuthStateService;
    let userService: UserService;
    let checkSessionService: CheckSessionService;
    let callBackService: CallbackService;

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
    });

    it('should create', () => {
        expect(oidcSecurityService).toBeTruthy();
    });

    describe('configuration', () => {
        it('is not of type observable', () => {
            expect(oidcSecurityService.configuration).not.toEqual(jasmine.any(Observable));
        });

        it('returns configProvider.configuration', () => {
            const spy = spyOnProperty(configurationProvider, 'configuration', 'get');
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

    describe('moduleSetup', () => {
        it('is of type observable', () => {
            expect(oidcSecurityService.moduleSetup$).toEqual(jasmine.any(Observable));
        });

        it('returns checkSessionService.checkSessionChanged$', () => {
            const spy = spyOn((oidcSecurityService as any).isModuleSetupInternal$, 'asObservable');
            const result = oidcSecurityService.moduleSetup$;
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
    });

    it('authorizedImplicitFlowCallback should correctly parse hash params', () => {
        // spyOn(oidcSecurityService as any, 'getSigningKeys').and.returnValue(of(null));
        // const config = {
        //     silentRenew: false,
        //     stsServer: 'https://localhost:5001',
        // };
        // const resultSetter = spyOnProperty(storagePersistanceService, 'authResult', 'set');
        // let hash = 'access_token=ACCESS-TOKEN&token_type=bearer&state=testState';
        // const expectedResult = {
        //     access_token: 'ACCESS-TOKEN',
        //     token_type: 'bearer',
        //     state: 'testState',
        // };
        // configurationProvider.setConfig(config, null);
        // oidcSecurityService.authorizedImplicitFlowCallback(hash);
        // expect(resultSetter).not.toHaveBeenCalled();
        // expect(resultSetter).toHaveBeenCalledWith(expectedResult);
        // // with '=' chars in values
        // hash = 'access_token=ACCESS-TOKEN==&token_type=bearer&state=test=State';
        // expectedResult.access_token = 'ACCESS-TOKEN==';
        // expectedResult.state = 'test=State';
        // oidcSecurityService.authorizedImplicitFlowCallback(hash);
        // expect(resultSetter).toHaveBeenCalledWith(expectedResult);
    });

    // it('logoff should call urlHandler', () => {
    //     const authwellknown = {
    //         endSessionEndpoint: 'some_endpoint',
    //     };

    //     const logoffUrl = 'http://some_logoff_url';

    //     configurationProvider.setConfig(null, authwellknown);

    //     spyOn(urlService, 'createEndSessionUrl').and.returnValue(logoffUrl);
    //     spyOn(oidcSecurityService, 'logoff').and.callThrough();
    //     const redirectToSpy = spyOn(oidcSecurityService as any, 'redirectTo');
    //     const logoffHandlerSpy = jasmine.createSpy('callHandler', (logoutUrl) => {});

    //     oidcSecurityService.logoff(logoffHandlerSpy);

    //     expect(logoffHandlerSpy).toHaveBeenCalledWith(logoffUrl);
    //     expect(redirectToSpy).not.toHaveBeenCalled();
    // });

    // it('logoff should redirect', () => {
    //     const authwellknown = {
    //         endSessionEndpoint: 'some_endpoint',
    //     };

    //     const logoffUrl = 'http://some_logoff_url';

    //     configurationProvider.setConfig(null, authwellknown);

    //     spyOn(urlService, 'createEndSessionUrl').and.returnValue(logoffUrl);
    //     const redirectToSpy = spyOn(oidcSecurityService as any, 'redirectTo');

    //     oidcSecurityService.logoff();

    //     expect(redirectToSpy).toHaveBeenCalledWith(logoffUrl);
    // });

    // it('logoff should reset storage data before emitting an isAuthorizedInternal change', async(() => {
    //     const resetStorageDataSpy = spyOn(storagePersistanceService, 'resetAuthStateInStorage');
    //     configurationProvider.setConfig(null, {});
    //     let hasBeenCalled = false;
    //     (oidcSecurityService as any).isAuthorizedInternal
    //         .pipe(
    //             skipWhile((isAuthorized: boolean) => !isAuthorized),
    //             filter((isAuthorized: boolean) => !isAuthorized)
    //         )
    //         .subscribe(() => {
    //             expect(resetStorageDataSpy).toHaveBeenCalled();
    //             hasBeenCalled = true;
    //         });

    //     expect(hasBeenCalled).toEqual(false);

    //     (oidcSecurityService as any).isAuthorizedInternal.next(true);

    //     oidcSecurityService.logoff();

    //     expect(hasBeenCalled).toEqual(true);
    // }));
});
