import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, retry } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { LoggerService } from '../../logging/logger.service';
import { OpenIdConfiguration } from '../openid-configuration';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

const WELL_KNOWN_SUFFIX = `/.well-known/openid-configuration`;

@Injectable({ providedIn: 'root' })
export class AuthWellKnownDataService {
  constructor(private readonly http: DataService, private readonly loggerService: LoggerService) {}

  getWellKnownEndPointsForConfig(config: OpenIdConfiguration): Observable<AuthWellKnownEndpoints> {
    const { authWellknownEndpointUrl } = config;

    if (!authWellknownEndpointUrl) {
      const errorMessage = 'no authWellknownEndpoint given!';

      this.loggerService.logError(config, errorMessage);

      return throwError(() => new Error(errorMessage));
    }

    return this.getWellKnownDocument(authWellknownEndpointUrl, config).pipe(
      map(
        (wellKnownEndpoints) =>
          ({
            issuer: wellKnownEndpoints.issuer,
            jwksUri: wellKnownEndpoints.jwks_uri,
            authorizationEndpoint: wellKnownEndpoints.authorization_endpoint,
            tokenEndpoint: wellKnownEndpoints.token_endpoint,
            userInfoEndpoint: wellKnownEndpoints.userinfo_endpoint,
            endSessionEndpoint: wellKnownEndpoints.end_session_endpoint,
            checkSessionIframe: wellKnownEndpoints.check_session_iframe,
            revocationEndpoint: wellKnownEndpoints.revocation_endpoint,
            introspectionEndpoint: wellKnownEndpoints.introspection_endpoint,
            parEndpoint: wellKnownEndpoints.pushed_authorization_request_endpoint,
          } as AuthWellKnownEndpoints)
      )
    );
  }

  private getWellKnownDocument(wellKnownEndpoint: string, config: OpenIdConfiguration): Observable<any> {
    let url = wellKnownEndpoint;

    if (!wellKnownEndpoint.includes(WELL_KNOWN_SUFFIX)) {
      url = `${wellKnownEndpoint}${WELL_KNOWN_SUFFIX}`;
    }

    return this.http.get<any>(url, config).pipe(retry(2));
  }
}
