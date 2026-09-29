import { DOCUMENT, inject, Injectable } from '@angular/core';
import { defer, Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { AuthStateService } from '../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';
import { createRenewCallbackContext } from '../flows/callback-context.helper';
import { FlowsService } from '../flows/flows.service';
import { isNetworkError } from '../flows/callback-handling/error-helper';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/logger.service';
import { ValidationResult } from '../validation/validation-result';
import { IntervalService } from './interval.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionRefreshTokenService {
  private readonly loggerService = inject(LoggerService);
  private readonly resetAuthDataService = inject(ResetAuthDataService);
  private readonly flowsService = inject(FlowsService);
  private readonly intervalService = inject(IntervalService);
  private readonly authStateService = inject(AuthStateService);
  private readonly document = inject(DOCUMENT);

  refreshSessionWithRefreshTokens(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    this.loggerService.logDebug(config, 'BEGIN refresh session Authorize');
    let refreshTokenFailedPermanently = false;
    const locks = this.document.defaultView?.navigator?.locks;
    const refresh$ =
      config.useRefreshTokenLock && locks
        ? this.refreshWithLock(locks, config, allConfigs, customParamsRefresh)
        : this.processRefreshToken(config, allConfigs, customParamsRefresh);

    return refresh$.pipe(
      catchError((error) => {
        if (isNetworkError(error) || error instanceof TimeoutError) {
          return throwError(() => error);
        }

        this.resetAuthDataService.resetAuthorizationData(config, allConfigs);
        refreshTokenFailedPermanently = true;

        return throwError(() => new Error(error));
      }),
      finalize(
        () =>
          refreshTokenFailedPermanently &&
          this.intervalService.stopPeriodicTokenCheck()
      )
    );
  }

  private refreshWithLock(
    locks: LockManager,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    const lockName = `angular-auth-oidc-client-refresh-token-${config.configId}`;

    return defer(async (): Promise<CallbackContext> => {
      const accessTokenBeforeLock =
        this.authStateService.getAccessToken(config);

      return locks.request(lockName, async (): Promise<CallbackContext> => {
        const currentAccessToken = this.authStateService.getAccessToken(config);
        const wasRefreshedInAnotherTab =
          !!currentAccessToken &&
          currentAccessToken !== accessTokenBeforeLock &&
          this.authStateService.areAuthStorageTokensValid(config);

        if (wasRefreshedInAnotherTab) {
          this.loggerService.logDebug(
            config,
            'access token was already refreshed in another tab, reusing the stored tokens'
          );

          this.authStateService.setAuthenticatedAndFireEvent(allConfigs);
          this.authStateService.updateAndPublishAuthState({
            isAuthenticated: true,
            validationResult: ValidationResult.Ok,
            isRenewProcess: true,
            configId: config.configId,
          });

          return createRenewCallbackContext(
            this.authStateService.getRefreshToken(config),
            this.authStateService.getIdToken(config),
            {
              authResult: this.authStateService.getAuthenticationResult(config),
            }
          );
        }

        return new Promise<CallbackContext>((resolve, reject) => {
          this.processRefreshToken(
            config,
            allConfigs,
            customParamsRefresh
          ).subscribe({ next: resolve, error: reject });
        });
      });
    });
  }

  private processRefreshToken(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    return this.flowsService
      .processRefreshToken(config, allConfigs, customParamsRefresh)
      .pipe(timeout((config.silentRenewTimeoutInSeconds ?? 20) * 1000));
  }
}
