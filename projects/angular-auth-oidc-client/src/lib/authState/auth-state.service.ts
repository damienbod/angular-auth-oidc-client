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

  private get isAuthorized() {
    return !!this.storagePersistenceService.getAccessToken() && !!this.storagePersistenceService.getIdToken();
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

  setUnauthorizedAndFireEvent(): void {
    this.storagePersistenceService.resetAuthStateInStorage();
    this.authorizedInternal$.next(false);
  }

  updateAndPublishAuthState(authorizationResult: AuthorizationResult) {
    this.publicEventsService.fireEvent<AuthorizationResult>(EventTypes.NewAuthorizationResult, authorizationResult);
  }

  setAuthorizationData(accessToken: any, authResult: any) {
    this.loggerService.logDebug(accessToken);
    this.loggerService.logDebug('storing the accessToken');

    this.storagePersistenceService.write('authzData', accessToken);
    this.persistAccessTokenExpirationTime(authResult);
    this.setAuthorizedAndFireEvent();
  }

  getAccessToken(): string {
    if (!this.isAuthorized) {
      return '';
    }

    const token = this.storagePersistenceService.getAccessToken();
    return this.decodeURIComponentSafely(token);
  }

  getIdToken(): string {
    if (!this.isAuthorized) {
      return '';
    }

    const token = this.storagePersistenceService.getIdToken();
    return this.decodeURIComponentSafely(token);
  }

  getRefreshToken(): string {
    if (!this.isAuthorized) {
      return '';
    }

    const token = this.storagePersistenceService.getRefreshToken();
    return this.decodeURIComponentSafely(token);
  }

  areAuthStorageTokensValid() {
    if (!this.isAuthorized) {
      return false;
    }

    if (this.hasIdTokenExpired()) {
      this.loggerService.logDebug('persisted id_token is expired');
      return false;
    }

    if (this.hasAccessTokenExpiredIfExpiryExists()) {
      this.loggerService.logDebug('persisted access_token is expired');
      return false;
    }

    this.loggerService.logDebug('persisted id_token and access token are valid');
    return true;
  }

  hasIdTokenExpired() {
    const tokenToCheck = this.storagePersistenceService.getIdToken();
    const { renewTimeBeforeTokenExpiresInSeconds } = this.configurationProvider.getOpenIDConfiguration();

    const idTokenExpired = this.tokenValidationService.hasIdTokenExpired(tokenToCheck, renewTimeBeforeTokenExpiresInSeconds);

    if (idTokenExpired) {
      this.publicEventsService.fireEvent<boolean>(EventTypes.IdTokenExpired, idTokenExpired);
    }

    return idTokenExpired;
  }

  hasAccessTokenExpiredIfExpiryExists() {
    const { renewTimeBeforeTokenExpiresInSeconds } = this.configurationProvider.getOpenIDConfiguration();
    const accessTokenExpiresIn = this.storagePersistenceService.read('access_token_expires_at');
    const accessTokenHasNotExpired = this.tokenValidationService.validateAccessTokenNotExpired(
      accessTokenExpiresIn,
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

  private persistAccessTokenExpirationTime(authResult: any) {
    if (authResult?.expires_in) {
      const accessTokenExpiryTime = new Date(new Date().toUTCString()).valueOf() + authResult.expires_in * 1000;
      this.storagePersistenceService.write('access_token_expires_at', accessTokenExpiryTime);
    }
  }
}
