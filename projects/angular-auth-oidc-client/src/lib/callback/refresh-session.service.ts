import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError, TimeoutError, timer } from 'rxjs';
import { map, mergeMap, retryWhen, switchMap, take, timeout } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
import { LoginResponse } from '../login/login-response';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { UserService } from '../user-data/user.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { ConfigurationService } from './../config/config.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';

export const MAX_RETRY_ATTEMPTS = 3;
@Injectable({ providedIn: 'root' })
export class RefreshSessionService {
  constructor(
    private flowHelper: FlowHelper,
    private flowsDataService: FlowsDataService,
    private loggerService: LoggerService,
    private silentRenewService: SilentRenewService,
    private authStateService: AuthStateService,
    private authWellKnownService: ConfigurationService,
    private refreshSessionIframeService: RefreshSessionIframeService,
    private storagePersistenceService: StoragePersistenceService,
    private refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService,
    private userService: UserService
  ) {}

  userForceRefreshSession(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    extraCustomParams?: { [key: string]: string | number | boolean }
  ): Observable<LoginResponse> {
    this.persistCustomParams(extraCustomParams, config);

    return this.forceRefreshSession(config, allConfigs, extraCustomParams);
  }

  forceRefreshSession(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    extraCustomParams?: { [key: string]: string | number | boolean }
  ): Observable<LoginResponse> {
    const { customParamsRefreshTokenRequest, configId } = config;
    const mergedParams = { ...customParamsRefreshTokenRequest, ...extraCustomParams };

    if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config)) {
      return this.startRefreshSession(config, allConfigs, mergedParams).pipe(
        map(() => {
          const isAuthenticated = this.authStateService.areAuthStorageTokensValid(config);
          if (isAuthenticated) {
            return {
              idToken: this.authStateService.getIdToken(config),
              accessToken: this.authStateService.getAccessToken(config),
              userData: this.userService.getUserDataFromStore(config),
              isAuthenticated,
              configId,
            } as LoginResponse;
          }

          return null;
        })
      );
    }

    const { silentRenewTimeoutInSeconds } = config;
    const timeOutTime = silentRenewTimeoutInSeconds * 1000;

    return forkJoin([
      this.startRefreshSession(config, allConfigs, extraCustomParams),
      this.silentRenewService.refreshSessionWithIFrameCompleted$.pipe(take(1)),
    ]).pipe(
      timeout(timeOutTime),
      retryWhen(this.timeoutRetryStrategy.bind(this)),
      map(([_, callbackContext]) => {
        const isAuthenticated = this.authStateService.areAuthStorageTokensValid(config);
        if (isAuthenticated) {
          return {
            idToken: callbackContext?.authResult?.id_token,
            accessToken: callbackContext?.authResult?.access_token,
            userData: this.userService.getUserDataFromStore(config),
            isAuthenticated,
            configId,
          };
        }

        return null;
      })
    );
  }

  private persistCustomParams(extraCustomParams: { [key: string]: string | number | boolean }, config: OpenIdConfiguration): void {
    const { useRefreshToken } = config;

    if (extraCustomParams) {
      if (useRefreshToken) {
        this.storagePersistenceService.write('storageCustomParamsRefresh', extraCustomParams, config);
      } else {
        this.storagePersistenceService.write('storageCustomParamsAuthRequest', extraCustomParams, config);
      }
    }
  }

  private startRefreshSession(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    extraCustomParams?: { [key: string]: string | number | boolean }
  ): Observable<boolean | CallbackContext | null> {
    const { configId, authWellknownEndpointUrl } = config;

    const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning(config);
    this.loggerService.logDebug(config, `Checking: silentRenewRunning: ${isSilentRenewRunning}`);
    const shouldBeExecuted = !isSilentRenewRunning;

    if (!shouldBeExecuted) {
      return of(null);
    }

    if (!authWellknownEndpointUrl) {
      this.loggerService.logError(config, 'no authWellKnownEndpoint given!');

      return of(null);
    }

    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointUrl, config).pipe(
      switchMap(() => {
        this.flowsDataService.setSilentRenewRunning(config);

        if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(config)) {
          // Refresh Session using Refresh tokens
          return this.refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(config, allConfigs, extraCustomParams);
        }

        return this.refreshSessionIframeService.refreshSessionWithIframe(config, allConfigs, extraCustomParams);
      })
    );
  }

  private timeoutRetryStrategy(errorAttempts: Observable<any>, config: OpenIdConfiguration): Observable<number> {
    return errorAttempts.pipe(
      mergeMap((error, index) => {
        const scalingDuration = 1000;
        const currentAttempt = index + 1;

        if (!(error instanceof TimeoutError) || currentAttempt > MAX_RETRY_ATTEMPTS) {
          return throwError(() => new Error(error));
        }

        this.loggerService.logDebug(config, `forceRefreshSession timeout. Attempt #${currentAttempt}`);

        this.flowsDataService.resetSilentRenewRunning(config);

        return timer(currentAttempt * scalingDuration);
      })
    );
  }
}
