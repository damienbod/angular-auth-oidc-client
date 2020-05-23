import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConfigurationProvider } from '../config/config.provider';
import { CallbackContext } from '../flows/callback-context';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { AuthorizationResult } from './authorization-result';

@Injectable()
export class AuthStateService {
    private authorizedInternal$ = new BehaviorSubject<boolean>(false);

    get authorized$() {
        return this.authorizedInternal$.asObservable();
    }

    private get isAuthorized() {
        return !!this.storagePersistanceService.getAccessToken() && !!this.storagePersistanceService.getIdToken();
    }

    constructor(
        private storagePersistanceService: StoragePersistanceService,
        private loggerService: LoggerService,
        private publicEventsService: PublicEventsService,
        private configurationProvider: ConfigurationProvider,
        private tokenValidationService: TokenValidationService
    ) {}

    setAuthorizedAndFireEvent(): void {
        this.authorizedInternal$.next(true);
    }

    setUnauthorizedAndFireEvent(): void {
        this.storagePersistanceService.resetAuthStateInStorage();
        this.authorizedInternal$.next(false);
    }

    updateAndPublishAuthState(authorizationResult: AuthorizationResult) {
        this.publicEventsService.fireEvent<AuthorizationResult>(EventTypes.NewAuthorizationResult, authorizationResult);
    }

    setAuthorizationData(accessToken: any, callbackContext: CallbackContext) {
        this.loggerService.logDebug(accessToken);
        this.loggerService.logDebug('storing the accessToken');

        this.storagePersistanceService.write('authzData', accessToken);
        this.persistAccessTokenExpirationTime(callbackContext.authResult);
        this.setAuthorizedAndFireEvent();
    }

    getAccessToken(): string {
        if (!this.isAuthorized) {
            return '';
        }

        const token = this.storagePersistanceService.getAccessToken();
        return decodeURIComponent(token);
    }

    getIdToken(): string {
        if (!this.isAuthorized) {
            return '';
        }

        const token = this.storagePersistanceService.getIdToken();
        return decodeURIComponent(token);
    }

    getRefreshToken(): string {
        if (!this.isAuthorized) {
            return '';
        }

        const token = this.storagePersistanceService.getRefreshToken();
        return decodeURIComponent(token);
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
        const tokenToCheck = this.storagePersistanceService.getIdToken();
        const idTokenExpired = this.tokenValidationService.hasIdTokenExpired(
            tokenToCheck,
            this.configurationProvider.openIDConfiguration.renewTimeBeforeTokenExpiresInSeconds
        );

        if (idTokenExpired) {
            this.publicEventsService.fireEvent<boolean>(EventTypes.IdTokenExpired, idTokenExpired);
        }

        return idTokenExpired;
    }

    hasAccessTokenExpiredIfExpiryExists() {
        const accessTokenExpiresIn = this.storagePersistanceService.read('access_token_expires_at');
        const accessTokenHasNotExpired = this.tokenValidationService.validateAccessTokenNotExpired(
            accessTokenExpiresIn,
            this.configurationProvider.openIDConfiguration.renewTimeBeforeTokenExpiresInSeconds
        );

        const hasExpired = !accessTokenHasNotExpired;

        if (hasExpired) {
            this.publicEventsService.fireEvent<boolean>(EventTypes.TokenExpired, hasExpired);
        }

        return hasExpired;
    }

    private persistAccessTokenExpirationTime(authResult: any) {
        if (authResult?.expires_in) {
            const accessTokenExpiryTime = new Date().valueOf() + authResult.expires_in * 1000;
            this.storagePersistanceService.write('access_token_expires_at', accessTokenExpiryTime);
        }
    }
}
