import { Injectable } from '@angular/core';
import { map, retry } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

const WELL_KNOWN_SUFFIX = `/.well-known/openid-configuration`;

@Injectable()
export class AuthWellKnownDataService {
  constructor(private readonly http: DataService) {}

  getWellKnownEndPointsFromUrl(authWellknownEndpoint: string) {
    return this.getWellKnownDocument(authWellknownEndpoint).pipe(
      map(
        (wellKnownEndpoints) =>
          ({
            issuer: wellKnownEndpoints.issuer,
            jwksUri: wellKnownEndpoints.jwks_uri,
            authorizationEndpoint: wellKnownEndpoints.authorization_endpoint,
            tokenEndpoint: wellKnownEndpoints.token_endpoint,
            userinfoEndpoint: wellKnownEndpoints.userinfo_endpoint,
            endSessionEndpoint: wellKnownEndpoints.end_session_endpoint,
            checkSessionIframe: wellKnownEndpoints.check_session_iframe,
            revocationEndpoint: wellKnownEndpoints.revocation_endpoint,
            introspectionEndpoint: wellKnownEndpoints.introspection_endpoint,
            parEndpoint: wellKnownEndpoints.pushed_authorization_request_endpoint,
          } as AuthWellKnownEndpoints)
      )
    );
  }

  private getWellKnownDocument(wellKnownEndpoint: string) {
    let url = wellKnownEndpoint;

    if (!wellKnownEndpoint.includes(WELL_KNOWN_SUFFIX)) {
      url = `${wellKnownEndpoint}${WELL_KNOWN_SUFFIX}`;
    }

    return this.http.get<any>(url).pipe(retry(2));
  }
}
