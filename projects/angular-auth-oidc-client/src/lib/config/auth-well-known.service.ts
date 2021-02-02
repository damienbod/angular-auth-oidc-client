import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { AuthWellKnownDataService } from './auth-well-known-data.service';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';
import { PublicConfiguration } from './public-configuration';

@Injectable()
export class AuthWellKnownService {
  constructor(
    private publicEventsService: PublicEventsService,
    private dataService: AuthWellKnownDataService,
    private storagePersistanceService: StoragePersistanceService
  ) {}

  getAuthWellKnownEndPoints(authWellknownEndpoint: string) {
    const alreadySavedWellKnownEndpoints = this.storagePersistanceService.read('authWellKnownEndPoints');
    if (!!alreadySavedWellKnownEndpoints) {
      return of(alreadySavedWellKnownEndpoints);
    }

    return this.getWellKnownEndPointsFromUrl(authWellknownEndpoint).pipe(
      tap((mappedWellKnownEndpoints) => this.storeWellKnownEndpoints(mappedWellKnownEndpoints)),
      catchError((error) => {
        this.publicEventsService.fireEvent<PublicConfiguration>(EventTypes.configLoadingFailed, null);
        return throwError(error);
      })
    );
  }

  storeWellKnownEndpoints(mappedWellKnownEndpoints: AuthWellKnownEndpoints) {
    this.storagePersistanceService.write('authWellKnownEndPoints', mappedWellKnownEndpoints);
  }

  private getWellKnownEndPointsFromUrl(authWellknownEndpoint: string) {
    return this.dataService.getWellKnownEndPointsFromUrl(authWellknownEndpoint);
  }
}
