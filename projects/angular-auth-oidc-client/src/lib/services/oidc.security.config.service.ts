import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoggerService } from './oidc.logger.service';

@Injectable()
export class OidcConfigService {
    private configurationLoaded = new Subject<boolean>();
    wellKnownEndpoints: any;

    public get onConfigurationLoaded(): Observable<boolean> {
        return this.configurationLoaded.asObservable();
    }

    constructor(private readonly httpClient: HttpClient, private readonly loggerService: LoggerService) {}

    /**
     * Loads the configuration from the passed endpoint
     * @param configUrl the adress of the sts server
     */
    load(configUrl: string) {
        this.httpClient
            .get(configUrl)
            .pipe(
                map((response: any) => {
                    this.loadUsingStsServer(response.stsServer);
                }),
                catchError(error => {
                    this.loggerService.logError(`OidcConfigService 'load' threw an error on calling ${configUrl}`, error);
                    this.configurationLoaded.next(false);
                    return of(error);
                })
            )
            .subscribe();
    }

    /**
     * Loads the configuration from an sts server
     * Method will be deprecated in future versions. Please use `loadUsingStsServer` instead
     * @param stsServer the adress of the sts server
     */
    load_using_stsServer(stsServer: string) {
        this.loadUsingStsServer(stsServer);
    }

    /**
     * Loads the configuration from an sts server
     * @param stsServer the adress of the sts server
     */
    loadUsingStsServer(stsServer: string) {
        const url = `${stsServer}/.well-known/openid-configuration`;

        this.httpClient
            .get(url)
            .pipe(
                catchError(error => {
                    this.loggerService.logError(`OidcConfigService 'load_using_stsServer' threw an error on calling ${stsServer}`, error);
                    this.configurationLoaded.next(false);
                    return of(false);
                })
            )
            .subscribe(response => {
                this.wellKnownEndpoints = response;
                this.configurationLoaded.next(true);
            });
    }

    /**
     * Loads the configuration from an custom sts server
     * Method will be deprecated in future versions. Please use `loadUsingCustomStsServer` instead
     * @param url the adress of the sts server
     */
    load_using_custom_stsServer(url: string) {
        this.loadUsingCustomStsServer(url);
    }

    /**
     * Loads the configuration from an custom sts server
     * @param url the adress of the sts server
     */
    loadUsingCustomStsServer(url: string) {
        this.httpClient
            .get(url)
            .pipe(
                catchError(error => {
                    this.loggerService.logError(`OidcConfigService 'load_using_custom_stsServer' threw an error on calling ${url}`, error);
                    this.configurationLoaded.next(false);
                    return of(error);
                })
            )
            .subscribe(response => {
                this.wellKnownEndpoints = response;
                this.configurationLoaded.next(true);
            });
    }
}
