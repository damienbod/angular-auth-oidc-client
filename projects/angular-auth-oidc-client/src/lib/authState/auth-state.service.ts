import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { AuthorizationResult } from './authorization-result';

@Injectable()
export class AuthStateService {
  private authorizedInternal$ = new BehaviorSubject<boolean>(false);

  get authorized$() {
    return this.authorizedInternal$.asObservable().pipe(distinctUntilChanged());
  }

  constructor(
    private storagePersistenceService: StoragePersistenceService,
    private loggerService: LoggerService,
    private publicEventsService: PublicEventsService,
    private configurationProvider: ConfigurationProvider,
    private tokenValidationService: TokenValidationService
  ) {}

  setAuthorizedAndFireEvent(): void {
    this.authorizedInternal$.next(true);
  }

  setUnauthorizedAndFireEvent(configId: string): void {
    this.storagePersistenceService.resetAuthStateInStorage(configId);
    this.authorizedInternal$.next(false);
  }

  updateAndPublishAuthState(authorizationResult: AuthorizationResult) {
    this.publicEventsService.fireEvent<AuthorizationResult>(EventTypes.NewAuthorizationResult, authorizationResult);
  }

  setAuthorizationData(accessToken: string, authResult: any, configId: string) {
    this.loggerService.logDebug(configId, `storing the accessToken '${accessToken}'`);

    this.storagePersistenceService.write('authzData', accessToken, configId);
    this.persistAccessTokenExpirationTime(authResult, configId);
    this.setAuthorizedAndFireEvent();
  }

  getAccessToken(configId: string): string {
    if (!this.isAuthorized(configId)) {
      return null;
    }

    const token = this.storagePersistenceService.getAccessToken(configId);
    return this.decodeURIComponentSafely(token);
  }

  getIdToken(configId: string): string {
    if (!this.isAuthorized(configId)) {
      return null;
    }

    const token = this.storagePersistenceService.getIdToken(configId);
    return this.decodeURIComponentSafely(token);
  }

  getRefreshToken(configId: string): string {
    if (!this.isAuthorized(configId)) {
      return null;
    }

    const token = this.storagePersistenceService.getRefreshToken(configId);
    return this.decodeURIComponentSafely(token);
  }

  areAuthStorageTokensValid(configId: string) {
    if (!this.isAuthorized(configId)) {
      return false;
    }

    if (this.hasIdTokenExpired(configId)) {
      this.loggerService.logDebug(configId, 'persisted id_token is expired');
      return false;
    }

    if (this.hasAccessTokenExpiredIfExpiryExists(configId)) {
      this.loggerService.logDebug(configId, 'persisted access_token is expired');
      return false;
    }

    this.loggerService.logDebug(configId, 'persisted id_token and access token are valid');
    return true;
  }

  hasIdTokenExpired(configId: string): boolean {
    const tokenToCheck = this.storagePersistenceService.getIdToken(configId);
    const { renewTimeBeforeTokenExpiresInSeconds } = this.configurationProvider.getOpenIDConfiguration(configId);

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

  private decodeURIComponentSafely(token: string) {
    if (token) {
      return decodeURIComponent(token);
    } else {
      return '';
    }
  }

  private persistAccessTokenExpirationTime(authResult: any, configId: string) {
    if (authResult?.expires_in) {
      const accessTokenExpiryTime = new Date(new Date().toUTCString()).valueOf() + authResult.expires_in * 1000;
      this.storagePersistenceService.write('access_token_expires_at', accessTokenExpiryTime, configId);
    }
  }

  private isAuthorized(configId: string): boolean {
    return !!this.storagePersistenceService.getAccessToken(configId) && !!this.storagePersistenceService.getIdToken(configId);
  }
}
