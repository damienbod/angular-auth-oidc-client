import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class OidcDataService {
    private headers: HttpHeaders;
    constructor(private httpClient: HttpClient) {
        this.headers = new HttpHeaders();
        this.headers = this.headers.set('Accept', 'application/json');
    }

    get<T>(url: string, headers: { [key: string]: any } = {}): Observable<T> {
        for (let key in headers) {
            let value = headers[key];
            this.headers = this.headers.set(key, value);
        }

        return this.httpClient.get<T>(url, {
            headers: this.headers
        });
    }
}
