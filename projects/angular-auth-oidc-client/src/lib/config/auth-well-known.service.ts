import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { AuthWellKnownDataService } from './auth-well-known-data.service';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';
import { PublicConfiguration } from './public-configuration';

@Injectable()
export class AuthWellKnownService {
  constructor(
    private publicEventsService: PublicEventsService,
    private dataService: AuthWellKnownDataService,
    private storagePersistenceService: StoragePersistenceService
  ) {}

  getAuthWellKnownEndPoints(authWellknownEndpointUrl: string) {
    const alreadySavedWellKnownEndpoints = this.storagePersistenceService.read('authWellKnownEndPoints');
    if (!!alreadySavedWellKnownEndpoints) {
      return of(alreadySavedWellKnownEndpoints);
    }

    return this.getWellKnownEndPointsFromUrl(authWellknownEndpointUrl).pipe(
      tap((mappedWellKnownEndpoints) => this.storeWellKnownEndpoints(mappedWellKnownEndpoints)),
      catchError((error) => {
        this.publicEventsService.fireEvent<PublicConfiguration>(EventTypes.ConfigLoadingFailed, null);
        return throwError(error);
      })
    );
  }

  storeWellKnownEndpoints(mappedWellKnownEndpoints: AuthWellKnownEndpoints) {
    this.storagePersistenceService.write('authWellKnownEndPoints', mappedWellKnownEndpoints);
  }

  private getWellKnownEndPointsFromUrl(authWellknownEndpoint: string) {
    return this.dataService.getWellKnownEndPointsFromUrl(authWellknownEndpoint);
  }
}
