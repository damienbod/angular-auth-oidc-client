import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable()
export class OidcConfigServiceMock {
  withConfigs(passedConfigs: OpenIdConfiguration[]): Promise<OpenIdConfiguration[]> {
    return of(null).toPromise();
  }
}
