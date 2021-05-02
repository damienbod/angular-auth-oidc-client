import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigurationProvider } from '../config/config.provider';
import { HttpBaseService } from './http-base.service';

const NGSW_CUSTOM_PARAM = 'ngsw-bypass';

@Injectable()
export class DataService {
  constructor(private httpClient: HttpBaseService, private readonly configurationProvider: ConfigurationProvider) {}

  // TODO: make token optional
  get<T>(url: string, configId: string, token: string): Observable<T> {
    const headers = this.prepareHeaders(token);
    const params = this.prepareParams(configId);

    return this.httpClient.get<T>(url, {
      headers,
      params,
    });
  }

  post<T>(url: string, body: any, configId: string, headersParams?: HttpHeaders) {
    const headers = headersParams || this.prepareHeaders();
    const params = this.prepareParams(configId);

    return this.httpClient.post<T>(url, body, { headers, params });
  }

  private prepareHeaders(token?: string) {
    let headers = new HttpHeaders();
    headers = headers.set('Accept', 'application/json');

    if (!!token) {
      headers = headers.set('Authorization', 'Bearer ' + decodeURIComponent(token));
    }

    return headers;
  }

  private prepareParams(configId: string): HttpParams {
    let params = new HttpParams();
    const { ngswBypass } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (ngswBypass) {
      params = params.set(NGSW_CUSTOM_PARAM, '');
    }

    return params;
  }
}
