import { Injectable } from '@angular/core';
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

@Injectable()
export class HistoryJwtKeysCallbackHandlerService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly authStateService: AuthStateService,
    private readonly flowsDataService: FlowsDataService,
    private readonly signInKeyDataService: SigninKeyDataService,
    private readonly storagePersistenceService: StoragePersistenceService,
    private readonly resetAuthDataService: ResetAuthDataService
  ) {}

  // STEP 3 Code Flow, STEP 2 Implicit Flow, STEP 3 Refresh Token
  callbackHistoryAndResetJwtKeys(callbackContext: CallbackContext, config: OpenIdConfiguration): Observable<CallbackContext> {
    const { configId } = config;

    this.storagePersistenceService.write('authnResult', callbackContext.authResult, configId);

    if (this.historyCleanUpTurnedOn(config) && !callbackContext.isRenewProcess) {
      this.resetBrowserHistory();
    } else {
      this.loggerService.logDebug(config, 'history clean up inactive');
    }

    if (callbackContext.authResult.error) {
      const errorMessage = `AuthCallback AuthResult came with error: ${callbackContext.authResult.error}`;
      this.loggerService.logDebug(config, errorMessage);
      this.resetAuthDataService.resetAuthorizationData(configId);
      this.flowsDataService.setNonce('', configId);
      this.handleResultErrorFromCallback(callbackContext.authResult, callbackContext.isRenewProcess);

      return throwError(() => new Error(errorMessage));
    }

    this.loggerService.logDebug(
      config,
      `AuthResult '${JSON.stringify(callbackContext.authResult, null, 2)}'.
      AuthCallback created, begin token validation`
    );

    return this.signInKeyDataService.getSigningKeys(configId).pipe(
      tap((jwtKeys: JwtKeys) => this.storeSigningKeys(jwtKeys, configId)),
      catchError((err) => {
        // fallback: try to load jwtKeys from storage
        const storedJwtKeys = this.readSigningKeys(configId);
        if (!!storedJwtKeys) {
          this.loggerService.logWarning(config, `Failed to retrieve signing keys, fallback to stored keys`);

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

  private handleResultErrorFromCallback(result: any, isRenewProcess: boolean): void {
    let validationResult = ValidationResult.SecureTokenServerError;

    if ((result.error as string) === 'login_required') {
      validationResult = ValidationResult.LoginRequired;
    }

    this.authStateService.updateAndPublishAuthState({
      isAuthenticated: false,
      validationResult,
      isRenewProcess,
    });
  }

  private historyCleanUpTurnedOn(config: OpenIdConfiguration): boolean {
    const { historyCleanupOff } = config;

    return !historyCleanupOff;
  }

  private resetBrowserHistory(): void {
    window.history.replaceState({}, window.document.title, window.location.origin + window.location.pathname);
  }

  private storeSigningKeys(jwtKeys: JwtKeys, configId: string): void {
    this.storagePersistenceService.write(JWT_KEYS, jwtKeys, configId);
  }

  private readSigningKeys(configId: string): any {
    return this.storagePersistenceService.read(JWT_KEYS, configId);
  }
}
