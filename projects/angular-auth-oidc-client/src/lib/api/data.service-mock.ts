import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable()
export class DataServiceMock {
    get(url: string, token?: string) {
        return of(null);
    }

    post(url: string, body: any, headersParams?: HttpHeaders) {
        return of();
    }
}
