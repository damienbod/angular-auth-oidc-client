import { Injectable } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { EventTypes } from '../../public-events/event-types';
import { PublicEventsService } from '../../public-events/public-events.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { OpenIdConfiguration } from '../openid-configuration';
import { AuthWellKnownDataService } from './auth-well-known-data.service';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

@Injectable()
export class AuthWellKnownService {
  constructor(
    private dataService: AuthWellKnownDataService,
    private publicEventsService: PublicEventsService,
    private storagePersistenceService: StoragePersistenceService
  ) {}

  storeWellKnownEndpoints(config: OpenIdConfiguration, mappedWellKnownEndpoints: AuthWellKnownEndpoints): void {
    this.storagePersistenceService.write('authWellKnownEndPoints', mappedWellKnownEndpoints, config);
  }

  queryAndStoreAuthWellKnownEndPoints(config: OpenIdConfiguration): Observable<AuthWellKnownEndpoints> {
    const alreadySavedWellKnownEndpoints = this.storagePersistenceService.read('authWellKnownEndPoints', config);

    if (!!alreadySavedWellKnownEndpoints) {
      return of(alreadySavedWellKnownEndpoints);
    }

    return this.dataService.getWellKnownEndPointsForConfig(config).pipe(
      tap((mappedWellKnownEndpoints) => this.storeWellKnownEndpoints(config, mappedWellKnownEndpoints)),
      catchError((error) => {
        this.publicEventsService.fireEvent(EventTypes.ConfigLoadingFailed, null);

        return throwError(() => new Error(error));
      })
    );
  }
}
