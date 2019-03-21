import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class OidcDataService {
    constructor(private httpClient: HttpClient) {}

    getWellknownEndpoints<T>(url: string): Observable<T> {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');

        return this.httpClient.get<T>(url, {
            headers: headers,
        });
    }

    getIdentityUserData<T>(url: string, token: string): Observable<T> {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');
        headers = headers.set('Authorization', 'Bearer ' + decodeURIComponent(token));

        return this.httpClient.get<T>(url, {
            headers: headers,
        });
    }

    get<T>(url: string): Observable<T> {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');

        return this.httpClient.get<T>(url, {
            headers: headers,
        });
    }
}
