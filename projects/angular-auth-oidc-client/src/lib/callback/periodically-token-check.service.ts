import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationService } from '../config/config.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
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
    private flowsDataService: FlowsDataService,
    private loggerService: LoggerService,
    private userService: UserService,
    private authStateService: AuthStateService,
    private refreshSessionIframeService: RefreshSessionIframeService,
    private refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService,
    private intervalService: IntervalService,
    private storagePersistenceService: StoragePersistenceService,
    private publicEventsService: PublicEventsService,
    private configurationService: ConfigurationService
  ) {}

  startTokenValidationPeriodically(allConfigs: OpenIdConfiguration[], currentConfig: OpenIdConfiguration): void {
    const configsWithSilentRenewEnabled = this.getConfigsWithSilentRenewEnabled(allConfigs);
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
        configsWithSilentRenewEnabled.forEach((config) => {
          objectWithConfigIdsAndRefreshEvent[config.configId] = this.getRefreshEvent(config, allConfigs);
        });

        return forkJoin(objectWithConfigIdsAndRefreshEvent);
      })
    );

    this.intervalService.runTokenValidationRunning = periodicallyCheck$
      .pipe(
        map((objectWithConfigIds) =>
          Object.keys(objectWithConfigIds).map((configId) => this.configurationService.getOpenIDConfiguration(configId))
        ),
        switchMap((configIds) => forkJoin([...configIds]))
      )
      .subscribe((configs) => {
        for (const config of configs) {
          this.loggerService.logDebug(currentConfig, 'silent renew, periodic check finished!');

          if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(currentConfig)) {
            this.flowsDataService.resetSilentRenewRunning(config);
          }
        }
      });
  }

  private getRefreshEvent(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): Observable<any> {
    const shouldStartRefreshEvent = this.shouldStartPeriodicallyCheckForConfig(config);

    if (!shouldStartRefreshEvent) {
      return of(null);
    }

    const refreshEvent$ = this.createRefreshEventForConfig(config, allConfigs);

    this.publicEventsService.fireEvent(EventTypes.SilentRenewStarted);

    const refreshEventWithErrorHandler$ = refreshEvent$.pipe(
      catchError((error) => {
        this.loggerService.logError(config, 'silent renew failed!', error);
        this.flowsDataService.resetSilentRenewRunning(config);

        return throwError(() => new Error(error));
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

  private getConfigsWithSilentRenewEnabled(allConfigs: OpenIdConfiguration[]): OpenIdConfiguration[] {
    return allConfigs.filter((x) => x.silentRenew);
  }

  private createRefreshEventForConfig(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): Observable<any> {
    const { configId } = config;

    this.loggerService.logDebug(config, 'starting silent renew...');

    if (!config?.silentRenew) {
      this.resetAuthDataService.resetAuthorizationData(config, allConfigs);

      return of(null);
    }

    this.flowsDataService.setSilentRenewRunning(config);

    if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config)) {
      // Retrieve Dynamically Set Custom Params for refresh body
      const customParamsRefresh: { [key: string]: string | number | boolean } =
        this.storagePersistenceService.read('storageCustomParamsRefresh', config) || {};

      const { customParamsRefreshTokenRequest } = config;

      const mergedParams = { ...customParamsRefreshTokenRequest, ...customParamsRefresh };

      // Refresh Session using Refresh tokens
      return this.refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(config, allConfigs, mergedParams);
    }

    // Retrieve Dynamically Set Custom Params
    const customParams: { [key: string]: string | number | boolean } = this.storagePersistenceService.read(
      'storageCustomParamsAuthRequest',
      config
    );

    return this.refreshSessionIframeService.refreshSessionWithIframe(config, allConfigs, customParams);
  }

  private shouldStartPeriodicallyCheckForConfig(config: OpenIdConfiguration): boolean {
    const idToken = this.authStateService.getIdToken(config);
    const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning(config);
    const userDataFromStore = this.userService.getUserDataFromStore(config);

    this.loggerService.logDebug(
      config,
      `Checking: silentRenewRunning: ${isSilentRenewRunning} - has idToken: ${!!idToken} - has userData: ${!!userDataFromStore}`
    );

    const shouldBeExecuted = !!userDataFromStore && !isSilentRenewRunning && !!idToken;

    if (!shouldBeExecuted) {
      return false;
    }

    const idTokenStillValid = this.authStateService.hasIdTokenExpiredAndRenewCheckIsEnabled(config);
    const accessTokenHasExpired = this.authStateService.hasAccessTokenExpiredIfExpiryExists(config);

    if (!idTokenStillValid && !accessTokenHasExpired) {
      return false;
    }

    return true;
  }
}
