import { HttpClientModule } from '@angular/common/http';
import { async, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subscription } from 'rxjs';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsDataServiceMock } from '../flows/flows-data.servoce-mock';
import { FlowsService } from '../flows/flows.service';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { SilentRenewServiceMock } from '../iframe/silent-renew.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { UserService } from '../userData/user-service';
import { UserServiceMock } from '../userData/user-service-mock';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { UrlService } from '../utils/url/url.service';
import { UrlServiceMock } from '../utils/url/url.service-mock';
import { CallbackService } from './callback.service';

describe('Callbackservice ', () => {
    let callbackService: CallbackService;
    let loggerService: LoggerService;

    let urlService: UrlService;
    let flowsService: FlowsService;
    let configurationProvider: ConfigurationProvider;
    let flowsDataService: FlowsDataService;
    let silentRenewService: SilentRenewService;
    let userService: UserService;
    let authStateService: AuthStateService;
    let flowHelper: FlowHelper;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            providers: [
                CallbackService,
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: UrlService, useClass: UrlServiceMock },
                { provide: FlowsService, useClass: FlowsServiceMock },
                { provide: SilentRenewService, useClass: SilentRenewServiceMock },
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
                { provide: UserService, useClass: UserServiceMock },
                { provide: AuthStateService, useClass: AuthStateServiceMock },
                { provide: FlowsDataService, useClass: FlowsDataServiceMock },
                FlowHelper,
            ],
        });
    });

    beforeEach(() => {
        configurationProvider = TestBed.inject(ConfigurationProvider);
        urlService = TestBed.inject(UrlService);
        userService = TestBed.inject(UserService);
        authStateService = TestBed.inject(AuthStateService);
        silentRenewService = TestBed.inject(SilentRenewService);
        flowsDataService = TestBed.inject(FlowsDataService);
        loggerService = TestBed.inject(LoggerService);
        flowsService = TestBed.inject(FlowsService);
        callbackService = TestBed.inject(CallbackService);
        flowHelper = TestBed.inject(FlowHelper);
    });

    describe('handleCallbackAndFireEvents', () => {
        it('calls authorizedCallbackWithCode if current flow is code flow', async(() => {
            spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
            const authorizedCallbackWithCodeSpy = spyOn(callbackService as any, 'authorizedCallbackWithCode').and.returnValue(of(true));

            callbackService.handleCallbackAndFireEvents('anyUrl').subscribe(() => {
                expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledWith('anyUrl');
            });
        }));

        it('calls authorizedImplicitFlowCallback if current flow is implicit flow', async(() => {
            spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
            spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').and.returnValue(true);
            const authorizedCallbackWithCodeSpy = spyOn(callbackService as any, 'authorizedImplicitFlowCallback').and.returnValue(of(true));

            callbackService.handleCallbackAndFireEvents('anyUrl').subscribe(() => {
                expect(authorizedCallbackWithCodeSpy).toHaveBeenCalled();
            });
        }));

        it('emits callbackinternal no matter which flow it is', () => {
            const callbackSpy = spyOn((callbackService as any).stsCallbackInternal$, 'next');
            spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
            const authorizedCallbackWithCodeSpy = spyOn(callbackService as any, 'authorizedCallbackWithCode').and.returnValue(of(true));

            callbackService.handleCallbackAndFireEvents('anyUrl').subscribe(() => {
                expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledWith('anyUrl');
                expect(callbackSpy).toHaveBeenCalled();
            });
        });
    });

    describe('refreshSession', () => {
        it('returns null if no userdata', async(() => {
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
            spyOn(authStateService, 'getIdToken').and.returnValue('someIdToken');
            spyOn(userService, 'getUserDataFromStore').and.returnValue(null);

            callbackService.refreshSession().subscribe((result) => {
                expect(result).toBe(null);
            });
        }));

        it('returns null if silent renew Is running', async(() => {
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
            spyOn(authStateService, 'getIdToken').and.returnValue('someIdToken');
            spyOn(userService, 'getUserDataFromStore').and.returnValue('userdata');

            callbackService.refreshSession().subscribe((result) => {
                expect(result).toBe(null);
            });
        }));

        it('returns null if no id token is set', async(() => {
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(authStateService, 'getIdToken').and.returnValue(null);
            spyOn(userService, 'getUserDataFromStore').and.returnValue('userdata');

            callbackService.refreshSession().subscribe((result) => {
                expect(result).toBe(null);
            });
        }));

        it('calls `setSilentRenewRunning` when should be executed', async(() => {
            const setSilentRenewRunningSpy = spyOn(flowsDataService, 'setSilentRenewRunning');

            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(authStateService, 'getIdToken').and.returnValue('someIdToken');
            spyOn(userService, 'getUserDataFromStore').and.returnValue('userdata');

            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(true);
            spyOn(callbackService as any, 'refreshSessionWithRefreshTokens').and.returnValue(of(null));

            callbackService.refreshSession().subscribe(() => {
                expect(setSilentRenewRunningSpy).toHaveBeenCalled();
            });
        }));

        it('calls refreshSessionWithRefreshTokens when current flow is codeflow with refresh tokens', async(() => {
            spyOn(flowsDataService, 'setSilentRenewRunning');

            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(authStateService, 'getIdToken').and.returnValue('someIdToken');
            spyOn(userService, 'getUserDataFromStore').and.returnValue('userdata');

            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(true);
            const refreshSessionWithRefreshTokensSpy = spyOn(callbackService as any, 'refreshSessionWithRefreshTokens').and.returnValue(
                of(null)
            );

            callbackService.refreshSession().subscribe(() => {
                expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
            });
        }));

        it('calls refreshSessionWithIframe when current flow is NOT codeflow with refresh tokens', async(() => {
            spyOn(flowsDataService, 'setSilentRenewRunning');

            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(authStateService, 'getIdToken').and.returnValue('someIdToken');
            spyOn(userService, 'getUserDataFromStore').and.returnValue('userdata');

            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(false);
            const refreshSessionWithRefreshTokensSpy = spyOn(callbackService as any, 'refreshSessionWithRefreshTokens').and.returnValue(
                of(null)
            );

            const refreshSessionWithIframeSpy = spyOn(callbackService as any, 'refreshSessionWithIframe').and.returnValue(of(null));

            callbackService.refreshSession().subscribe(() => {
                expect(refreshSessionWithRefreshTokensSpy).not.toHaveBeenCalled();
                expect(refreshSessionWithIframeSpy).toHaveBeenCalled();
            });
        }));
    });

    describe('startTokenValidationPeriodically', () => {
        it('returns if runTokenValidationRunning', () => {
            spyOn(callbackService as any, 'runTokenValidationRunning').and.returnValue(new Subscription());

            const result = callbackService.startTokenValidationPeriodically(99);

            expect(result).toBeUndefined();
        });

        it('returns if openIDConfiguration.silentrenew is false', () => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: false });

            const result = callbackService.startTokenValidationPeriodically(99);

            expect(result).toBeUndefined();
        });

        it('starts interval with correct time', fakeAsync(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            const isCurrentFlowCodeFlowWithRefeshTokensSpy = spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens');
            callbackService.startTokenValidationPeriodically(1);
            tick(1000);
            (callbackService as any).runTokenValidationRunning.unsubscribe();
            (callbackService as any).runTokenValidationRunning = null;
            expect(isCurrentFlowCodeFlowWithRefeshTokensSpy).toHaveBeenCalled();
        }));

        it('interval calls resetSilentRenewRunning when current flow is CodeFlowWithRefeshTokens', fakeAsync(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            const isCurrentFlowCodeFlowWithRefeshTokensSpy = spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(
                true
            );
            const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
            callbackService.startTokenValidationPeriodically(1);
            tick(1000);
            (callbackService as any).runTokenValidationRunning.unsubscribe();
            (callbackService as any).runTokenValidationRunning = null;
            expect(isCurrentFlowCodeFlowWithRefeshTokensSpy).toHaveBeenCalled();
            expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
        }));

        it('calls hasIdTokenExpired and hasAccessTokenExpiredIfExpiryExists only when it should be executed', fakeAsync(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens');
            spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');

            const hasIdTokenExpiredSpy = spyOn(authStateService, 'hasIdTokenExpired');
            const hasAccessTokenExpiredIfExpiryExistsSpy = spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists');

            spyOn(callbackService as any, 'refreshSessionWithIframe').and.returnValue(of(true));

            callbackService.startTokenValidationPeriodically(1);
            tick(1000);
            (callbackService as any).runTokenValidationRunning.unsubscribe();
            (callbackService as any).runTokenValidationRunning = null;

            expect(hasIdTokenExpiredSpy).toHaveBeenCalled();
            expect(hasAccessTokenExpiredIfExpiryExistsSpy).toHaveBeenCalled();
        }));

        it('returns if tokens are not expired', fakeAsync(() => {
            const silentRenewSpy = spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens');
            spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');
            spyOn(flowsService, 'resetAuthorizationData');

            const hasIdTokenExpiredSpy = spyOn(authStateService, 'hasIdTokenExpired').and.returnValue(false);
            const hasAccessTokenExpiredIfExpiryExistsSpy = spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(
                false
            );

            spyOn(callbackService as any, 'refreshSessionWithIframe').and.returnValue(of(true));

            callbackService.startTokenValidationPeriodically(1);
            tick(1000);
            (callbackService as any).runTokenValidationRunning.unsubscribe();
            (callbackService as any).runTokenValidationRunning = null;

            expect(hasIdTokenExpiredSpy).toHaveBeenCalled();
            expect(hasAccessTokenExpiredIfExpiryExistsSpy).toHaveBeenCalled();
        }));

        it('calls resetAuthorizationData and returns if no silent renew is configured', fakeAsync(() => {
            const silentRenewSpy = spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens');
            spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');
            const resetAuthorizationdataSpy = spyOn(flowsService, 'resetAuthorizationData');

            spyOn(authStateService, 'hasIdTokenExpired').and.returnValue(true);
            spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(true);

            spyOn(callbackService as any, 'refreshSessionWithIframe').and.returnValue(of(true));

            callbackService.startTokenValidationPeriodically(1);
            tick(1000);
            silentRenewSpy.and.returnValue({ silentRenew: false });
            tick(1000);
            (callbackService as any).runTokenValidationRunning.unsubscribe();
            (callbackService as any).runTokenValidationRunning = null;

            expect(resetAuthorizationdataSpy).toHaveBeenCalled();
        }));

        it('calls refreshSessionWithRefreshTokens if current flow is Code flow wiht refresh tokens', fakeAsync(() => {
            const silentRenewSpy = spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(true);
            spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');
            const resetAuthorizationdataSpy = spyOn(flowsService, 'resetAuthorizationData');

            spyOn(authStateService, 'hasIdTokenExpired').and.returnValue(true);
            spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(true);

            const refreshSessionWithRefreshTokensSpy = spyOn(callbackService as any, 'refreshSessionWithRefreshTokens').and.returnValue(
                of(true)
            );

            callbackService.startTokenValidationPeriodically(1);
            tick(1000);
            (callbackService as any).runTokenValidationRunning.unsubscribe();
            (callbackService as any).runTokenValidationRunning = null;

            expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
        }));
    });

    describe('stopPeriodicallTokenCheck', () => {
        it('returns if scheduledHeartBeatInternal is falsy', () => {
            spyOn(callbackService as any, 'runTokenValidationRunning').and.returnValue(new Subscription());

            const result = callbackService.startTokenValidationPeriodically(99);

            expect(result).toBeUndefined();
        });
    });
});
