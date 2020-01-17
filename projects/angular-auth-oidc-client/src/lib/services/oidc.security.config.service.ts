import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, ReplaySubject } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { LoggerService } from './oidc.logger.service';

export interface ConfigResult {
    authWellknownEndpoints: any;
    customConfig: any;
}

@Injectable()
export class OidcConfigService {
    private configurationLoadedInternal = new ReplaySubject<ConfigResult>(1);

    public get onConfigurationLoaded(): Observable<ConfigResult> {
        return this.configurationLoadedInternal.asObservable();
    }

    constructor(private readonly loggerService: LoggerService, private readonly httpClient: HttpClient) {}

    load(configUrl: string): Promise<boolean> {
        return this.httpClient
            .get(configUrl)
            .pipe(
                switchMap(clientConfiguration => {
                    return this.loadUsingConfiguration(clientConfiguration);
                }),
                catchError(error => {
                    this.loggerService.logError(`OidcConfigService 'load' threw an error on calling ${configUrl}`, error);
                    this.configurationLoadedInternal.next(undefined);
                    return of(false);
                })
            )
            .toPromise();
    }

    load_using_stsServer(stsServer: string): Promise<boolean> {
        return this.loadUsingConfiguration({ stsServer }).toPromise();
    }

    load_using_custom_stsServer(url: string): Promise<boolean> {
        return this.httpClient
            .get(url)
            .pipe(
                switchMap(wellKnownEndpoints => {
                    this.configurationLoadedInternal.next({
                        authWellknownEndpoints: wellKnownEndpoints,
                        customConfig: { stsServer: url },
                    });
                    return of(true);
                }),
                catchError(error => {
                    this.loggerService.logError(`OidcConfigService 'load_using_custom_stsServer' threw an error on calling ${url}`, error);
                    this.configurationLoadedInternal.next(undefined);
                    return of(false);
                })
            )
            .toPromise();
    }

    private loadUsingConfiguration(clientConfig: any): Observable<boolean> {
        if (!clientConfig.stsServer) {
            this.loggerService.logError(`Property 'stsServer' is not present of passed config ${JSON.stringify(clientConfig)}`, clientConfig);
            throw new Error(`Property 'stsServer' is not present of passed config ${JSON.stringify(clientConfig)}`);
        }

        const url = `${clientConfig.stsServer}/.well-known/openid-configuration`;

        return this.httpClient.get(url).pipe(
            switchMap(wellKnownEndpoints => {
                this.configurationLoadedInternal.next({
                    authWellknownEndpoints: wellKnownEndpoints,
                    customConfig: clientConfig,
                });
                return of(true);
            }),
            catchError(error => {
                this.loggerService.logError(`OidcConfigService 'load_using_stsServer' threw an error on calling ${url}`, error);
                this.configurationLoadedInternal.next(undefined);
                return of(false);
            })
        );
    }
}
