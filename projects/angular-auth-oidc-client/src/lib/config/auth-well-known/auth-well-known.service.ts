import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { EventTypes } from '../../public-events/event-types';
import { PublicEventsService } from '../../public-events/public-events.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { OpenIdConfiguration } from '../openid-configuration';
import { AuthWellKnownDataService } from './auth-well-known-data.service';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

@Injectable()
export class AuthWellKnownService {
  constructor(
    private publicEventsService: PublicEventsService,
    private dataService: AuthWellKnownDataService,
    private storagePersistenceService: StoragePersistenceService
  ) {}

  getAuthWellKnownEndPoints(authWellknownEndpointUrl: string, config: OpenIdConfiguration): Observable<AuthWellKnownEndpoints> {
    const alreadySavedWellKnownEndpoints = this.storagePersistenceService.read('authWellKnownEndPoints', config);
    if (!!alreadySavedWellKnownEndpoints) {
      return of(alreadySavedWellKnownEndpoints);
    }

    const { configId } = config;

    return this.getWellKnownEndPointsFromUrl(authWellknownEndpointUrl, configId).pipe(
      tap((mappedWellKnownEndpoints) => this.storeWellKnownEndpoints(config, mappedWellKnownEndpoints)),
      catchError((error) => {
        this.publicEventsService.fireEvent(EventTypes.ConfigLoadingFailed, null);

        return throwError(() => new Error(error));
      })
    );
  }

  storeWellKnownEndpoints(config: OpenIdConfiguration, mappedWellKnownEndpoints: AuthWellKnownEndpoints): void {
    this.storagePersistenceService.write('authWellKnownEndPoints', mappedWellKnownEndpoints, config);
  }

  private getWellKnownEndPointsFromUrl(authWellknownEndpointUrl: string, configId: string): Observable<AuthWellKnownEndpoints> {
    return this.dataService.getWellKnownEndPointsFromUrl(authWellknownEndpointUrl, configId);
  }
}
