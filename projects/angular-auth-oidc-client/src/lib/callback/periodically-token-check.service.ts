import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { UserService } from '../user-data/user.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { IntervalService } from './interval.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';

@Injectable({ providedIn: 'root' })
export class PeriodicallyTokenCheckService {
  constructor(
    private resetAuthDataService: ResetAuthDataService,
    private flowHelper: FlowHelper,
    private configurationProvider: ConfigurationProvider,
    private flowsDataService: FlowsDataService,
    private loggerService: LoggerService,
    private userService: UserService,
    private authStateService: AuthStateService,
    private refreshSessionIframeService: RefreshSessionIframeService,
    private refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService,
    private intervalService: IntervalService,
    private storagePersistenceService: StoragePersistenceService,
    private publicEventsService: PublicEventsService
  ) {}

  startTokenValidationPeriodically(): void {
    const configsWithSilentRenewEnabled = this.getConfigsWithSilentRenewEnabled();
    if (configsWithSilentRenewEnabled.length <= 0) {
      return;
    }

    const refreshTimeInSeconds = this.getSmallestRefreshTimeFromConfigs(configsWithSilentRenewEnabled);

    if (!!this.intervalService.runTokenValidationRunning) {
      return;
    }

    // START PERIODICALLY CHECK ONCE AND CHECK EACH CONFIG WHICH HAS IT ENABLED
    const periodicallyCheck$ = this.intervalService.startPeriodicTokenCheck(refreshTimeInSeconds).pipe(
      switchMap(() => {
        const objectWithConfigIdsAndRefreshEvent = {};
        configsWithSilentRenewEnabled.forEach(({ configId }) => {
          objectWithConfigIdsAndRefreshEvent[configId] = this.getRefreshEvent(configId);
        });

        return forkJoin(objectWithConfigIdsAndRefreshEvent);
      })
    );

    this.intervalService.runTokenValidationRunning = periodicallyCheck$.subscribe((objectWithConfigIds) => {
      for (const [key, _] of Object.entries(objectWithConfigIds)) {
        this.loggerService.logDebug(key, 'silent renew, periodic check finished!');

        if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(key)) {
          this.flowsDataService.resetSilentRenewRunning(key);
        }
      }
    });
  }

  private getRefreshEvent(configId: string): Observable<any> {
    const shouldStartRefreshEvent = this.shouldStartPeriodicallyCheckForConfig(configId);

    if (!shouldStartRefreshEvent) {
      return of(null);
    }

    const refreshEvent$ = this.createRefreshEventForConfig(configId);

    this.publicEventsService.fireEvent(EventTypes.SilentRenewStarted);

    const refreshEventWithErrorHandler$ = refreshEvent$.pipe(
      catchError((error) => {
        this.loggerService.logError(configId, 'silent renew failed!', error);
        this.flowsDataService.resetSilentRenewRunning(configId);

        return throwError(error);
      })
    );

    return refreshEventWithErrorHandler$;
  }

  private getSmallestRefreshTimeFromConfigs(configsWithSilentRenewEnabled: OpenIdConfiguration[]): number {
    const result = configsWithSilentRenewEnabled.reduce((prev, curr) =>
      prev.tokenRefreshInSeconds < curr.tokenRefreshInSeconds ? prev : curr
    );

    return result.tokenRefreshInSeconds;
  }

  private getConfigsWithSilentRenewEnabled(): OpenIdConfiguration[] {
    return this.configurationProvider.getAllConfigurations().filter((x) => x.silentRenew);
  }

  private createRefreshEventForConfig(configId: string): Observable<any> {
    this.loggerService.logDebug(configId, 'starting silent renew...');

    const config = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!config?.silentRenew) {
      this.resetAuthDataService.resetAuthorizationData(configId);

      return of(null);
    }

    this.flowsDataService.setSilentRenewRunning(configId);

    if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(configId)) {
      // Retrieve Dynamically Set Custom Params for refresh body
      const customParamsRefresh: { [key: string]: string | number | boolean } =
        this.storagePersistenceService.read('storageCustomParamsRefresh', configId) || {};

      const { customParamsRefreshTokenRequest } = this.configurationProvider.getOpenIDConfiguration(configId);

      const mergedParams = { ...customParamsRefreshTokenRequest, ...customParamsRefresh };

      // Refresh Session using Refresh tokens
      return this.refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(configId, mergedParams);
    }

    // Retrieve Dynamically Set Custom Params
    const customParams: { [key: string]: string | number | boolean } = this.storagePersistenceService.read(
      'storageCustomParamsAuthRequest',
      configId
    );

    return this.refreshSessionIframeService.refreshSessionWithIframe(configId, customParams);
  }

  private shouldStartPeriodicallyCheckForConfig(configId: string): boolean {
    const idToken = this.authStateService.getIdToken(configId);
    const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning(configId);
    const userDataFromStore = this.userService.getUserDataFromStore(configId);

    this.loggerService.logDebug(
      configId,
      `Checking: silentRenewRunning: ${isSilentRenewRunning} - has idToken: ${!!idToken} - has userData: ${!!userDataFromStore}`
    );

    const shouldBeExecuted = !!userDataFromStore && !isSilentRenewRunning && !!idToken;

    if (!shouldBeExecuted) {
      return false;
    }

    const idTokenStillValid = this.authStateService.hasIdTokenExpiredAndRenewCheckIsEnabled(configId);
    const accessTokenHasExpired = this.authStateService.hasAccessTokenExpiredIfExpiryExists(configId);

    if (!idTokenStillValid && !accessTokenHasExpired) {
      return false;
    }

    return true;
  }
}
