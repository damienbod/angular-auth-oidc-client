import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ConfigurationService } from '../config/config.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';
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
    private readonly resetAuthDataService: ResetAuthDataService,
    private readonly flowHelper: FlowHelper,
    private readonly flowsDataService: FlowsDataService,
    private readonly loggerService: LoggerService,
    private readonly userService: UserService,
    private readonly authStateService: AuthStateService,
    private readonly refreshSessionIframeService: RefreshSessionIframeService,
    private readonly refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService,
    private intervalService: IntervalService,
    private readonly storagePersistenceService: StoragePersistenceService,
    private readonly publicEventsService: PublicEventsService,
    private readonly configurationService: ConfigurationService
  ) {}

  startTokenValidationPeriodically(allConfigs: OpenIdConfiguration[], currentConfig: OpenIdConfiguration): void {
    const configsWithSilentRenewEnabled = this.getConfigsWithSilentRenewEnabled(allConfigs);

    if (configsWithSilentRenewEnabled.length <= 0) {
      return;
    }

    if (this.intervalService.isTokenValidationRunning()) {
      return;
    }

    const refreshTimeInSeconds = this.getSmallestRefreshTimeFromConfigs(configsWithSilentRenewEnabled);
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
      .pipe(catchError((error) => throwError(() => new Error(error))))
      .subscribe({
        next: (objectWithConfigIds) => {
          for (const [configId, _] of Object.entries(objectWithConfigIds)) {
            this.configurationService.getOpenIDConfiguration(configId).subscribe((config) => {
              this.loggerService.logDebug(config, 'silent renew, periodic check finished!');

              if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config)) {
                this.flowsDataService.resetSilentRenewRunning(config);
              }
            });
          }
        },
        error: (error) => {
          this.loggerService.logError(currentConfig, 'silent renew failed!', error);
        },
      });
  }

  private getRefreshEvent(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): Observable<boolean | CallbackContext> {
    const shouldStartRefreshEvent = this.shouldStartPeriodicallyCheckForConfig(config);

    if (!shouldStartRefreshEvent) {
      return of(null);
    }

    const refreshEvent$ = this.createRefreshEventForConfig(config, allConfigs);

    this.publicEventsService.fireEvent(EventTypes.SilentRenewStarted);

    return refreshEvent$.pipe(
      catchError((error) => {
        this.loggerService.logError(config, 'silent renew failed!', error);
        this.publicEventsService.fireEvent(EventTypes.SilentRenewFailed, error);
        this.flowsDataService.resetSilentRenewRunning(config);

        return throwError(() => new Error(error));
      })
    );
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

  private createRefreshEventForConfig(
    configuration: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<boolean | CallbackContext> {
    this.loggerService.logDebug(configuration, 'starting silent renew...');

    return this.configurationService.getOpenIDConfiguration(configuration.configId).pipe(
      switchMap((config) => {
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
      })
    );
  }

  private shouldStartPeriodicallyCheckForConfig(config: OpenIdConfiguration): boolean {
    const idToken = this.authStateService.getIdToken(config);
    const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning(config);
    const isCodeFlowInProgress = this.flowsDataService.isCodeFlowInProgress(config);
    const userDataFromStore = this.userService.getUserDataFromStore(config);

    this.loggerService.logDebug(
      config,
      `Checking: silentRenewRunning: ${isSilentRenewRunning}, isCodeFlowInProgress: ${isCodeFlowInProgress} - has idToken: ${!!idToken} - has userData: ${!!userDataFromStore}`
    );

    const shouldBeExecuted = !!userDataFromStore && !isSilentRenewRunning && !!idToken && !isCodeFlowInProgress;

    if (!shouldBeExecuted) {
      return false;
    }

    return this.authStateService.hasAccessTokenExpiredIfExpiryExists(config);
  }
}
