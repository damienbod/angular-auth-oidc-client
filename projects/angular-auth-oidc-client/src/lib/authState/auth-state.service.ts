import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { AuthResult } from '../flows/callback-context';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { AuthenticatedResult, ConfigAuthenticatedResult } from './auth-result';

const DEFAULT_AUTHRESULT = { isAuthenticated: false, allConfigsAuthenticated: [] };

@Injectable()
export class AuthStateService {
  private authenticatedInternal$ = new BehaviorSubject<ConfigAuthenticatedResult>(DEFAULT_AUTHRESULT);

  get authenticated$(): Observable<ConfigAuthenticatedResult> {
    return this.authenticatedInternal$.asObservable().pipe(distinctUntilChanged());
  }

  constructor(
    private storagePersistenceService: StoragePersistenceService,
    private loggerService: LoggerService,
    private publicEventsService: PublicEventsService,
    private configurationProvider: ConfigurationProvider,
    private tokenValidationService: TokenValidationService
  ) {}

  setAuthenticatedAndFireEvent(): void {
    const result = this.composeAuthenticatedResult();
    this.authenticatedInternal$.next(result);
  }

  setUnauthenticatedAndFireEvent(configIdToReset: string): void {
    this.storagePersistenceService.resetAuthStateInStorage(configIdToReset);

    const result = this.composeUnAuthenticatedResult();
    this.authenticatedInternal$.next(result);
  }

  updateAndPublishAuthState(authorizationResult: AuthenticatedResult): void {
    this.publicEventsService.fireEvent<AuthenticatedResult>(EventTypes.NewAuthorizationResult, authorizationResult);
  }

  setAuthorizationData(accessToken: string, authResult: AuthResult, configId: string): void {
    this.loggerService.logDebug(configId, `storing the accessToken '${accessToken}'`);

    this.storagePersistenceService.write('authzData', accessToken, configId);
    this.persistAccessTokenExpirationTime(authResult, configId);
    this.setAuthenticatedAndFireEvent();
  }

  getAccessToken(configId: string): string {
    if (!this.isAuthenticated(configId)) {
      return null;
    }

    const token = this.storagePersistenceService.getAccessToken(configId);

    return this.decodeURIComponentSafely(token);
  }

  getIdToken(configId: string): string {
    if (!this.isAuthenticated(configId)) {
      return null;
    }

    const token = this.storagePersistenceService.getIdToken(configId);

    return this.decodeURIComponentSafely(token);
  }

  getRefreshToken(configId: string): string {
    if (!this.isAuthenticated(configId)) {
      return null;
    }

    const token = this.storagePersistenceService.getRefreshToken(configId);

    return this.decodeURIComponentSafely(token);
  }

  getAuthenticationResult(configId?: string): any {
    if (!this.isAuthenticated(configId)) {
      return null;
    }

    return this.storagePersistenceService.getAuthenticationResult(configId);
  }

  areAuthStorageTokensValid(configId: string): boolean {
    if (!this.isAuthenticated(configId)) {
      return false;
    }

    if (this.hasIdTokenExpiredAndRenewCheckIsEnabled(configId)) {
      this.loggerService.logDebug(configId, 'persisted idToken is expired');

      return false;
    }

    if (this.hasAccessTokenExpiredIfExpiryExists(configId)) {
      this.loggerService.logDebug(configId, 'persisted accessToken is expired');

      return false;
    }

    this.loggerService.logDebug(configId, 'persisted idToken and accessToken are valid');

    return true;
  }

  hasIdTokenExpiredAndRenewCheckIsEnabled(configId: string): boolean {
    const {
      renewTimeBeforeTokenExpiresInSeconds,
      enableIdTokenExpiredValidationInRenew,
    } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!enableIdTokenExpiredValidationInRenew) {
      return false;
    }
    const tokenToCheck = this.storagePersistenceService.getIdToken(configId);

    const idTokenExpired = this.tokenValidationService.hasIdTokenExpired(tokenToCheck, configId, renewTimeBeforeTokenExpiresInSeconds);

    if (idTokenExpired) {
      this.publicEventsService.fireEvent<boolean>(EventTypes.IdTokenExpired, idTokenExpired);
    }

    return idTokenExpired;
  }

  hasAccessTokenExpiredIfExpiryExists(configId: string): boolean {
    const { renewTimeBeforeTokenExpiresInSeconds } = this.configurationProvider.getOpenIDConfiguration(configId);
    const accessTokenExpiresIn = this.storagePersistenceService.read('access_token_expires_at', configId);
    const accessTokenHasNotExpired = this.tokenValidationService.validateAccessTokenNotExpired(
      accessTokenExpiresIn,
      configId,
      renewTimeBeforeTokenExpiresInSeconds
    );

    const hasExpired = !accessTokenHasNotExpired;

    if (hasExpired) {
      this.publicEventsService.fireEvent<boolean>(EventTypes.TokenExpired, hasExpired);
    }

    return hasExpired;
  }

  isAuthenticated(configId: string): boolean {
    return !!this.storagePersistenceService.getAccessToken(configId) && !!this.storagePersistenceService.getIdToken(configId);
  }

  private decodeURIComponentSafely(token: string): string {
    if (token) {
      return decodeURIComponent(token);
    } else {
      return '';
    }
  }

  private persistAccessTokenExpirationTime(authResult: any, configId: string): void {
    if (authResult?.expires_in) {
      const accessTokenExpiryTime = new Date(new Date().toUTCString()).valueOf() + authResult.expires_in * 1000;
      this.storagePersistenceService.write('access_token_expires_at', accessTokenExpiryTime, configId);
    }
  }

  private composeAuthenticatedResult(): ConfigAuthenticatedResult {
    if (!this.configurationProvider.hasManyConfigs()) {
      const { configId } = this.configurationProvider.getOpenIDConfiguration();

      return { isAuthenticated: true, allConfigsAuthenticated: [{ configId, isAuthenticated: true }] };
    }

    return this.checkAllConfigsIfTheyAreAuthenticated();
  }

  private composeUnAuthenticatedResult(): ConfigAuthenticatedResult {
    if (!this.configurationProvider.hasManyConfigs()) {
      const { configId } = this.configurationProvider.getOpenIDConfiguration();
      return { isAuthenticated: false, allConfigsAuthenticated: [{ configId, isAuthenticated: false }] };
    }

    return this.checkAllConfigsIfTheyAreAuthenticated();
  }

  private checkAllConfigsIfTheyAreAuthenticated(): ConfigAuthenticatedResult {
    const configs = this.configurationProvider.getAllConfigurations();

    const allConfigsAuthenticated = configs.map(({ configId }) => ({
      configId,
      isAuthenticated: this.isAuthenticated(configId),
    }));

    const isAuthenticated = allConfigsAuthenticated.every((x) => !!x.isAuthenticated);

    return { allConfigsAuthenticated, isAuthenticated };
  }
}
