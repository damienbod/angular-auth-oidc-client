import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { FlowsService } from '../flows/flows.service';
import { CheckSessionService } from '../iframe';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage';
import { UrlService } from '../utils';

@Injectable()
export class LogoffRevocationService {
    constructor(
        private dataService: DataService,
        private storagePersistanceService: StoragePersistanceService,
        private loggerService: LoggerService,
        private urlService: UrlService,
        private readonly checkSessionService: CheckSessionService,
        private readonly flowsService: FlowsService
    ) {}

    logoff(urlHandler?: (url: string) => any) {
        this.loggerService.logDebug('logoff, remove auth ');
        const endSessionUrl = this.getEndSessionUrl();
        this.flowsService.resetAuthorizationData();
        if (endSessionUrl) {
            if (this.checkSessionService.serverStateChanged()) {
                this.loggerService.logDebug('only local login cleaned up, server session has changed');
            } else if (urlHandler) {
                urlHandler(endSessionUrl);
            } else {
                this.redirectTo(endSessionUrl);
            }
        } else {
            this.loggerService.logDebug('only local login cleaned up, no end_session_endpoint');
        }
    }

    logoffAndRevokeTokens(urlHandler?: (url: string) => any) {
        return this.revokeRefreshToken()
            .pipe(
                catchError((error) => {
                    const errorMessage = `revokeRefreshToken failed ${error}`;
                    this.loggerService.logError(errorMessage);
                    return throwError(errorMessage);
                }),
                switchMap((result) => this.revokeAccessToken(result)),
                catchError((error) => {
                    const errorMessage = `revokeAccessToken failed ${error}`;
                    this.loggerService.logError(errorMessage);
                    return throwError(errorMessage);
                })
            )
            .subscribe(() => this.logoff(urlHandler));
    }

    // https://tools.ietf.org/html/rfc7009
    revokeAccessToken(accessToken?: any) {
        const accessTok = accessToken || this.storagePersistanceService.accessToken;
        const body = this.urlService.createRevocationEndpointBodyAccessToken(accessTok);
        const url = this.urlService.getRevocationEndpointUrl();

        let headers: HttpHeaders = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

        return this.dataService.post(url, body, headers).pipe(
            catchError((error) => {
                const errorMessage = `Revocation request failed ${error}`;
                this.loggerService.logError(errorMessage);
                return throwError(errorMessage);
            }),
            map((response: any) => {
                this.loggerService.logDebug('revocation endpoint post response: ', response);
                return response;
            })
        );
    }

    // https://tools.ietf.org/html/rfc7009
    revokeRefreshToken(refreshToken?: any) {
        const refreshTok = refreshToken || this.storagePersistanceService.getRefreshToken();
        const body = this.urlService.createRevocationEndpointBodyRefreshToken(refreshTok);
        const url = this.urlService.getRevocationEndpointUrl();

        let headers: HttpHeaders = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

        return this.dataService.post(url, body, headers).pipe(
            catchError((error) => {
                const errorMessage = `Revocation request failed ${error}`;
                this.loggerService.logError(errorMessage);
                return throwError(errorMessage);
            }),
            map((response: any) => {
                this.loggerService.logDebug('revocation endpoint post response: ', response);
                return response;
            })
        );
    }

    getEndSessionUrl(): string | null {
        const idTokenHint = this.storagePersistanceService.idToken;
        return this.urlService.createEndSessionUrl(idTokenHint);
    }

    private redirectTo(url: string) {
        window.location.href = url;
    }
}
