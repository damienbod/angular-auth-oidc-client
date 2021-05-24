import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsDataServiceMock } from '../flows/flows-data.service-mock';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { ResetAuthDataServiceMock } from '../flows/reset-auth-data.service-mock';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { RefreshSessionIframeServiceMock } from '../iframe/refresh-session-iframe.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
import { UserServiceMock } from '../userData/user-service-mock';
import { UserService } from '../userData/user.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { IntervalService } from './interval.service';
import { PeriodicallyTokenCheckService } from './periodically-token-check.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';
import { RefreshSessionRefreshTokenServiceMock } from './refresh-session-refresh-token.service-mock';

fdescribe('PeriodicallyTokenCheckService', () => {
  let periodicallyTokenCheckService: PeriodicallyTokenCheckService;
  let intervalService: IntervalService;
  let configurationProvider: ConfigurationProvider;
  let flowsDataService: FlowsDataService;
  let flowHelper: FlowHelper;
  // let authStateService: AuthStateService;
  // let refreshSessionIframeService: RefreshSessionIframeService;
  // let refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService;
  // let userService: UserService;
  // let storagePersistenceService: StoragePersistenceService;
  // let resetAuthDataService: ResetAuthDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: ResetAuthDataService, useClass: ResetAuthDataServiceMock },
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
        { provide: RefreshSessionRefreshTokenService, useClass: RefreshSessionRefreshTokenServiceMock },
        { provide: StoragePersistenceService, useClass: StoragePersistenceServiceMock },
        IntervalService,
        PublicEventsService,
      ],
    });
  });

  beforeEach(() => {
    periodicallyTokenCheckService = TestBed.inject(PeriodicallyTokenCheckService);
    intervalService = TestBed.inject(IntervalService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    flowsDataService = TestBed.inject(FlowsDataService);
    flowHelper = TestBed.inject(FlowHelper);
    // authStateService = TestBed.inject(AuthStateService);
    // refreshSessionIframeService = TestBed.inject(RefreshSessionIframeService);
    // refreshSessionRefreshTokenService = TestBed.inject(RefreshSessionRefreshTokenService);
    // userService = TestBed.inject(UserService);
    // storagePersistenceService = TestBed.inject(StoragePersistenceService);
    // resetAuthDataService = TestBed.inject(ResetAuthDataService);
  });

  it('should create', () => {
    expect(periodicallyTokenCheckService).toBeTruthy();
  });

  describe('startTokenValidationPeriodically', () => {
    it('returns if runTokenValidationRunning', () => {
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ silentRenew: true }]);

      spyOn(intervalService as any, 'runTokenValidationRunning').and.returnValue(new Subscription());

      const result = periodicallyTokenCheckService.startTokenValidationPeriodically();

      expect(result).toBeUndefined();
    });

    it('returns if openIDConfiguration.silentrenew is false', () => {
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ silentRenew: true }]);

      const result = periodicallyTokenCheckService.startTokenValidationPeriodically();

      expect(result).toBeUndefined();
    });

    it('interval calls resetSilentRenewRunning when current flow is CodeFlowWithRefreshTokens', fakeAsync(() => {
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ silentRenew: true, tokenRefreshInSeconds: 1 }]);
      const isCurrentFlowCodeFlowWithRefreshTokensSpy = spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
      const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
      periodicallyTokenCheckService.startTokenValidationPeriodically();
      tick(1000);
      intervalService.runTokenValidationRunning.unsubscribe();
      intervalService.runTokenValidationRunning = null;
      expect(isCurrentFlowCodeFlowWithRefreshTokensSpy).toHaveBeenCalled();
      expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
    }));

    // fit('interval calls resetSilentRenewRunning in case of error', fakeAsync(() => {
    //   spyOn(intervalService, 'startPeriodicTokenCheck').and.returnValue(throwError('any-error'));
    //   const resetSilentRenewRunning = spyOn(flowsDataService, 'resetSilentRenewRunning');

    //   spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ silentRenew: true, tokenRefreshInSeconds: 1 }]);

    //   periodicallyTokenCheckService.startTokenValidationPeriodically();
    //   expect(periodicallyTokenCheckService.startTokenValidationPeriodically).toThrow();
    //   tick(1000);

    //   expect(resetSilentRenewRunning).toHaveBeenCalled();
    // }));

    //   it('calls hasIdTokenExpired and hasAccessTokenExpiredIfExpiryExists only when it should be executed', fakeAsync(() => {
    //     spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ silentRenew: true }]);
    //     spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens');
    //     spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
    //     spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
    //     spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');

    //     const hasIdTokenExpiredSpy = spyOn(authStateService, 'hasIdTokenExpired');
    //     const hasAccessTokenExpiredIfExpiryExistsSpy = spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists');

    //     spyOn(refreshSessionIframeService, 'refreshSessionWithIframe').and.returnValue(of(true));

    //     periodicallyTokenCheckService.startTokenValidationPeriodically();
    //     tick(1000);
    //     intervalService.runTokenValidationRunning.unsubscribe();
    //     intervalService.runTokenValidationRunning = null;

    //     expect(hasIdTokenExpiredSpy).toHaveBeenCalled();
    //     expect(hasAccessTokenExpiredIfExpiryExistsSpy).toHaveBeenCalled();
    //   }));

    //   it('returns if tokens are not expired', fakeAsync(() => {
    //     spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ silentRenew: true }]);
    //     spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens');
    //     spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
    //     spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
    //     spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');
    //     spyOn(resetAuthDataService, 'resetAuthorizationData');

    //     const hasIdTokenExpiredSpy = spyOn(authStateService, 'hasIdTokenExpired').and.returnValue(false);
    //     const hasAccessTokenExpiredIfExpiryExistsSpy = spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);

    //     spyOn(refreshSessionIframeService, 'refreshSessionWithIframe').and.returnValue(of(true));

    //     periodicallyTokenCheckService.startTokenValidationPeriodically();
    //     tick(1000);
    //     intervalService.runTokenValidationRunning.unsubscribe();
    //     intervalService.runTokenValidationRunning = null;

    //     expect(hasIdTokenExpiredSpy).toHaveBeenCalled();
    //     expect(hasAccessTokenExpiredIfExpiryExistsSpy).toHaveBeenCalled();
    //   }));

    //   it('calls resetAuthorizationData and returns if no silent renew is configured', fakeAsync(() => {
    //     const silentRenewSpy = spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ silentRenew: true }]);

    //     spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens');
    //     spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
    //     spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
    //     spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');
    //     const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');

    //     spyOn(authStateService, 'hasIdTokenExpired').and.returnValue(true);
    //     spyOn(storagePersistenceService, 'read').withArgs('storageCustomRequestParams', 'configId').and.returnValue(undefined);
    //     spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(true);

    //     spyOn(refreshSessionIframeService, 'refreshSessionWithIframe').and.returnValue(of(true));

    //     periodicallyTokenCheckService.startTokenValidationPeriodically();
    //     tick(1000);
    //     silentRenewSpy.and.returnValue([{ silentRenew: false }]);
    //     tick(1000);
    //     intervalService.runTokenValidationRunning.unsubscribe();
    //     intervalService.runTokenValidationRunning = null;

    //     expect(resetAuthorizationDataSpy).toHaveBeenCalled();
    //   }));

    //   it('calls refreshSessionWithRefreshTokens if current flow is Code flow wiht refresh tokens', fakeAsync(() => {
    //     spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ silentRenew: true }]);
    //     spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
    //     spyOn(authStateService, 'getIdToken').and.returnValue('some-id-token');
    //     spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
    //     spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');
    //     spyOn(storagePersistenceService, 'read').withArgs('storageCustomRequestParams', 'configId').and.returnValue(undefined);
    //     spyOn(resetAuthDataService, 'resetAuthorizationData');

    //     spyOn(authStateService, 'hasIdTokenExpired').and.returnValue(true);
    //     spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(true);

    //     const refreshSessionWithRefreshTokensSpy = spyOn(
    //       refreshSessionRefreshTokenService,
    //       'refreshSessionWithRefreshTokens'
    //     ).and.returnValue(of(null));

    //     periodicallyTokenCheckService.startTokenValidationPeriodically();
    //     tick(1000);
    //     intervalService.runTokenValidationRunning.unsubscribe();
    //     intervalService.runTokenValidationRunning = null;

    //     expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
    //   }));
  });
});
