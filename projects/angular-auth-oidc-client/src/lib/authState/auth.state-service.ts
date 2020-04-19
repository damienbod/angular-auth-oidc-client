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

    resetAuthorizationState(): void {
        // TODO
        // this.storagePersistanceService.resetStorageData(isRenewProcess);
    }

    setAuthorized(): void {
        // set the correct values in storage
        this.authState = 'Authorized';
    }

    setUnauthorized(): void {
        // set the correct values in storage
        this.authState = 'Unauthorized';
    }

    initState(): void {
        const isAuthorized = this.storagePersistanceService.isAuthorized;
        if (isAuthorized) {
            this.authState = 'Authorized';
        }
    }
}
