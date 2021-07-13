import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, Subscription, throwError } from 'rxjs';
import { AuthStateService } from '../auth-state/auth-state.service';
import { AuthStateServiceMock } from '../auth-state/auth-state.service-mock';
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
import { UserServiceMock } from '../user-data/user-service-mock';
import { UserService } from '../user-data/user.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { IntervalService } from './interval.service';
import { PeriodicallyTokenCheckService } from './periodically-token-check.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';
import { RefreshSessionRefreshTokenServiceMock } from './refresh-session-refresh-token.service-mock';

describe('PeriodicallyTokenCheckService', () => {
  let periodicallyTokenCheckService: PeriodicallyTokenCheckService;
  let intervalService: IntervalService;
  let configurationProvider: ConfigurationProvider;
  let flowsDataService: FlowsDataService;
  let flowHelper: FlowHelper;
  let authStateService: AuthStateService;
  let refreshSessionIframeService: RefreshSessionIframeService;
  let refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService;
  let userService: UserService;
  let storagePersistenceService: StoragePersistenceService;
  let resetAuthDataService: ResetAuthDataService;

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
    authStateService = TestBed.inject(AuthStateService);
    refreshSessionIframeService = TestBed.inject(RefreshSessionIframeService);
    refreshSessionRefreshTokenService = TestBed.inject(RefreshSessionRefreshTokenService);
    userService = TestBed.inject(UserService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
  });

  it('should create', () => {
    expect(periodicallyTokenCheckService).toBeTruthy();
  });

  describe('startTokenValidationPeriodically', () => {
    it('returns if no config has silentrenew enabled', () => {
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ silentRenew: false }, { silentRenew: false }]);

      const result = periodicallyTokenCheckService.startTokenValidationPeriodically();

      expect(result).toBeUndefined();
    });

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
      spyOn(periodicallyTokenCheckService as any, 'shouldStartPeriodicallyCheckForConfig').and.returnValue(true);
      const isCurrentFlowCodeFlowWithRefreshTokensSpy = spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
      const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');

      periodicallyTokenCheckService.startTokenValidationPeriodically();

      tick(1000);

      intervalService.runTokenValidationRunning.unsubscribe();
      intervalService.runTokenValidationRunning = null;
      expect(isCurrentFlowCodeFlowWithRefreshTokensSpy).toHaveBeenCalled();
      expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
    }));

    it('interval calls resetSilentRenewRunning in case of error when current flow is CodeFlowWithRefreshTokens', fakeAsync(() => {
      spyOn(intervalService, 'startPeriodicTokenCheck').and.returnValue(of(null));
      spyOn(periodicallyTokenCheckService as any, 'shouldStartPeriodicallyCheckForConfig').and.returnValue(true);
      const resetSilentRenewRunning = spyOn(flowsDataService, 'resetSilentRenewRunning');
      spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
      spyOn(refreshSessionRefreshTokenService, 'refreshSessionWithRefreshTokens').and.returnValue(throwError('some error'));

      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        { configId: 'configId', silentRenew: true, tokenRefreshInSeconds: 1 },
      ]);

      periodicallyTokenCheckService.startTokenValidationPeriodically();
      expect(periodicallyTokenCheckService.startTokenValidationPeriodically).toThrow();
      tick(1000);

      expect(resetSilentRenewRunning).toHaveBeenCalledOnceWith('configId');
    }));

    it('interval calls resetSilentRenewRunning in case of error when current flow is NOT CodeFlowWithRefreshTokens', fakeAsync(() => {
      spyOn(intervalService, 'startPeriodicTokenCheck').and.returnValue(of(null));
      spyOn(periodicallyTokenCheckService as any, 'shouldStartPeriodicallyCheckForConfig').and.returnValue(true);
      const resetSilentRenewRunning = spyOn(flowsDataService, 'resetSilentRenewRunning');
      spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
      spyOn(refreshSessionIframeService, 'refreshSessionWithIframe').and.returnValue(throwError('some error'));

      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        { configId: 'configId', silentRenew: true, tokenRefreshInSeconds: 1 },
      ]);

      periodicallyTokenCheckService.startTokenValidationPeriodically();
      expect(periodicallyTokenCheckService.startTokenValidationPeriodically).toThrow();
      tick(1000);

      expect(resetSilentRenewRunning).toHaveBeenCalledOnceWith('configId');
    }));

    it('calls resetAuthorizationData and returns if no silent renew is configured', fakeAsync(() => {
      const configSpy = spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        { configId: 'configId', silentRenew: true, tokenRefreshInSeconds: 1 },
      ]);
      spyOn(periodicallyTokenCheckService as any, 'shouldStartPeriodicallyCheckForConfig').and.returnValue(true);

      const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');

      periodicallyTokenCheckService.startTokenValidationPeriodically();
      tick(1000);
      configSpy.and.returnValue([{ silentRenew: false }]);
      tick(1000);
      intervalService.runTokenValidationRunning.unsubscribe();
      intervalService.runTokenValidationRunning = null;

      expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(2);
      expect(resetAuthorizationDataSpy).toHaveBeenCalledWith('configId');
    }));

    it('calls refreshSessionWithRefreshTokens if current flow is Code flow with refresh tokens', fakeAsync(() => {
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        { configId: 'configId', silentRenew: true, tokenRefreshInSeconds: 1 },
      ]);
      spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens').and.returnValue(true);
      spyOn(periodicallyTokenCheckService as any, 'shouldStartPeriodicallyCheckForConfig').and.returnValue(true);
      spyOn(storagePersistenceService, 'read').and.returnValue({});
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ customParamsRefreshTokenRequest: {}, silentRenew: true });
      const refreshSessionWithRefreshTokensSpy = spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      ).and.returnValue(of(null));

      periodicallyTokenCheckService.startTokenValidationPeriodically();

      tick(1000);

      intervalService.runTokenValidationRunning.unsubscribe();
      intervalService.runTokenValidationRunning = null;
      expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
    }));
  });

  describe('shouldStartPeriodicallyCheckForConfig', () => {
    it('returns false when there is no IdToken', () => {
      spyOn(authStateService, 'getIdToken').and.returnValue(null);
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
      spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');

      const result = (periodicallyTokenCheckService as any).shouldStartPeriodicallyCheckForConfig('configId');

      expect(result).toBeFalse();
    });

    it('returns false when silent renew is running', () => {
      spyOn(authStateService, 'getIdToken').and.returnValue('idToken');
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
      spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');

      const result = (periodicallyTokenCheckService as any).shouldStartPeriodicallyCheckForConfig('configId');

      expect(result).toBeFalse();
    });

    it('returns false when there is no userdata from the store', () => {
      spyOn(authStateService, 'getIdToken').and.returnValue('idToken');
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
      spyOn(userService, 'getUserDataFromStore').and.returnValue(null);

      const result = (periodicallyTokenCheckService as any).shouldStartPeriodicallyCheckForConfig('configId');

      expect(result).toBeFalse();
    });

    it('returns true when there is userDataFromStore, silentrenew is not running and there is an idtoken', () => {
      spyOn(authStateService, 'getIdToken').and.returnValue('idToken');
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
      spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');

      const result = (periodicallyTokenCheckService as any).shouldStartPeriodicallyCheckForConfig('configId');

      expect(result).toBeTrue();
    });

    it('returns false if tokens are not expired', () => {
      spyOn(authStateService, 'getIdToken').and.returnValue('idToken');
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
      spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');
      spyOn(authStateService, 'hasIdTokenExpiredAndRenewCheckIsEnabled').and.returnValue(false);
      spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);

      const result = (periodicallyTokenCheckService as any).shouldStartPeriodicallyCheckForConfig('configId');

      expect(result).toBeFalse();
    });

    it('returns true if tokens are  expired', () => {
      spyOn(authStateService, 'getIdToken').and.returnValue('idToken');
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
      spyOn(userService, 'getUserDataFromStore').and.returnValue('some-userdata');

      spyOn(authStateService, 'hasIdTokenExpiredAndRenewCheckIsEnabled').and.returnValue(true);
      spyOn(authStateService, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(true);

      const result = (periodicallyTokenCheckService as any).shouldStartPeriodicallyCheckForConfig('configId');

      expect(result).toBeTrue();
    });
  });
});
