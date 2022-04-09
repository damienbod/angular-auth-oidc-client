import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, switchMap } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { AbstractLoggerService } from '../../logging/abstract-logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { UrlService } from '../../utils/url/url.service';
import { ParResponse } from './par-response';

@Injectable()
export class ParService {
  constructor(
    private loggerService: AbstractLoggerService,
    private urlService: UrlService,
    private dataService: DataService,
    private storagePersistenceService: StoragePersistenceService
  ) {}

  postParRequest(configuration: OpenIdConfiguration, customParams?: { [key: string]: string | number | boolean }): Observable<ParResponse> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const authWellKnownEndpoints = this.storagePersistenceService.read('authWellKnownEndPoints', configuration);

    if (!authWellKnownEndpoints) {
      return throwError(() => new Error('Could not read PAR endpoint because authWellKnownEndPoints are not given'));
    }

    const parEndpoint = authWellKnownEndpoints.parEndpoint;
    if (!parEndpoint) {
      return throwError(() => new Error('Could not read PAR endpoint from authWellKnownEndpoints'));
    }

    return this.urlService.createBodyForParCodeFlowRequest(configuration, customParams).pipe(
      switchMap((data) => {
        return this.dataService.post(parEndpoint, data, configuration, headers).pipe(
          retry(2),
          map((response: any) => {
            this.loggerService.logDebug(configuration, 'par response: ', response);

            return {
              expiresIn: response.expires_in,
              requestUri: response.request_uri,
            };
          }),
          catchError((error) => {
            const errorMessage = `There was an error on ParService postParRequest`;
            this.loggerService.logError(configuration, errorMessage, error);

            return throwError(() => new Error(errorMessage));
          })
        );
      })
    );
  }
}
