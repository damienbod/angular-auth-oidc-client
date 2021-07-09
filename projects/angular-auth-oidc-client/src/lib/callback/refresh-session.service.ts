import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError, TimeoutError, timer } from 'rxjs';
import { map, mergeMap, retryWhen, switchMap, take, timeout } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { AuthWellKnownService } from '../config/auth-well-known/auth-well-known.service';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
import { LoginResponse } from '../login/login-response';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { UserService } from '../user-data/user.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';

export const MAX_RETRY_ATTEMPTS = 3;
@Injectable({ providedIn: 'root' })
export class RefreshSessionService {
  constructor(
    private flowHelper: FlowHelper,
    private configurationProvider: ConfigurationProvider,
    private flowsDataService: FlowsDataService,
    private loggerService: LoggerService,
    private silentRenewService: SilentRenewService,
    private authStateService: AuthStateService,
    private authWellKnownService: AuthWellKnownService,
    private refreshSessionIframeService: RefreshSessionIframeService,
    private storagePersistenceService: StoragePersistenceService,
    private refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService,
    private userService: UserService
  ) {}

  userForceRefreshSession(configId: string, extraCustomParams?: { [key: string]: string | number | boolean }): Observable<LoginResponse> {
    this.persistCustomParams(extraCustomParams, configId);

    return this.forceRefreshSession(configId, extraCustomParams);
  }

  forceRefreshSession(configId: string, extraCustomParams?: { [key: string]: string | number | boolean }): Observable<LoginResponse> {
    const { customParamsRefreshTokenRequest } = this.configurationProvider.getOpenIDConfiguration();

    const mergedParams = { ...customParamsRefreshTokenRequest, ...extraCustomParams };

    if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(configId)) {
      return this.startRefreshSession(configId, mergedParams).pipe(
        map(() => {
          const isAuthenticated = this.authStateService.areAuthStorageTokensValid(configId);
          if (isAuthenticated) {
            return {
              idToken: this.authStateService.getIdToken(configId),
              accessToken: this.authStateService.getAccessToken(configId),
              userData: this.userService.getUserDataFromStore(configId),
              isAuthenticated,
              configId,
            } as LoginResponse;
          }

          return null;
        })
      );
    }

    const { silentRenewTimeoutInSeconds } = this.configurationProvider.getOpenIDConfiguration(configId);
    const timeOutTime = silentRenewTimeoutInSeconds * 1000;

    return forkJoin([
      this.startRefreshSession(configId, extraCustomParams),
      this.silentRenewService.refreshSessionWithIFrameCompleted$.pipe(take(1)),
    ]).pipe(
      timeout(timeOutTime),
      retryWhen(this.timeoutRetryStrategy.bind(this)),
      map(([_, callbackContext]) => {
        const isAuthenticated = this.authStateService.areAuthStorageTokensValid(configId);
        if (isAuthenticated) {
          return {
            idToken: callbackContext?.authResult?.id_token,
            accessToken: callbackContext?.authResult?.access_token,
            userData: this.userService.getUserDataFromStore(configId),
            isAuthenticated,
            configId,
          };
        }

        return null;
      })
    );
  }

  private persistCustomParams(extraCustomParams: { [key: string]: string | number | boolean }, configId: string): void {
    const { useRefreshToken } = this.configurationProvider.getOpenIDConfiguration();

    if (extraCustomParams) {
      if (useRefreshToken) {
        this.storagePersistenceService.write('storageCustomParamsRefresh', extraCustomParams, configId);
      } else {
        this.storagePersistenceService.write('storageCustomParamsAuthRequest', extraCustomParams, configId);
      }
    }
  }

  private startRefreshSession(
    configId: string,
    extraCustomParams?: { [key: string]: string | number | boolean }
  ): Observable<boolean | CallbackContext | null> {
    const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning(configId);
    this.loggerService.logDebug(configId, `Checking: silentRenewRunning: ${isSilentRenewRunning}`);
    const shouldBeExecuted = !isSilentRenewRunning;

    if (!shouldBeExecuted) {
      return of(null);
    }

    const { authWellknownEndpointUrl } = this.configurationProvider.getOpenIDConfiguration(configId) || {};

    if (!authWellknownEndpointUrl) {
      this.loggerService.logError(configId, 'no authWellKnownEndpoint given!');

      return of(null);
    }

    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointUrl, configId).pipe(
      switchMap(() => {
        this.flowsDataService.setSilentRenewRunning(configId);

        if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens(configId)) {
          // Refresh Session using Refresh tokens
          return this.refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(configId, extraCustomParams);
        }

        return this.refreshSessionIframeService.refreshSessionWithIframe(configId, extraCustomParams);
      })
    );
  }

  private timeoutRetryStrategy(errorAttempts: Observable<any>, configId: string): Observable<number> {
    return errorAttempts.pipe(
      mergeMap((error, index) => {
        const scalingDuration = 1000;
        const currentAttempt = index + 1;

        if (!(error instanceof TimeoutError) || currentAttempt > MAX_RETRY_ATTEMPTS) {
          return throwError(error);
        }

        this.loggerService.logDebug(configId, `forceRefreshSession timeout. Attempt #${currentAttempt}`);

        this.flowsDataService.resetSilentRenewRunning(configId);

        return timer(currentAttempt * scalingDuration);
      })
    );
  }
}
