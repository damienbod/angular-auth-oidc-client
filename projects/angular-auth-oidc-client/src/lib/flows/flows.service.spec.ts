import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { AuthModule } from '../auth.module';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { AbstractSecurityStorage } from '../storage/abstract-security-storage';
import { BrowserStorageMock } from '../storage/browser-storage.service-mock';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { UserService } from '../userData/user-service';
import { UserServiceMock } from '../userData/user-service-mock';
import { UrlService } from '../utils/url/url.service';
import { UrlServiceMock } from '../utils/url/url.service-mock';
import { StateValidationService } from '../validation/state-validation.service';
import { StateValidationServiceMock } from '../validation/state-validation.service-mock';
import { TokenValidationService } from '../validation/token-validation.service';
import { TokenValidationServiceMock } from '../validation/token-validation.service-mock';
import { CallbackContext } from './callback-context';
import { FlowsDataService } from './flows-data.service';
import { FlowsDataServiceMock } from './flows-data.service-mock';
import { FlowsService } from './flows.service';
import { SigninKeyDataService } from './signin-key-data.service';
import { SigninKeyDataServiceMock } from './signin-key-data.service-mock';

describe('Flows Service', () => {
    let service: FlowsService;
    let userService: UserService;
    let flowsDataService: FlowsDataService;
    let authStateService: AuthStateService;
    let urlService: UrlService;
    let dataService: DataService;
    let storagePersistanceService: StoragePersistanceService;
    let configurationProvider: ConfigurationProvider;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule, HttpClientModule, RouterTestingModule, AuthModule.forRoot()],
            providers: [
                FlowsService,
                ConfigurationProvider,
                { provide: UrlService, useClass: UrlServiceMock },
                { provide: FlowsDataService, useClass: FlowsDataServiceMock },
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: TokenValidationService, useClass: TokenValidationServiceMock },
                { provide: StoragePersistanceService, useClass: StoragePersistanceServiceMock },
                //  { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
                {
                    provide: AbstractSecurityStorage,
                    useClass: BrowserStorageMock,
                },
                { provide: AuthStateService, useClass: AuthStateServiceMock },
                { provide: StateValidationService, useClass: StateValidationServiceMock },
                { provide: UserService, useClass: UserServiceMock },
                { provide: DataService, useClass: DataServiceMock },
                { provide: SigninKeyDataService, useClass: SigninKeyDataServiceMock },
            ],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(FlowsService);
        configurationProvider = TestBed.inject(ConfigurationProvider);
        userService = TestBed.inject(UserService);
        flowsDataService = TestBed.inject(FlowsDataService);
        authStateService = TestBed.inject(AuthStateService);
        urlService = TestBed.inject(UrlService);
        dataService = TestBed.inject(DataService);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('resetAuthorizationData', () => {
        it('calls resetUserDataInStore when autoUserInfo is true', () => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ autoUserinfo: true });
            const resetUserDataInStoreSpy = spyOn(userService, 'resetUserDataInStore');
            spyOn(flowsDataService, 'resetStorageFlowData');
            spyOn(authStateService, 'setUnauthorizedAndFireEvent');

            service.resetAuthorizationData();

            expect(resetUserDataInStoreSpy).toHaveBeenCalled();
        });

        it('does not call resetUserDataInStore when autoUserInfo is false', () => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ autoUserinfo: false });
            const resetUserDataInStoreSpy = spyOn(userService, 'resetUserDataInStore');
            spyOn(flowsDataService, 'resetStorageFlowData');
            spyOn(authStateService, 'setUnauthorizedAndFireEvent');

            service.resetAuthorizationData();

            expect(resetUserDataInStoreSpy).not.toHaveBeenCalled();
        });

        it('calls correct methods', () => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ autoUserinfo: false });
            const resetStorageFlowDataSpy = spyOn(flowsDataService, 'resetStorageFlowData');
            const setUnauthorizedAndFireEventSpy = spyOn(authStateService, 'setUnauthorizedAndFireEvent');

            service.resetAuthorizationData();

            expect(resetStorageFlowDataSpy).toHaveBeenCalled();
            expect(setUnauthorizedAndFireEventSpy).toHaveBeenCalled();
        });
    });

    describe('processCodeFlowCallback', () => {
        it('calls all methods correctly', async(() => {
            const codeFlowCallbackSpy = spyOn(service as any, 'codeFlowCallback').and.returnValue(of({}));
            const codeFlowCodeRequestSpy = spyOn(service as any, 'codeFlowCodeRequest').and.returnValue(of({}));
            const callbackHistoryAndResetJwtKeysSpy = spyOn(service as any, 'callbackHistoryAndResetJwtKeys').and.returnValue(of({}));
            const callbackStateValidationSpy = spyOn(service as any, 'callbackStateValidation').and.returnValue(of({}));
            const callbackUserSpy = spyOn(service as any, 'callbackUser').and.returnValue(of({}));

            service.processCodeFlowCallback('some-url').subscribe((value) => {
                expect(value).toBeTruthy();
                expect(codeFlowCallbackSpy).toHaveBeenCalledWith('some-url');
                expect(codeFlowCodeRequestSpy).toHaveBeenCalled();
                expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
                expect(callbackStateValidationSpy).toHaveBeenCalled();
                expect(callbackUserSpy).toHaveBeenCalled();
            });
        }));
    });

    describe('processSilentRenewCodeFlowCallback', () => {
        it('calls all methods correctly', async(() => {
            const codeFlowCodeRequestSpy = spyOn(service as any, 'codeFlowCodeRequest').and.returnValue(of({}));
            const callbackHistoryAndResetJwtKeysSpy = spyOn(service as any, 'callbackHistoryAndResetJwtKeys').and.returnValue(of({}));
            const callbackStateValidationSpy = spyOn(service as any, 'callbackStateValidation').and.returnValue(of({}));
            const callbackUserSpy = spyOn(service as any, 'callbackUser').and.returnValue(of({}));

            service.processSilentRenewCodeFlowCallback({} as CallbackContext).subscribe((value) => {
                expect(value).toBeTruthy();
                expect(codeFlowCodeRequestSpy).toHaveBeenCalled();
                expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
                expect(callbackStateValidationSpy).toHaveBeenCalled();
                expect(callbackUserSpy).toHaveBeenCalled();
            });
        }));
    });

    describe('processImplicitFlowCallback', () => {
        it('calls all methods correctly', async(() => {
            const implicitFlowCallbackSpy = spyOn(service as any, 'implicitFlowCallback').and.returnValue(of({}));
            const callbackHistoryAndResetJwtKeysSpy = spyOn(service as any, 'callbackHistoryAndResetJwtKeys').and.returnValue(of({}));
            const callbackStateValidationSpy = spyOn(service as any, 'callbackStateValidation').and.returnValue(of({}));
            const callbackUserSpy = spyOn(service as any, 'callbackUser').and.returnValue(of({}));

            (service as any).processImplicitFlowCallback('any-hash').subscribe((value) => {
                expect(value).toBeTruthy();
                expect(implicitFlowCallbackSpy).toHaveBeenCalled();
                expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
                expect(callbackStateValidationSpy).toHaveBeenCalled();
                expect(callbackUserSpy).toHaveBeenCalled();
            });
        }));
    });

    describe('processRefreshToken', () => {
        it('calls all methods correctly', async(() => {
            const refreshSessionWithRefreshTokensSpy = spyOn(service as any, 'refreshSessionWithRefreshTokens').and.returnValue(of({}));
            const refreshTokensRequestTokensSpy = spyOn(service as any, 'refreshTokensRequestTokens').and.returnValue(of({}));
            const callbackHistoryAndResetJwtKeysSpy = spyOn(service as any, 'callbackHistoryAndResetJwtKeys').and.returnValue(of({}));
            const callbackStateValidationSpy = spyOn(service as any, 'callbackStateValidation').and.returnValue(of({}));
            const callbackUserSpy = spyOn(service as any, 'callbackUser').and.returnValue(of({}));

            (service as any).processRefreshToken().subscribe((value) => {
                expect(value).toBeTruthy();
                expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
                expect(refreshTokensRequestTokensSpy).toHaveBeenCalled();
                expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
                expect(callbackStateValidationSpy).toHaveBeenCalled();
                expect(callbackUserSpy).toHaveBeenCalled();
            });
        }));
    });

    describe('codeFlowCallback', () => {
        it('throws error if no state is given', async(() => {
            const getUrlParameterSpy = spyOn(urlService, 'getUrlParameter').and.returnValue('params');
            getUrlParameterSpy.withArgs('any-url', 'state').and.returnValue(null);

            (service as any).codeFlowCallback('any-url').subscribe({
                error: (err) => {
                    expect(err).toBeTruthy();
                },
            });
        }));

        it('throws error if no code is given', async(() => {
            const getUrlParameterSpy = spyOn(urlService, 'getUrlParameter').and.returnValue('params');
            getUrlParameterSpy.withArgs('any-url', 'code').and.returnValue(null);

            (service as any).codeFlowCallback('any-url').subscribe({
                error: (err) => {
                    expect(err).toBeTruthy();
                },
            });
        }));

        it('returns callbackContext if all params are good', async(() => {
            spyOn(urlService, 'getUrlParameter').and.returnValue('params');

            const expectedCallbackContext = {
                code: 'params',
                refreshToken: null,
                state: 'params',
                sessionState: 'params',
                authResult: null,
                isRenewProcess: false,
                jwtKeys: null,
                validationResult: null,
                existingIdToken: null,
            };

            (service as any).codeFlowCallback('any-url').subscribe((callbackContext) => {
                expect(callbackContext).toEqual(expectedCallbackContext);
            });
        }));
    });

    describe('implicitFlowCallback', () => {
        it('calls "resetAuthorizationData" if silent renew is not running', async(() => {
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            const resetAuthorizationDataSpy = spyOn(service as any, 'resetAuthorizationData');

            (service as any).implicitFlowCallback('any-hash').subscribe(() => {
                expect(resetAuthorizationDataSpy).toHaveBeenCalled();
            });
        }));

        it('does NOT calls "resetAuthorizationData" if silent renew is running', async(() => {
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
            const resetAuthorizationDataSpy = spyOn(service as any, 'resetAuthorizationData');

            (service as any).implicitFlowCallback('any-hash').subscribe(() => {
                expect(resetAuthorizationDataSpy).not.toHaveBeenCalled();
            });
        }));

        it('returns callbackContext if all params are good', async(() => {
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
            const expectedCallbackContext = {
                code: null,
                refreshToken: null,
                state: null,
                sessionState: null,
                authResult: { anyHash: '' },
                isRenewProcess: true,
                jwtKeys: null,
                validationResult: null,
                existingIdToken: null,
            };
            (service as any).implicitFlowCallback('anyHash').subscribe((callbackContext) => {
                expect(callbackContext).toEqual(expectedCallbackContext);
            });
        }));
    });

    describe('refreshSessionWithRefreshTokens', () => {
        it('returns callbackContext if all params are good', async(() => {
            spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue('state-data');
            spyOn(authStateService, 'getRefreshToken').and.returnValue('henlo-furiend');
            spyOn(authStateService, 'getIdToken').and.returnValue('henlo-legger');

            const expectedCallbackContext = {
                code: null,
                refreshToken: 'henlo-furiend',
                state: 'state-data',
                sessionState: null,
                authResult: null,
                isRenewProcess: false,
                jwtKeys: null,
                validationResult: null,
                existingIdToken: 'henlo-legger',
            };
            (service as any).refreshSessionWithRefreshTokens().subscribe((callbackContext) => {
                expect(callbackContext).toEqual(expectedCallbackContext);
            });
        }));

        it('throws error if no refresh token is given', async(() => {
            spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue('state-data');
            spyOn(authStateService, 'getRefreshToken').and.returnValue(null);
            spyOn(authStateService, 'getIdToken').and.returnValue('henlo-legger');

            (service as any).refreshSessionWithRefreshTokens().subscribe({
                error: (err) => {
                    expect(err).toBeTruthy();
                },
            });
        }));
    });

    describe('refreshTokensRequestTokens', () => {
        it('throws error if no tokenEndpoint is given', async(() => {
            (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe({
                error: (err) => {
                    expect(err).toBeTruthy();
                },
            });
        }));

        it('calls dataservice if all params are good', async(() => {
            const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
            spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

            (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe((callbackContext) => {
                expect(postSpy).toHaveBeenCalledWith('tokenEndpoint', '', jasmine.any(HttpHeaders));
                const httpHeaders = postSpy.calls.mostRecent().args[2] as HttpHeaders;
                expect(httpHeaders.has('Content-Type')).toBeTrue();
                expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
            });
        }));

        it('calls dataservice with correct headers if all params are good', async(() => {
            const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
            spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

            (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe((callbackContext) => {
                const httpHeaders = postSpy.calls.mostRecent().args[2] as HttpHeaders;
                expect(httpHeaders.has('Content-Type')).toBeTrue();
                expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
            });
        }));

        it('returns error in case of http error', async(() => {
            spyOn(dataService, 'post').and.returnValue(throwError({}));
            spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({ stsServer: 'stsServer' });

            (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe({
                error: (err) => {
                    console.log(err);
                    expect(err).toBeTruthy();
                },
            });
        }));
    });

    describe('codeFlowCodeRequest ', () => {
        it('throws error if no tokenEndpoint is given', async(() => {
            (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe({
                error: (err) => {
                    expect(err).toBeTruthy();
                },
            });
        }));

        it('calls dataservice if all params are good', async(() => {
            const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
            spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

            (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe((callbackContext) => {
                expect(postSpy).toHaveBeenCalledWith('tokenEndpoint', '', jasmine.any(HttpHeaders));
                const httpHeaders = postSpy.calls.mostRecent().args[2] as HttpHeaders;
                expect(httpHeaders.has('Content-Type')).toBeTrue();
                expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
            });
        }));

        it('calls dataservice with correct headers if all params are good', async(() => {
            const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
            spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

            (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe((callbackContext) => {
                const httpHeaders = postSpy.calls.mostRecent().args[2] as HttpHeaders;
                expect(httpHeaders.has('Content-Type')).toBeTrue();
                expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
            });
        }));

        it('returns error in case of http error', async(() => {
            spyOn(dataService, 'post').and.returnValue(throwError({}));
            spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });
            spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({ stsServer: 'stsServer' });

            (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe({
                error: (err) => {
                    console.log(err);
                    expect(err).toBeTruthy();
                },
            });
        }));
    });

    describe('historyCleanUpTurnedOn ', () => {
        it('check for true', () => {
            const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
            config.redirectUrl = 'https://localhost:44386';
            config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
            config.responseType = 'id_token token';
            config.scope = 'openid email profile';
            config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
            config.postLoginRoute = '/home';
            config.forbiddenRoute = '/Forbidden';
            config.unauthorizedRoute = '/Unauthorized';
            config.startCheckSession = false;
            config.silentRenew = false;
            config.renewTimeBeforeTokenExpiresInSeconds = 0;
            config.maxIdTokenIatOffsetAllowedInSeconds = 10;
            config.historyCleanupOff = true;

            configurationProvider.setConfig(config);

            const value = (service as any).historyCleanUpTurnedOn();
            expect(value).toEqual(false);
        });

        it('check for true', () => {
            const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
            config.redirectUrl = 'https://localhost:44386';
            config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
            config.responseType = 'id_token token';
            config.scope = 'openid email profile';
            config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
            config.postLoginRoute = '/home';
            config.forbiddenRoute = '/Forbidden';
            config.unauthorizedRoute = '/Unauthorized';
            config.startCheckSession = false;
            config.silentRenew = false;
            config.renewTimeBeforeTokenExpiresInSeconds = 0;
            config.maxIdTokenIatOffsetAllowedInSeconds = 10;
            config.historyCleanupOff = false;

            configurationProvider.setConfig(config);

            const value = (service as any).historyCleanUpTurnedOn();
            expect(value).toEqual(true);
        });
    });
});
