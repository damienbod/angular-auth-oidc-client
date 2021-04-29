import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AuthStateService } from '../../authState/auth-state.service';
import { AuthorizedState } from '../../authState/authorized-state';
import { ConfigurationProvider } from '../../config/config.provider';
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
    private readonly configurationProvider: ConfigurationProvider,
    private readonly authStateService: AuthStateService,
    private readonly flowsDataService: FlowsDataService,
    private readonly signInKeyDataService: SigninKeyDataService,
    private readonly storagePersistenceService: StoragePersistenceService,
    private readonly resetAuthDataService: ResetAuthDataService
  ) {}

  // STEP 3 Code Flow, STEP 2 Implicit Flow, STEP 3 Refresh Token
  callbackHistoryAndResetJwtKeys(callbackContext: CallbackContext): Observable<CallbackContext> {
    this.storagePersistenceService.write('authnResult', callbackContext.authResult);

    if (this.historyCleanUpTurnedOn() && !callbackContext.isRenewProcess) {
      this.resetBrowserHistory();
    } else {
      this.loggerService.logDebug('history clean up inactive');
    }

    if (callbackContext.authResult.error) {
      const errorMessage = `authorizedCallbackProcedure came with error: ${callbackContext.authResult.error}`;
      this.loggerService.logDebug(errorMessage);
      this.resetAuthDataService.resetAuthorizationData();
      this.flowsDataService.setNonce('');
      this.handleResultErrorFromCallback(callbackContext.authResult, callbackContext.isRenewProcess);
      return throwError(errorMessage);
    }

    this.loggerService.logDebug(callbackContext.authResult);
    this.loggerService.logDebug('authorizedCallback created, begin token validation');

    return this.signInKeyDataService.getSigningKeys().pipe(
      tap((jwtKeys: JwtKeys) => this.storeSigningKeys(jwtKeys)),
      catchError((err) => {
        // fallback: try to load jwtKeys from storage
        const storedJwtKeys = this.readSigningKeys();
        if (!!storedJwtKeys) {
          this.loggerService.logWarning(`Failed to retrieve signing keys, fallback to stored keys`);
          return of(storedJwtKeys);
        }

        return throwError(err);
      }),
      switchMap((jwtKeys) => {
        if (jwtKeys) {
          callbackContext.jwtKeys = jwtKeys;

          return of(callbackContext);
        }

        const errorMessage = `Failed to retrieve signing key`;
        this.loggerService.logWarning(errorMessage);
        return throwError(errorMessage);
      }),
      catchError((err) => {
        const errorMessage = `Failed to retrieve signing key with error: ${err}`;
        this.loggerService.logWarning(errorMessage);
        return throwError(errorMessage);
      })
    );
  }

  private handleResultErrorFromCallback(result: any, isRenewProcess: boolean) {
    let validationResult = ValidationResult.SecureTokenServerError;

    if ((result.error as string) === 'login_required') {
      validationResult = ValidationResult.LoginRequired;
    }

    this.authStateService.updateAndPublishAuthState({
      authorizationState: AuthorizedState.Unauthorized,
      validationResult,
      isRenewProcess,
    });
  }

  private historyCleanUpTurnedOn() {
    const { historyCleanupOff } = this.configurationProvider.getOpenIDConfiguration();
    return !historyCleanupOff;
  }

  private resetBrowserHistory() {
    window.history.replaceState({}, window.document.title, window.location.origin + window.location.pathname);
  }

  private storeSigningKeys(jwtKeys: JwtKeys) {
    this.storagePersistenceService.write(JWT_KEYS, jwtKeys);
  }

  private readSigningKeys() {
    return this.storagePersistenceService.read(JWT_KEYS);
  }
}
