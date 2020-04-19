import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConfigurationProvider } from '../config';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage';
import { TokenValidationService } from '../validation/token-validation.service';
import { AuthorizedState } from './authorized-state';

@Injectable()
export class AuthStateService {
    // event which contains the state
    private authStateInternal$ = new BehaviorSubject<any>(null);
    private authorizedInternal$ = new BehaviorSubject<boolean>(null);
    private authState = AuthorizedState.Unknown;

    get authState$() {
        return this.authStateInternal$.asObservable();
    }

    get authorized$() {
        return this.authorizedInternal$.asObservable();
    }

    constructor(
        private storagePersistanceService: StoragePersistanceService,
        private loggerService: LoggerService,
        private readonly configurationProvider: ConfigurationProvider,
        private tokenValidationService: TokenValidationService
    ) {}

    private resetAuthorizationState(): void {
        this.storagePersistanceService.resetAuthStateInStorage();
    }

    setAuthorized(): void {
        // set the correct values in storage
        this.authState = AuthorizedState.Authorized;
        this.persistAuthStateInStorage(this.authState);
    }

    setUnauthorized(): void {
        // set the correct values in storage
        this.authState = AuthorizedState.Unauthorized;
        this.storagePersistanceService.resetAuthStateInStorage();
    }

    initStateFromStorage(): void {
        const currentAuthorizedState = this.getCurrentlyPersistedAuthState();
        if (currentAuthorizedState === AuthorizedState.Authorized) {
            this.authState = AuthorizedState.Authorized;
        } else {
            this.authState = AuthorizedState.Unknown;
        }
    }

    setAuthorizationData(accessToken: any, idToken: any) {
        this.loggerService.logDebug(accessToken);
        this.loggerService.logDebug(idToken);
        this.loggerService.logDebug('storing to storage, getting the roles');

        this.storagePersistanceService.accessToken = accessToken;
        this.storagePersistanceService.idToken = idToken;

        this.setAuthorized();
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

    validateStorageAuthTokens(): boolean {
        const currentAuthState = this.getCurrentlyPersistedAuthState();
        if (currentAuthState === AuthorizedState.Authorized) {
            this.loggerService.logDebug('authorizedState in storage is Authorized');
            if (
                this.tokenValidationService.isTokenExpired(
                    this.storagePersistanceService.idToken || this.storagePersistanceService.accessToken,
                    this.configurationProvider.openIDConfiguration.silentRenewOffsetInSeconds
                )
            ) {
                this.loggerService.logDebug('IsAuthorized setup module; id_token isTokenExpired');
                return false;
            } else {
                this.loggerService.logDebug('IsAuthorized setup module; id_token is valid');
                this.setAuthorized();
                return true;
            }
        }
    }

    private getCurrentlyPersistedAuthState() {
        return this.storagePersistanceService.authorizedState;
    }

    private persistAuthStateInStorage(authState: AuthorizedState) {
        this.storagePersistanceService.authorizedState = authState;
    }
}
