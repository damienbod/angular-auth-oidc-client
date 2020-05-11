import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable()
export class AuthWellKnownServiceMock {
    getWellKnownEndPointsFromUrl(authWellknownEndpoint: string) {
        return of();
    }
}
