import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, retry, tap } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { LoggerService } from '../../logging/logger.service';
import { OpenIdConfiguration } from '../openid-configuration';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

const WELL_KNOWN_SUFFIX = `/.well-known/openid-configuration`;

@Injectable({ providedIn: 'root' })
export class AuthWellKnownDataService {
  private readonly loggerService = inject(LoggerService);
  private readonly http = inject(DataService);

  getWellKnownEndPointsForConfig(
    config: OpenIdConfiguration
  ): Observable<AuthWellKnownEndpoints> {
    const { authWellknownEndpointUrl, authWellknownEndpoints = {} } = config;

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
            parEndpoint:
              wellKnownEndpoints.pushed_authorization_request_endpoint,
          } as AuthWellKnownEndpoints)
      ),
      map((mappedWellKnownEndpoints) => ({
        ...mappedWellKnownEndpoints,
        ...authWellknownEndpoints,
      })),
      tap(
        (wellKnownEndpoints) => {
          const issuer = wellKnownEndpoints.issuer || "";
          const wellKnownSuffix = config.authWellknownUrlSuffix || WELL_KNOWN_SUFFIX;
          const configuredWellKnownEndpoint = authWellknownEndpointUrl.replace(wellKnownSuffix, "");
          
          if (issuer !== configuredWellKnownEndpoint && issuer !== `${configuredWellKnownEndpoint}/`) {
            const errorMessage = `Issuer mismatch. Well known issuer ${wellKnownEndpoints.issuer} does not match configured well known url ${authWellknownEndpointUrl}`;

            this.loggerService.logError(config, errorMessage);
            throw new Error(errorMessage);
          }
        }
      )
    );
  }

  private getWellKnownDocument(
    wellKnownEndpoint: string,
    config: OpenIdConfiguration
  ): Observable<any> {
    let url = wellKnownEndpoint;
    const wellKnownSuffix = config.authWellknownUrlSuffix || WELL_KNOWN_SUFFIX;

    if (!wellKnownEndpoint.includes(wellKnownSuffix)) {
      url = `${wellKnownEndpoint}${wellKnownSuffix}`;
    }

    return this.http.get(url, config).pipe(retry(2));
  }
}
