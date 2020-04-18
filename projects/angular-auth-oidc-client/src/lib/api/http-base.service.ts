import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpBaseService {
    constructor(private http: HttpClient) {}

    get<T>(url: string, params?: { [key: string]: any }): Observable<T> {
        return this.http.get<T>(url, params);
    }
}
