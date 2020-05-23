import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

@Injectable()
export class AuthWellKnownDataService {
    private WELL_KNOWN_SUFFIX = `/.well-known/openid-configuration`;

    constructor(private readonly http: DataService) {}

    getWellKnownEndPointsFromUrl(authWellknownEndpoint: string) {
        return this.getWellKnownDocument(authWellknownEndpoint).pipe(
            map((wellKnownEndpoints) => {
                return {
                    issuer: wellKnownEndpoints.issuer,
                    jwksUri: wellKnownEndpoints.jwks_uri,
                    authorizationEndpoint: wellKnownEndpoints.authorization_endpoint,
                    tokenEndpoint: wellKnownEndpoints.token_endpoint,
                    userinfoEndpoint: wellKnownEndpoints.userinfo_endpoint,
                    endSessionEndpoint: wellKnownEndpoints.end_session_endpoint,
                    checkSessionIframe: wellKnownEndpoints.check_session_iframe,
                    revocationEndpoint: wellKnownEndpoints.revocation_endpoint,
                    introspectionEndpoint: wellKnownEndpoints.introspection_endpoint,
                } as AuthWellKnownEndpoints;
            })
        );
    }

    private getWellKnownDocument(wellKnownEndpoint: string) {
        let url = wellKnownEndpoint;

        if (!wellKnownEndpoint.includes(this.WELL_KNOWN_SUFFIX)) {
            url = `${wellKnownEndpoint}${this.WELL_KNOWN_SUFFIX}`;
        }

        return this.http.get<any>(url);
    }
}
