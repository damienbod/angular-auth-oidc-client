import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationService } from '../config/config.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { LoggerService } from '../logging/services/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { UserService } from '../user-data/user.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { IntervalService } from './interval.service';
import { PeriodicallyTokenCheckService } from './periodically-token-check.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';

describe('PeriodicallyTokenCheckService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  let periodicallyTokenCheckService: PeriodicallyTokenCheckService;
  let intervalService: IntervalService;
  let flowsDataService: FlowsDataService;
  let flowHelper: FlowHelper;
  let authStateService: AuthStateService;
  let refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService;
  let userService: UserService;
  let storagePersistenceService: StoragePersistenceService;
  let resetAuthDataService: ResetAuthDataService;
  let configurationService: ConfigurationService;
  let publicEventsService: PublicEventsService;
  let loggerService: LoggerService;
  let refreshSessionIframeService: RefreshSessionIframeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        mockProvider(ResetAuthDataService),
        FlowHelper,
        mockProvider(FlowsDataService),
        mockProvider(LoggerService),
        mockProvider(UserService),
        mockProvider(AuthStateService),
        mockProvider(RefreshSessionIframeService),
        mockProvider(RefreshSessionRefreshTokenService),
        mockProvider(IntervalService),
        mockProvider(StoragePersistenceService),
        mockProvider(PublicEventsService),
        mockProvider(ConfigurationService),
      ],
    });
  });

  beforeEach(() => {
    periodicallyTokenCheckService = TestBed.inject(
      PeriodicallyTokenCheckService
    );
    intervalService = TestBed.inject(IntervalService);
    flowsDataService = TestBed.inject(FlowsDataService);
    flowHelper = TestBed.inject(FlowHelper);
    authStateService = TestBed.inject(AuthStateService);
    refreshSessionRefreshTokenService = TestBed.inject(
      RefreshSessionRefreshTokenService
    );
    userService = TestBed.inject(UserService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
    publicEventsService = TestBed.inject(PublicEventsService);
    loggerService = TestBed.inject(LoggerService);
    configurationService = TestBed.inject(ConfigurationService);
    refreshSessionIframeService = TestBed.inject(RefreshSessionIframeService);

    vi.spyOn(intervalService, 'startPeriodicTokenCheck').mockReturnValue(
      of(null)
    );
  });

  afterEach(() => {
    if (!!intervalService.runTokenValidationRunning?.unsubscribe) {
      intervalService.runTokenValidationRunning.unsubscribe();
      intervalService.runTokenValidationRunning = null;
    }
  });

  it('should create', () => {
    expect(periodicallyTokenCheckService).toBeTruthy();
  });

  describe('startTokenValidationPeriodically', () => {
    it('interval calls resetSilentRenewRunning when current flow is CodeFlowWithRefreshTokens', async () => {
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 1 },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(true);
      const isCurrentFlowCodeFlowWithRefreshTokensSpy = vi
        .spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefreshTokens')
        .mockReturnValue(true);
      const resetSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);

      vi.spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      ).mockReturnValue(of({} as CallbackContext));
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );

      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );

      await vi.advanceTimersByTimeAsync(1000);

      intervalService.runTokenValidationRunning?.unsubscribe();
      intervalService.runTokenValidationRunning = null;
      expect(isCurrentFlowCodeFlowWithRefreshTokensSpy).toHaveBeenCalled();
      expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
    });

    it('interval calls resetSilentRenewRunning in case of error when current flow is CodeFlowWithRefreshTokens', async () => {
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 1 },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(true);
      const resetSilentRenewRunning = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);
      const logErrorSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      ).mockReturnValue(throwError(() => new Error('error')));
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );

      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );

      await vi.advanceTimersByTimeAsync(1000);

      expect(logErrorSpy).toHaveBeenCalledWith(
        configs[0],
        'silent renew failed!',
        expect.any(Error)
      );
      expect(resetSilentRenewRunning).toHaveBeenCalledTimes(1);
      expect(resetSilentRenewRunning).toHaveBeenCalledWith(configs[0]);
    });

    it('interval throws silent renew failed event with data in case of an error', async () => {
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 1 },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(true);
      vi.spyOn(flowsDataService, 'resetSilentRenewRunning').mockReturnValue(
        undefined
      );
      const publicEventsServiceSpy = vi
        .spyOn(publicEventsService, 'fireEvent')
        .mockReturnValue(undefined);

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      ).mockReturnValue(throwError(() => new Error('error')));
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );

      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );

      await vi.advanceTimersByTimeAsync(1000);

      expect(vi.mocked(publicEventsServiceSpy).mock.calls).toEqual([
        [EventTypes.SilentRenewStarted],
        [EventTypes.SilentRenewFailed, new Error('error')],
      ]);
    });

    it('calls resetAuthorizationData and returns if no silent renew is configured', async () => {
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 1 },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(true);

      const configSpy = vi
        .spyOn(configurationService, 'getOpenIDConfiguration')
        .mockReturnValue(undefined as any);
      const configWithoutSilentRenew = {
        silentRenew: false,
        configId: 'configId1',
        tokenRefreshInSeconds: 1,
      };
      const configWithoutSilentRenew$ = of(configWithoutSilentRenew);

      configSpy.mockReturnValue(configWithoutSilentRenew$);

      const resetAuthorizationDataSpy = vi
        .spyOn(resetAuthDataService, 'resetAuthorizationData')
        .mockReturnValue(undefined);

      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );
      await vi.advanceTimersByTimeAsync(1000);
      intervalService.runTokenValidationRunning?.unsubscribe();
      intervalService.runTokenValidationRunning = null;

      expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(1);
      expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(1);
      expect(resetAuthorizationDataSpy).toHaveBeenCalledWith(
        configWithoutSilentRenew,
        configs
      );
    });

    it('calls refreshSessionWithRefreshTokens if current flow is Code flow with refresh tokens', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(true);
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({});
      const configs = [
        { configId: 'configId1', silentRenew: true, tokenRefreshInSeconds: 1 },
      ];

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0] as OpenIdConfiguration)
      );
      const refreshSessionWithRefreshTokensSpy = vi
        .spyOn(
          refreshSessionRefreshTokenService,
          'refreshSessionWithRefreshTokens'
        )
        .mockReturnValue(of({} as CallbackContext));

      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );

      await vi.advanceTimersByTimeAsync(1000);

      intervalService.runTokenValidationRunning?.unsubscribe();
      intervalService.runTokenValidationRunning = null;
      expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
    });
  });

  describe('startTokenValidationPeriodically guards and refresh paths', () => {
    it('does not start the periodic check when no config has silent renew enabled', () => {
      // Arrange
      const configs = [
        { silentRenew: false, configId: 'configId1', tokenRefreshInSeconds: 1 },
        { configId: 'configId2', tokenRefreshInSeconds: 1 },
      ];
      const isTokenValidationRunningSpy = vi.spyOn(
        intervalService,
        'isTokenValidationRunning'
      );

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );

      // Assert
      expect(isTokenValidationRunningSpy).not.toHaveBeenCalled();
      expect(intervalService.startPeriodicTokenCheck).not.toHaveBeenCalled();
      expect(intervalService.runTokenValidationRunning).toBeFalsy();
    });

    it('does not start a second periodic check when token validation is already running', () => {
      // Arrange
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 1 },
      ];

      vi.spyOn(intervalService, 'isTokenValidationRunning').mockReturnValue(
        true
      );

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );

      // Assert
      expect(intervalService.startPeriodicTokenCheck).not.toHaveBeenCalled();
      expect(intervalService.runTokenValidationRunning).toBeFalsy();
    });

    it('starts the periodic check with the smallest refresh time, treating a missing refresh time as 0', () => {
      // Arrange
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 3 },
        { silentRenew: true, configId: 'configId2' },
        { silentRenew: true, configId: 'configId3', tokenRefreshInSeconds: 5 },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(false);
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );

      // Assert
      expect(intervalService.startPeriodicTokenCheck).toHaveBeenCalledWith(0);
    });

    it('starts the periodic check with the smallest configured refresh time', () => {
      // Arrange
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 5 },
        { silentRenew: true, configId: 'configId2', tokenRefreshInSeconds: 2 },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(false);
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );

      // Assert
      expect(intervalService.startPeriodicTokenCheck).toHaveBeenCalledWith(2);
    });

    it('does not refresh nor fire SilentRenewStarted when the config should not be checked', async () => {
      // Arrange
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 1 },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(false);
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );
      const fireEventSpy = vi.spyOn(publicEventsService, 'fireEvent');
      const refreshSessionWithRefreshTokensSpy = vi.spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      );
      const refreshSessionWithIframeSpy = vi.spyOn(
        refreshSessionIframeService,
        'refreshSessionWithIframe'
      );
      const setSilentRenewRunningSpy = vi.spyOn(
        flowsDataService,
        'setSilentRenewRunning'
      );

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(fireEventSpy).not.toHaveBeenCalled();
      expect(setSilentRenewRunningSpy).not.toHaveBeenCalled();
      expect(refreshSessionWithRefreshTokensSpy).not.toHaveBeenCalled();
      expect(refreshSessionWithIframeSpy).not.toHaveBeenCalled();
    });

    it('does not reset the running flag after the check when the current flow is not code flow with refresh tokens', async () => {
      // Arrange
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 1 },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(false);
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );
      const logDebugSpy = vi.spyOn(loggerService, 'logDebug');
      const resetSilentRenewRunningSpy = vi.spyOn(
        flowsDataService,
        'resetSilentRenewRunning'
      );

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(logDebugSpy).toHaveBeenCalledWith(
        configs[0],
        'silent renew, periodic check finished!'
      );
      expect(resetSilentRenewRunningSpy).not.toHaveBeenCalled();
    });

    it('refreshes with the iframe using the stored auth request custom params when not code flow with refresh tokens', async () => {
      // Arrange
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 1 },
      ];
      const customParams = { prompt: 'none' };

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(true);
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );
      const readSpy = vi
        .spyOn(storagePersistenceService, 'read')
        .mockReturnValue(customParams);
      const setSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'setSilentRenewRunning')
        .mockReturnValue(undefined);
      const refreshSessionWithIframeSpy = vi
        .spyOn(refreshSessionIframeService, 'refreshSessionWithIframe')
        .mockReturnValue(of(true));
      const refreshSessionWithRefreshTokensSpy = vi.spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      );

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(setSilentRenewRunningSpy).toHaveBeenCalledWith(configs[0]);
      expect(readSpy).toHaveBeenCalledWith(
        'storageCustomParamsAuthRequest',
        configs[0]
      );
      expect(refreshSessionWithIframeSpy).toHaveBeenCalledExactlyOnceWith(
        configs[0],
        configs,
        customParams
      );
      expect(refreshSessionWithRefreshTokensSpy).not.toHaveBeenCalled();
    });

    it('refreshes with the configured refresh token params when no custom refresh params are stored', async () => {
      // Arrange
      const configs = [
        {
          silentRenew: true,
          configId: 'configId1',
          tokenRefreshInSeconds: 1,
          customParamsRefreshTokenRequest: { configured: 'param' },
        },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(true);
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );
      const readSpy = vi
        .spyOn(storagePersistenceService, 'read')
        .mockReturnValue(null);
      const refreshSessionWithRefreshTokensSpy = vi
        .spyOn(
          refreshSessionRefreshTokenService,
          'refreshSessionWithRefreshTokens'
        )
        .mockReturnValue(of({} as CallbackContext));

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(readSpy).toHaveBeenCalledWith(
        'storageCustomParamsRefresh',
        configs[0]
      );
      expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalledWith(
        configs[0],
        configs,
        { configured: 'param' }
      );
    });

    it('merges stored custom refresh params over the configured refresh token params', async () => {
      // Arrange
      const configs = [
        {
          silentRenew: true,
          configId: 'configId1',
          tokenRefreshInSeconds: 1,
          customParamsRefreshTokenRequest: { configured: 'param', a: 'old' },
        },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(true);
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        a: 'new',
      });
      const refreshSessionWithRefreshTokensSpy = vi
        .spyOn(
          refreshSessionRefreshTokenService,
          'refreshSessionWithRefreshTokens'
        )
        .mockReturnValue(of({} as CallbackContext));

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalledWith(
        configs[0],
        configs,
        { configured: 'param', a: 'new' }
      );
    });

    it('resets the authorization data and does not refresh when the stored config cannot be found', async () => {
      // Arrange
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 1 },
      ];

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(true);
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(null)
      );
      const resetAuthorizationDataSpy = vi
        .spyOn(resetAuthDataService, 'resetAuthorizationData')
        .mockReturnValue(undefined);
      const setSilentRenewRunningSpy = vi.spyOn(
        flowsDataService,
        'setSilentRenewRunning'
      );
      const refreshSessionWithIframeSpy = vi.spyOn(
        refreshSessionIframeService,
        'refreshSessionWithIframe'
      );

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        configs[0]
      );
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(resetAuthorizationDataSpy).toHaveBeenCalledExactlyOnceWith(
        null,
        configs
      );
      expect(setSilentRenewRunningSpy).not.toHaveBeenCalled();
      expect(refreshSessionWithIframeSpy).not.toHaveBeenCalled();
    });

    it('logs the failure against the current config and stops emitting when the periodic refresh fails', async () => {
      // Arrange
      const configs = [
        { silentRenew: true, configId: 'configId1', tokenRefreshInSeconds: 1 },
      ];
      const currentConfig = { configId: 'currentConfig' };

      vi.spyOn(
        periodicallyTokenCheckService as any,
        'shouldStartPeriodicallyCheckForConfig'
      ).mockReturnValue(true);
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
        of(configs[0])
      );
      vi.spyOn(
        refreshSessionIframeService,
        'refreshSessionWithIframe'
      ).mockReturnValue(throwError(() => new Error('iframe failed')));
      const logErrorSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const logDebugSpy = vi.spyOn(loggerService, 'logDebug');

      // Act
      periodicallyTokenCheckService.startTokenValidationPeriodically(
        configs,
        currentConfig
      );
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(logErrorSpy).toHaveBeenCalledWith(
        currentConfig,
        'silent renew failed!',
        expect.any(Error)
      );
      expect(logDebugSpy).not.toHaveBeenCalledWith(
        expect.anything(),
        'silent renew, periodic check finished!'
      );
    });
  });

  describe('shouldStartPeriodicallyCheckForConfig', () => {
    it('returns false when there is no IdToken', () => {
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('');
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'some-userdata'
      );

      const result = (
        periodicallyTokenCheckService as any
      ).shouldStartPeriodicallyCheckForConfig({ configId: 'configId1' });

      expect(result).toBe(false);
    });

    it('returns false when silent renew is running', () => {
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('idToken');
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'some-userdata'
      );

      const result = (
        periodicallyTokenCheckService as any
      ).shouldStartPeriodicallyCheckForConfig({ configId: 'configId1' });

      expect(result).toBe(false);
    });

    it('returns false when code flow is in progress', () => {
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('idToken');
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(flowsDataService, 'isCodeFlowInProgress').mockReturnValue(true);
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'some-userdata'
      );

      const result = (
        periodicallyTokenCheckService as any
      ).shouldStartPeriodicallyCheckForConfig({ configId: 'configId1' });

      expect(result).toBe(false);
    });

    it('returns false when there is no userdata from the store', () => {
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('idToken');
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(null);

      const result = (
        periodicallyTokenCheckService as any
      ).shouldStartPeriodicallyCheckForConfig({ configId: 'configId1' });

      expect(result).toBe(false);
    });

    it('returns true when there is userDataFromStore, silentrenew is not running and there is an idtoken', () => {
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('idToken');
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'some-userdata'
      );

      vi.spyOn(
        authStateService,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).mockReturnValue(true);
      vi.spyOn(
        authStateService,
        'hasAccessTokenExpiredIfExpiryExists'
      ).mockReturnValue(true);

      const result = (
        periodicallyTokenCheckService as any
      ).shouldStartPeriodicallyCheckForConfig({ configId: 'configId1' });

      expect(result).toBe(true);
    });

    it('returns false if tokens are not expired', () => {
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('idToken');
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'some-userdata'
      );
      vi.spyOn(
        authStateService,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).mockReturnValue(false);
      vi.spyOn(
        authStateService,
        'hasAccessTokenExpiredIfExpiryExists'
      ).mockReturnValue(false);

      const result = (
        periodicallyTokenCheckService as any
      ).shouldStartPeriodicallyCheckForConfig({ configId: 'configId1' });

      expect(result).toBe(false);
    });

    it('returns true if only the access token is expired', () => {
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('idToken');
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'some-userdata'
      );

      vi.spyOn(
        authStateService,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).mockReturnValue(false);
      vi.spyOn(
        authStateService,
        'hasAccessTokenExpiredIfExpiryExists'
      ).mockReturnValue(true);

      const result = (
        periodicallyTokenCheckService as any
      ).shouldStartPeriodicallyCheckForConfig({ configId: 'configId1' });

      expect(result).toBe(true);
    });
  });
});
