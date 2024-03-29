import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpBaseService {
  private readonly http = inject(HttpClient);

  get<T>(url: string, params?: { [key: string]: unknown }): Observable<T> {
    return this.http.get<T>(url, params);
  }

  post<T>(
    url: string,
    body: unknown,
    params?: { [key: string]: unknown }
  ): Observable<T> {
    return this.http.post<T>(url, body, params);
  }
}
