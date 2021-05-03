import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { ConfigurationProvider } from '../config/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { UserService } from '../userData/user.service';
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
    private storagePersistenceService: StoragePersistenceService
  ) {}

  startTokenValidationPeriodically(repeatAfterSeconds: number, configId: string) {
    const { silentRenew } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!!this.intervalService.runTokenValidationRunning || !silentRenew) {
      return;
    }

    this.loggerService.logDebug(configId, `starting token validation check every ${repeatAfterSeconds}s`);

    const periodicallyCheck$ = this.intervalService.startPeriodicTokenCheck(repeatAfterSeconds).pipe(
      switchMap(() => {
        const idToken = this.authStateService.getIdToken(configId);
        const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning(configId);
        const userDataFromStore = this.userService.getUserDataFromStore(configId);

        this.loggerService.logDebug(
          configId,
          `Checking: silentRenewRunning: ${isSilentRenewRunning} - has idToken: ${!!idToken} - has userData: ${!!userDataFromStore}`
        );

        const shouldBeExecuted = userDataFromStore && !isSilentRenewRunning && idToken;

        if (!shouldBeExecuted) {
          return of(null);
        }

        const idTokenHasExpired = this.authStateService.hasIdTokenExpired(configId);
        const accessTokenHasExpired = this.authStateService.hasAccessTokenExpiredIfExpiryExists(configId);

        if (!idTokenHasExpired && !accessTokenHasExpired) {
          return of(null);
        }

        const config = this.configurationProvider.getOpenIDConfiguration(configId);

        if (!config?.silentRenew) {
          this.resetAuthDataService.resetAuthorizationData(configId);
          return of(null);
        }

        this.loggerService.logDebug(configId, 'starting silent renew...');

        this.flowsDataService.setSilentRenewRunning(configId);

        // Retrieve Dynamically Set Custom Params
        const customParams: { [key: string]: string | number | boolean } = this.storagePersistenceService.read(
          'storageCustomRequestParams',
          configId
        );

        if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(configId)) {
          // Refresh Session using Refresh tokens
          return this.refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(configId, customParams);
        }

        return this.refreshSessionIframeService.refreshSessionWithIframe(configId, customParams);
      })
    );

    this.intervalService.runTokenValidationRunning = periodicallyCheck$
      .pipe(
        catchError((error) => {
          this.flowsDataService.resetSilentRenewRunning(configId);
          return throwError(error);
        })
      )
      .subscribe(
        () => {
          this.loggerService.logDebug(configId, 'silent renew, periodic check finished!');
          if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(configId)) {
            this.flowsDataService.resetSilentRenewRunning(configId);
          }
        },
        (err) => this.loggerService.logError('silent renew failed!', err)
      );
  }
}
