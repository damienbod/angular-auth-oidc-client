import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { AuthWellKnownEndpoints } from './auth-well-known/auth-well-known-endpoints';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable()
export class OidcConfigServiceMock {
  withConfig(passedConfig: OpenIdConfiguration, passedAuthWellKnownEndpoints?: AuthWellKnownEndpoints): Promise<any> {
    return of(null).toPromise();
  }
}
