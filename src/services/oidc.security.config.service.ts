import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class OidcConfigService {
    @Output()
    onConfigurationLoaded = new EventEmitter<boolean>();
    clientConfiguration: any;
    wellKnownEndpoints: any;

    constructor(private readonly httpClient: HttpClient) {}

    load(configUrl: string) {
        this.httpClient
            .get(configUrl)
            .pipe(
                map(response => {
                    this.clientConfiguration = response;
                    this.load_using_stsServer(
                        this.clientConfiguration.stsServer
                    );
                }),
                catchError(error => {
                    console.error(
                        `OidcConfigService 'load' threw an error on calling ${configUrl}`,
                        error
                    );
                    this.onConfigurationLoaded.emit(false);
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
                    this.onConfigurationLoaded.emit(true);
                }),
                catchError(error => {
                    console.error(
                        `OidcConfigService 'load_using_stsServer' threw an error on calling ${stsServer}`,
                        error
                    );
                    this.onConfigurationLoaded.emit(false);
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
                    this.onConfigurationLoaded.emit(true);
                }),
                catchError(error => {
                    console.error(
                        `OidcConfigService 'load_using_custom_stsServer' threw an error on calling ${url}`,
                        error
                    );
                    this.onConfigurationLoaded.emit(false);
                    return of(false);
                })
            )
            .subscribe();
    }
}
