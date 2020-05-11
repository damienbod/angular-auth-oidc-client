import { Injectable } from '@angular/core';
import { DataService } from '../api/data.service';

@Injectable()
export class AuthWellKnownDataService {
    private WELL_KNOWN_SUFFIX = `/.well-known/openid-configuration`;

    constructor(private readonly http: DataService) {}

    getWellKnownDocument(wellKnownEndpoint: string) {
        let url = wellKnownEndpoint;

        if (!wellKnownEndpoint.includes(this.WELL_KNOWN_SUFFIX)) {
            url = `${wellKnownEndpoint}${this.WELL_KNOWN_SUFFIX}`;
        }

        return this.http.get<any>(url);
    }
}
