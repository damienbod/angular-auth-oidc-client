import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConfigurationProvider } from '../config';
import { EventsService } from '../events';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage';

@Injectable()
export class AuthStateService {
    // event which contains the state
    private authStateInternal$ = new BehaviorSubject<any>(null);
    private authorizedInternal$ = new BehaviorSubject<boolean>(null);
    // [('Authorized', 'Unauthorized', 'Unknown')];
    private authState = 'Unknown';

    get authState$() {
        return this.authStateInternal$.asObservable();
    }

    get authorized$() {
        return this.authorizedInternal$.asObservable();
    }

    constructor(
        private storagePersistanceService: StoragePersistanceService,
        private eventService: EventsService,
        private loggerService: LoggerService,
        private readonly configurationProvider: ConfigurationProvider
    ) {}

    private resetAuthorizationState(): void {
        this.storagePersistanceService.resetAuthStateStorageData();
    }

    setAuthorized(): void {
        // set the correct values in storage
        this.authState = 'Authorized';
    }

    setUnauthorized(): void {
        // set the correct values in storage
        this.authState = 'Unauthorized';
        this.storagePersistanceService.resetAuthStateStorageData();
    }

    initState(): void {
        const isAuthorized = this.storagePersistanceService.isAuthorized;
        if (isAuthorized) {
            this.authState = 'Authorized';
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
        if (!(this.authState === 'Authorized')) {
            return '';
        }

        const token = this.storagePersistanceService.getAccessToken();
        return decodeURIComponent(token);
    }

    getIdToken(): string {
        if (!(this.authState === 'Authorized')) {
            return '';
        }

        const token = this.storagePersistanceService.getIdToken();
        return decodeURIComponent(token);
    }

    getRefreshToken(): string {
        if (!(this.authState === 'Authorized')) {
            return '';
        }

        const token = this.storagePersistanceService.getRefreshToken();
        return decodeURIComponent(token);
    }
}
