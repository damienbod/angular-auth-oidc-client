import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable()
export class DataServiceMock {
    get<T>(url: string, token?: string): Observable<T> {
        return of<T>();
    }
}
