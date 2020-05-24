import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { AuthWellKnownDataService } from './auth-well-known-data.service';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

@Injectable()
export class AuthWellKnownService {
    constructor(private dataService: AuthWellKnownDataService, private storagePersistanceService: StoragePersistanceService) {}

    getAuthWellKnownEndPoints(authWellknownEndpoint: string) {
        const alreadySavedWellKnownEndpoints = this.storagePersistanceService.read('authWellKnownEndPoints');
        if (!!alreadySavedWellKnownEndpoints) {
            return of(alreadySavedWellKnownEndpoints);
        }

        return this.getWellKnownEndPointsFromUrl(authWellknownEndpoint).pipe(
            tap((mappedWellKnownEndpoints) => this.storeWellKnownEndpoints(mappedWellKnownEndpoints))
        );
    }

    storeWellKnownEndpoints(mappedWellKnownEndpoints: AuthWellKnownEndpoints) {
        this.storagePersistanceService.write('authWellKnownEndPoints', mappedWellKnownEndpoints);
    }

    private getWellKnownEndPointsFromUrl(authWellknownEndpoint: string) {
        return this.dataService.getWellKnownEndPointsFromUrl(authWellknownEndpoint);
    }
}
