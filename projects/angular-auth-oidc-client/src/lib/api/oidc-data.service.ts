import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from './http-base.service';

@Injectable()
export class OidcDataService {
    constructor(private httpClient: HttpBaseService) {}

    getWellknownEndpoints<T>(url: string): Observable<T> {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');

        return this.httpClient.get<T>(url, {
            headers,
        });
    }

    getIdentityUserData<T>(url: string, token: string): Observable<T> {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');
        headers = headers.set('Authorization', 'Bearer ' + decodeURIComponent(token));

        return this.httpClient.get<T>(url, {
            headers,
        });
    }

    get<T>(url: string): Observable<T> {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');

        return this.httpClient.get<T>(url, {
            headers,
        });
    }
}
