import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { OpenIdConfiguration } from '../config/openid-configuration';

@Injectable()
export class DataServiceMock {
  get(url: string, config: OpenIdConfiguration, token?: string) {
    return of(null);
  }

  post(url: string, body: any, config: OpenIdConfiguration, headersParams?: HttpHeaders) {
    return of();
  }
}
