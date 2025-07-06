import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { JwtKeys } from '../../validation/jwtkeys';
import { ValidationResult } from '../../validation/validation-result';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { SigninKeyDataService } from '../signin-key-data.service';

const JWT_KEYS = 'jwtKeys';

@Injectable({ providedIn: 'root' })
export class HistoryJwtKeysCallbackHandlerService {
  private readonly loggerService = inject(LoggerService);
  private readonly authStateService = inject(AuthStateService);
  private readonly flowsDataService = inject(FlowsDataService);
  private readonly signInKeyDataService = inject(SigninKeyDataService);
  private readonly storagePersistenceService = inject(
    StoragePersistenceService
  );
  private readonly resetAuthDataService = inject(ResetAuthDataService);
  private readonly document = inject(DOCUMENT);

  // STEP 3 Code Flow, STEP 2 Implicit Flow, STEP 3 Refresh Token
  callbackHistoryAndResetJwtKeys(
    callbackContext: CallbackContext,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    let toWrite = { ...callbackContext.authResult };

    if (!this.responseHasIdToken(callbackContext)) {
      const existingIdToken = this.storagePersistenceService.getIdToken(config);

      toWrite = {
        ...toWrite,
        id_token: existingIdToken,
      };
    }

    this.storagePersistenceService.write('authnResult', toWrite, config);

    if (
      config.allowUnsafeReuseRefreshToken &&
      callbackContext.authResult?.refresh_token
    ) {
      this.storagePersistenceService.write(
        'reusable_refresh_token',
        callbackContext.authResult.refresh_token,
        config
      );
    }

    if (
      this.historyCleanUpTurnedOn(config) &&
      !callbackContext.isRenewProcess
    ) {
      this.resetBrowserHistory();
    } else {
      this.loggerService.logDebug(config, 'history clean up inactive');
    }

    if (callbackContext.authResult?.error) {
      const errorMessage = `AuthCallback AuthResult came with error: ${callbackContext.authResult.error}`;

      this.loggerService.logDebug(config, errorMessage);
      this.resetAuthDataService.resetAuthorizationData(config, allConfigs);
      this.flowsDataService.setNonce('', config);
      this.handleResultErrorFromCallback(
        callbackContext.authResult,
        callbackContext.isRenewProcess,
        config
      );

      return throwError(() => new Error(errorMessage));
    }

    this.loggerService.logDebug(
      config,
      `AuthResult '${JSON.stringify(callbackContext.authResult, null, 2)}'.
      AuthCallback created, begin token validation`
    );

    return this.signInKeyDataService.getSigningKeys(config).pipe(
      tap((jwtKeys: JwtKeys) => this.storeSigningKeys(jwtKeys, config)),
      catchError((err) => {
        // fallback: try to load jwtKeys from storage
        const storedJwtKeys = this.readSigningKeys(config);

        if (!!storedJwtKeys) {
          this.loggerService.logWarning(
            config,
            `Failed to retrieve signing keys, fallback to stored keys`
          );

          return of(storedJwtKeys);
        }

        return throwError(() => new Error(err));
      }),
      switchMap((jwtKeys) => {
        if (jwtKeys) {
          callbackContext.jwtKeys = jwtKeys;

          return of(callbackContext);
        }

        const errorMessage = `Failed to retrieve signing key`;

        this.loggerService.logWarning(config, errorMessage);

        return throwError(() => new Error(errorMessage));
      }),
      catchError((err) => {
        const errorMessage = `Failed to retrieve signing key with error: ${err}`;

        this.loggerService.logWarning(config, errorMessage);

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  private responseHasIdToken(callbackContext: CallbackContext): boolean {
    return !!callbackContext?.authResult?.id_token;
  }

  private handleResultErrorFromCallback(
    result: unknown,
    isRenewProcess: boolean,
    config: OpenIdConfiguration
  ): void {
    let validationResult = ValidationResult.SecureTokenServerError;

    if (
      result &&
      typeof result === 'object' &&
      'error' in result &&
      (result.error as string) === 'login_required'
    ) {
      validationResult = ValidationResult.LoginRequired;
    }

    this.authStateService.updateAndPublishAuthState({
      isAuthenticated: false,
      validationResult,
      isRenewProcess,
      configId: config.configId,
    });
  }

  private historyCleanUpTurnedOn(config: OpenIdConfiguration): boolean {
    const { historyCleanupOff } = config;

    return !historyCleanupOff;
  }

  private resetBrowserHistory(): void {
    this.document.defaultView?.history.replaceState(
      {},
      this.document.title,
      this.document.defaultView.location.origin +
        this.document.defaultView.location.pathname
    );
  }

  private storeSigningKeys(
    jwtKeys: JwtKeys,
    config: OpenIdConfiguration
  ): void {
    this.storagePersistenceService.write(JWT_KEYS, jwtKeys, config);
  }

  private readSigningKeys(config: OpenIdConfiguration): any {
    return this.storagePersistenceService.read(JWT_KEYS, config);
  }
}
