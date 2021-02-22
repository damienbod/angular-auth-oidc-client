import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistanceService } from '../../storage/storage-persistance.service';
import { UrlService } from '../../utils/url/url.service';
import { ParResponse } from './par-response';

@Injectable()
export class ParService {
  constructor(
    private loggerService: LoggerService,
    private urlService: UrlService,
    private configurationProvider: ConfigurationProvider,
    private dataService: DataService,
    private storagePersistanceService: StoragePersistanceService
  ) {}

  postParRequest(customParams?: { [key: string]: string | number | boolean }): Observable<ParResponse> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const authWellKnown = this.storagePersistanceService.read('authWellKnownEndPoints');
    const parEndpoint = authWellKnown?.parEndpoint;
    if (!parEndpoint) {
      return throwError('PAR Endpoint not defined');
    }

    const data = this.urlService.createBodyForParCodeFlowRequest(customParams);

    return this.dataService.post(parEndpoint, data, headers).pipe(
      map((response: any) => {
        this.loggerService.logDebug('par response: ', response);

        const parResult: ParResponse = {
          expires_in: response.expires_in,
          request_uri: response.request_uri,
        };

        return parResult;
      }),
      catchError((error) => {
        const errorMessage = `OidcService par request ${this.configurationProvider.openIDConfiguration.stsServer}`;
        this.loggerService.logError(errorMessage, error);
        return throwError(errorMessage);
      })
    );
  }
}
