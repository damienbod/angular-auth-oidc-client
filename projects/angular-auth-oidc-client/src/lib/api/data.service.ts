import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OpenIdConfiguration } from '../config/openid-configuration';

const NGSW_CUSTOM_PARAM = 'ngsw-bypass';

export function formUrlEncodedHeaders(): HttpHeaders {
  return new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
  });
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly httpClient = inject(HttpClient);

  get<T>(
    url: string,
    config: OpenIdConfiguration,
    token?: string
  ): Observable<T> {
    const headers = this.prepareHeaders(token);
    const params = this.prepareParams(config);

    return this.httpClient.get<T>(url, { headers, params });
  }

  post<T>(
    url: string,
    body: unknown,
    config: OpenIdConfiguration,
    customHeaders?: HttpHeaders
  ): Observable<T> {
    const headers = this.prepareHeaders(undefined, customHeaders);
    const params = this.prepareParams(config);

    return this.httpClient.post<T>(url, body, { headers, params });
  }

  // Custom headers are merged over the defaults and win on conflicts.
  private prepareHeaders(
    token?: string,
    customHeaders?: HttpHeaders
  ): HttpHeaders {
    let headers = new HttpHeaders({ Accept: 'application/json' });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    customHeaders?.keys().forEach((key) => {
      headers = headers.set(key, customHeaders.getAll(key) ?? []);
    });

    return headers;
  }

  private prepareParams(config: OpenIdConfiguration): HttpParams {
    const params = new HttpParams();

    return config.ngswBypass ? params.set(NGSW_CUSTOM_PARAM, '') : params;
  }
}
