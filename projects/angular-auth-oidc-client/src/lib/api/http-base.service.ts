import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpBaseService {
    constructor(private http: HttpClient) {}

    get<T>(url: string, params?: { [key: string]: any }): Observable<T> {
        return this.http.get<T>(url, params);
    }

    post<T>(url: string, body: any): Observable<T> {
        return this.http.post<T>(url, body);
    }

    put<T>(url: string, body: any): Observable<T> {
        return this.http.put<T>(url, body);
    }

    delete<T>(url: string): Observable<T> {
        return this.http.delete<T>(url);
    }

    patch<T>(url: string, body: any): Observable<T> {
        return this.http.patch<T>(url, body);
    }
}
