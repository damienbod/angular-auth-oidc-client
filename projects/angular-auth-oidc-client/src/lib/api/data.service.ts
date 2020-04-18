import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from './http-base.service';

@Injectable()
export class DataService {
    constructor(private httpClient: HttpBaseService) {}

    get<T>(url: string, token?: string): Observable<T> {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');

        if (!!token) {
            headers = headers.set('Authorization', 'Bearer ' + decodeURIComponent(token));
        }

        return this.httpClient.get<T>(url, {
            headers,
        });
    }
}
