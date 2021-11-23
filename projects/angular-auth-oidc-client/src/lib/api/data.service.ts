import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { ConfigurationService } from '../config/config.service';
import { HttpBaseService } from './http-base.service';

const NGSW_CUSTOM_PARAM = 'ngsw-bypass';

@Injectable()
export class DataService {
  constructor(private httpClient: HttpBaseService, private readonly configurationService: ConfigurationService) {}

  get<T>(url: string, configId: string, token?: string): Observable<T> {
    const headers = this.prepareHeaders(token);
    const params = this.prepareParams(configId);

    return this.httpClient.get<T>(url, {
      headers,
      params,
    });
  }

  post<T>(url: string, body: any, configId: string, headersParams?: HttpHeaders): Observable<T> {
    const headers = headersParams || this.prepareHeaders();

    return this.prepareParams(configId).pipe(
      concatMap((params) => {
        return this.httpClient.post<T>(url, body, { headers, params });
      })
    );
  }

  private prepareHeaders(token?: string): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.set('Accept', 'application/json');

    if (!!token) {
      headers = headers.set('Authorization', 'Bearer ' + decodeURIComponent(token));
    }

    return headers;
  }

  private prepareParams(configId: string): Observable<HttpParams> {
    let params = new HttpParams();

    return this.configurationService.getOpenIDConfiguration(configId).pipe(
      map(({ ngswBypass }) => {
        if (ngswBypass) {
          params = params.set(NGSW_CUSTOM_PARAM, '');
        }

        return params;
      })
    );
  }
}
