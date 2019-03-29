import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class OidcDataService {
    constructor(private httpClient: HttpClient) {}

    getWellknownEndpoints<T>(url: string): Observable<T> {
        const headers = this.getStandardHttpHeaders();

        return this.httpClient.get<T>(url, {
            headers,
        });
    }

    getIdentityUserData<T>(url: string, token: string): Observable<T> {
        let headers = this.getStandardHttpHeaders();
        headers = headers.set('Authorization', 'Bearer ' + decodeURIComponent(token));

        return this.httpClient.get<T>(url, {
            headers,
        });
    }

    get<T>(url: string): Observable<T> {
        const headers = this.getStandardHttpHeaders();

        return this.httpClient.get<T>(url, {
            headers,
        });
    }

    private getStandardHttpHeaders() {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');
        return headers;
    }
}
