import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConfigurationProvider } from '../config';
import { EventsService, EventTypes } from '../events';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage';
import { TokenValidationService } from '../validation/token-validation.service';
import { AuthorizationResult } from './authorization-result';
import { AuthorizedState } from './authorized-state';

@Injectable()
export class AuthStateService {
    // event which contains the state
    private authorizedInternal$ = new BehaviorSubject<boolean>(false);
    private authState = AuthorizedState.Unknown;

    get authorized$() {
        return this.authorizedInternal$.asObservable();
    }

    constructor(
        private storagePersistanceService: StoragePersistanceService,
        private loggerService: LoggerService,
        private eventsService: EventsService,
        private readonly configurationProvider: ConfigurationProvider,
        private tokenValidationService: TokenValidationService
    ) {}

    setAuthorizedAndFireEvent(): void {
        // set the correct values in storage
        this.authState = AuthorizedState.Authorized;
        this.persistAuthStateInStorage(this.authState);
        this.authorizedInternal$.next(true);
    }

    setUnauthorizedAndFireEvent(): void {
        // set the correct values in storage
        this.authState = AuthorizedState.Unauthorized;
        this.storagePersistanceService.resetAuthStateInStorage();
        this.authorizedInternal$.next(false);
    }

    initStateFromStorage(): void {
        const currentAuthorizedState = this.getCurrentlyPersistedAuthState();
        if (currentAuthorizedState === AuthorizedState.Authorized) {
            this.authState = AuthorizedState.Authorized;
        } else {
            this.authState = AuthorizedState.Unknown;
        }
    }

    updateAndPublishAuthState(authorizationResult: AuthorizationResult) {
        this.eventsService.fireEvent<AuthorizationResult>(EventTypes.NewAuthorizationResult, authorizationResult);
    }

    setAuthorizationData(accessToken: any, idToken: any) {
        this.loggerService.logDebug(accessToken);
        this.loggerService.logDebug(idToken);
        this.loggerService.logDebug('storing to storage, getting the roles');

        this.storagePersistanceService.accessToken = accessToken;
        this.storagePersistanceService.idToken = idToken;

        this.setAuthorizedAndFireEvent();
    }

    getAccessToken(): string {
        if (!(this.authState === AuthorizedState.Authorized)) {
            return '';
        }

        const token = this.storagePersistanceService.getAccessToken();
        return decodeURIComponent(token);
    }

    getIdToken(): string {
        if (!(this.authState === AuthorizedState.Authorized)) {
            return '';
        }

        const token = this.storagePersistanceService.getIdToken();
        return decodeURIComponent(token);
    }

    getRefreshToken(): string {
        if (!(this.authState === AuthorizedState.Authorized)) {
            return '';
        }

        const token = this.storagePersistanceService.getRefreshToken();
        return decodeURIComponent(token);
    }

    isAuthStorageTokenValid() {
        const currentAuthState = this.getCurrentlyPersistedAuthState();

        if (currentAuthState !== AuthorizedState.Authorized) {
            return false;
        }

        this.loggerService.logDebug(`authorizedState in storage is ${currentAuthState}`);

        if (this.hasIdTokenExpired()) {
            this.loggerService.logDebug('persisted token is expired');
            return false;
        } else {
            this.loggerService.logDebug('persisted token is valid');
            return true;
        }
    }

    setAuthResultInStorage(authResult: any) {
        this.storagePersistanceService.authResult = authResult;
    }

    hasIdTokenExpired() {
        const tokenToCheck = this.storagePersistanceService.idToken || this.storagePersistanceService.accessToken;
        const tokenIsExpired = this.tokenValidationService.hasIdTokenExpired(
            tokenToCheck,
            this.configurationProvider.openIDConfiguration.silentRenewOffsetInSeconds
        );
        return tokenIsExpired;
    }

    hasAccessTokenExpiredIfExpiryExists() {
        const accessTokenExpiresIn = this.storagePersistanceService.accessTokenExpiresIn;
        const accessTokenHasExpired = this.tokenValidationService.validateAccessTokenNotExpired(accessTokenExpiresIn);
        return accessTokenHasExpired;
    }

    private getCurrentlyPersistedAuthState() {
        return this.storagePersistanceService.authorizedState;
    }

    private persistAuthStateInStorage(authState: AuthorizedState) {
        this.storagePersistanceService.authorizedState = authState;
    }
}
