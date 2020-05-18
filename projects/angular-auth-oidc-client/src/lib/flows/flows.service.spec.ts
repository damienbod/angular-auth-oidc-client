import { async, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
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
    let configurationProvider: ConfigurationProvider;
    let userService: UserService;
    let flowsDataService: FlowsDataService;
    let authStateService: AuthStateService;
    let urlService: UrlService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FlowsService,
                { provide: UrlService, useClass: UrlServiceMock },
                { provide: FlowsDataService, useClass: FlowsDataServiceMock },
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: TokenValidationService, useClass: TokenValidationServiceMock },
                { provide: StoragePersistanceService, useClass: StoragePersistanceServiceMock },
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
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
});
