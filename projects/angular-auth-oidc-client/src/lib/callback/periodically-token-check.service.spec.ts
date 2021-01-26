import { HttpClientModule } from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subscription, throwError } from 'rxjs';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsDataServiceMock } from '../flows/flows-data.service-mock';
import { FlowsService } from '../flows/flows.service';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { RefreshSessionIframeServiceMock } from '../iframe/refresh-session-iframe.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { AbstractSecurityStorage } from '../storage/abstract-security-storage';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { UserService } from '../userData/user-service';
import { UserServiceMock } from '../userData/user-service-mock';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { IntervallService } from './intervall.service';
import { PeriodicallyTokenCheckService } from './periodically-token-check.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';

describe('PeriodicallyTokenCheckService', () => {
    let periodicallyTokenCheckService: PeriodicallyTokenCheckService;
    let intervallService: IntervallService;
    let configurationProvider: ConfigurationProvider;
    let flowsDataService: FlowsDataService;
    let flowHelper: FlowHelper;
    let authStateService: AuthStateService;
    let refreshSessionIframeService: RefreshSessionIframeService;
    let refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService;
    let userService: UserService;
    let flowsService: FlowsService;
    let storagePersistanceService: StoragePersistanceService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            providers: [
                RefreshSessionRefreshTokenService,
                { provide: FlowsService, useClass: FlowsServiceMock },
                FlowHelper,
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
                { provide: FlowsDataService, useClass: FlowsDataServiceMock },
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: UserService, useClass: UserServiceMock },
                { provide: AuthStateService, useClass: AuthStateServiceMock },
                {
                    provide: RefreshSessionIframeService,
                    useClass: RefreshSessionIframeServiceMock,
                },
                IntervallService,
                StoragePersistanceService,
                AbstractSecurityStorage
            ],
        });
    });

    beforeEach(() => {
        periodicallyTokenCheckService = TestBed.inject(PeriodicallyTokenCheckService);
        intervallService = TestBed.inject(IntervallService);
        configurationProvider = TestBed.inject(ConfigurationProvider);
        flowsDataService = TestBed.inject(FlowsDataService);
        flowHelper = TestBed.inject(FlowHelper);
        authStateService = TestBed.inject(AuthStateService);
        refreshSessionIframeService = TestBed.inject(RefreshSessionIframeService);
        refreshSessionRefreshTokenService = TestBed.inject(RefreshSessionRefreshTokenService);
        userService = TestBed.inject(UserService);
        flowsService = TestBed.inject(FlowsService);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
    });

    it('should create', () => {
        expect(periodicallyTokenCheckService).toBeTruthy();
    });

    describe('startTokenValidationPeriodically', () => {
        it('returns if runTokenValidationRunning', () => {
            spyOn(intervallService as any, 'runTokenValidationRunning').and.returnValue(new Subscription());

            const result = periodicallyTokenCheckService.startTokenValidationPeriodically(99);

            expect(result).toBeUndefined();
        });

        it('returns if openIDConfiguration.silentrenew is false', () => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: false });

            const result = periodicallyTokenCheckService.startTokenValidationPeriodically(99);

            expect(result).toBeUndefined();
        });

        it('interval calls resetSilentRenewRunning when current flow is CodeFlowWithRefeshTokens', fakeAsync(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            const isCurrentFlowCodeFlowWithRefreshTokensSpy = spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(
                true
            );
            const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
            periodicallyTokenCheckService.startTokenValidationPeriodically(1);
            tick(1000);
            intervallService.runTokenValidationRunning.unsubscribe();
            intervallService.runTokenValidationRunning = null;
            expect(isCurrentFlowCodeFlowWithRefreshTokensSpy).toHaveBeenCalled();
            expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
        }));

        it('interval calls resetSilentRenewRunning in case of error', fakeAsync(() => {
            spyOn(intervallService, 'startPeriodicTokenCheck').and.returnValue(throwError('any-error'));
            const resetSilentRenewRunning = spyOn(flowsDataService, 'resetSilentRenewRunning');

            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });

            periodicallyTokenCheckService.startTokenValidationPeriodically(1);
            expect(periodicallyTokenCheckService.startTokenValidationPeriodically).toThrow();
            tick(1000);

            expect(resetSilentRenewRunning).toHaveBeenCalled();
        }));

        it('calls hasIdTokenExpired and hasAccessTokenExpiredIfExpiryExists only when it should be executed', fakeAsync(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens');
            spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');

            const hasIdTokenExpiredSpy = spyOn(authStateService, 'hasIdTokenExpired');
            const hasAccessTokenExpiredIfExpiryExistsSpy = spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists');

            spyOn(refreshSessionIframeService, 'refreshSessionWithIframe').and.returnValue(of(true));

            periodicallyTokenCheckService.startTokenValidationPeriodically(1);
            tick(1000);
            intervallService.runTokenValidationRunning.unsubscribe();
            intervallService.runTokenValidationRunning = null;

            expect(hasIdTokenExpiredSpy).toHaveBeenCalled();
            expect(hasAccessTokenExpiredIfExpiryExistsSpy).toHaveBeenCalled();
        }));

        it('returns if tokens are not expired', fakeAsync(() => {
            const silentRenewSpy = spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens');
            spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');
            spyOn(flowsService, 'resetAuthorizationData');

            const hasIdTokenExpiredSpy = spyOn(authStateService, 'hasIdTokenExpired').and.returnValue(false);
            const hasAccessTokenExpiredIfExpiryExistsSpy = spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(
                false
            );

            spyOn(refreshSessionIframeService, 'refreshSessionWithIframe').and.returnValue(of(true));

            periodicallyTokenCheckService.startTokenValidationPeriodically(1);
            tick(1000);
            intervallService.runTokenValidationRunning.unsubscribe();
            intervallService.runTokenValidationRunning = null;

            expect(hasIdTokenExpiredSpy).toHaveBeenCalled();
            expect(hasAccessTokenExpiredIfExpiryExistsSpy).toHaveBeenCalled();
        }));

        it('calls resetAuthorizationData and returns if no silent renew is configured', fakeAsync(() => {
            const silentRenewSpy = spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens');
            spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');
            spyOn(storagePersistanceService, 'read').withArgs('storageCustomRequestParams').and.returnValue(undefined);
            const resetAuthorizationdataSpy = spyOn(flowsService, 'resetAuthorizationData');

            spyOn(authStateService, 'hasIdTokenExpired').and.returnValue(true);
            spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(true);

            spyOn(refreshSessionIframeService, 'refreshSessionWithIframe').and.returnValue(of(true));

            periodicallyTokenCheckService.startTokenValidationPeriodically(1);
            tick(1000);
            silentRenewSpy.and.returnValue({ silentRenew: false });
            tick(1000);
            intervallService.runTokenValidationRunning.unsubscribe();
            intervallService.runTokenValidationRunning = null;

            expect(resetAuthorizationdataSpy).toHaveBeenCalled();
        }));

        it('calls refreshSessionWithRefreshTokens if current flow is Code flow wiht refresh tokens', fakeAsync(() => {
            spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ silentRenew: true });
            spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
            spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
            spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
            spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');
            spyOn(storagePersistanceService, 'read').withArgs('storageCustomRequestParams').and.returnValue(undefined);
            spyOn(flowsService, 'resetAuthorizationData');

            spyOn(authStateService, 'hasIdTokenExpired').and.returnValue(true);
            spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(true);

            const refreshSessionWithRefreshTokensSpy = spyOn(
                refreshSessionRefreshTokenService,
                'refreshSessionWithRefreshTokens'
            ).and.returnValue(of(null));

            periodicallyTokenCheckService.startTokenValidationPeriodically(1);
            tick(1000);
            intervallService.runTokenValidationRunning.unsubscribe();
            intervallService.runTokenValidationRunning = null;

            expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
        }));
    });
});
