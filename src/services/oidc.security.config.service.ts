import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class OidcConfigService {
    private _onConfigurationLoaded = new Subject<boolean>();
    clientConfiguration: any;
    wellKnownEndpoints: any;

    public get onConfigurationLoaded(): Observable<boolean> {
        return this._onConfigurationLoaded.asObservable();
    }

    constructor(private readonly httpClient: HttpClient) {}

    load(configUrl: string) {
        this.httpClient
            .get(configUrl)
            .pipe(
                map(response => {
                    this.clientConfiguration = response;
                    this.load_using_stsServer(this.clientConfiguration.stsServer);
                }),
                catchError(error => {
                    console.error(`OidcConfigService 'load' threw an error on calling ${configUrl}`, error);
                    this._onConfigurationLoaded.next(false);
                    return of(false);
                })
            )
            .subscribe();
    }

    load_using_stsServer(stsServer: string) {
        const url = `${stsServer}/.well-known/openid-configuration`;

        this.httpClient
            .get(url)
            .pipe(
                map(response => {
                    this.wellKnownEndpoints = response;
                    this._onConfigurationLoaded.next(true);
                }),
                catchError(error => {
                    console.error(`OidcConfigService 'load_using_stsServer' threw an error on calling ${stsServer}`, error);
                    this._onConfigurationLoaded.next(false);
                    return of(false);
                })
            )
            .subscribe();
    }

    load_using_custom_stsServer(url: string) {
        this.httpClient
            .get(url)
            .pipe(
                map(response => {
                    this.wellKnownEndpoints = response;
                    this._onConfigurationLoaded.next(true);
                }),
                catchError(error => {
                    console.error(`OidcConfigService 'load_using_custom_stsServer' threw an error on calling ${url}`, error);
                    this._onConfigurationLoaded.next(false);
                    return of(false);
                })
            )
            .subscribe();
    }
}
