import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable()
export class OidcConfigServiceMock {
  withConfigs(passedConfigs: OpenIdConfiguration[]): Observable<OpenIdConfiguration[]> {
    return of(null);
  }
}
