import { Injectable } from '@angular/core';
import { forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { ConfigurationProvider } from '../config/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { PeriodicallyTokenCheckService } from './periodically-token-check.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionService {
    constructor(
        private flowsService: FlowsService,
        private flowHelper: FlowHelper,
        private configurationProvider: ConfigurationProvider,
        private flowsDataService: FlowsDataService,
        private loggerService: LoggerService,
        private silentRenewService: SilentRenewService,
        private authStateService: AuthStateService,
        private authWellKnownService: AuthWellKnownService,
        private periodicallyTokenCheckService: PeriodicallyTokenCheckService,
        private refreshSessionIframeService: RefreshSessionIframeService
    ) {}

    forceRefreshSession() {
        if (this.flowHelper.isCurrentFlowCodeFlowWithRefeshTokens()) {
            return this.startRefreshSession().pipe(
                map(() => {
                    const isAuthenticated = this.authStateService.areAuthStorageTokensValid();
                    if (isAuthenticated) {
                        return {
                            idToken: this.authStateService.getIdToken(),
                            accessToken: this.authStateService.getAccessToken(),
                        };
                    }

                    return null;
                })
            );
        }

        return forkJoin({
            refreshSession: this.startRefreshSession(),
            callbackContext: this.silentRenewService.refreshSessionWithIFrameCompletedInternal$,
        }).pipe(
            map(({ callbackContext }) => {
                const isAuthenticated = this.authStateService.areAuthStorageTokensValid();
                if (isAuthenticated) {
                    return {
                        idToken: callbackContext?.authResult?.id_token,
                        accessToken: callbackContext?.authResult?.access_token,
                    };
                }

                return null;
            })
        );
    }

    refreshSessionWithRefreshTokens() {
        this.loggerService.logDebug('BEGIN refresh session Authorize');

        return this.flowsService.processRefreshToken().pipe(
            catchError((error) => {
                this.periodicallyTokenCheckService.stopPeriodicallTokenCheck();
                this.flowsService.resetAuthorizationData();
                return throwError(error);
            })
        );
    }

    private startRefreshSession() {
        const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning();
        this.loggerService.logDebug(`Checking: silentRenewRunning: ${isSilentRenewRunning}`);
        const shouldBeExecuted = !isSilentRenewRunning;

        if (!shouldBeExecuted) {
            return of(null);
        }

        const authWellknownEndpointAdress = this.configurationProvider.openIDConfiguration?.authWellknownEndpoint;

        if (!authWellknownEndpointAdress) {
            this.loggerService.logError('no authwellknownendpoint given!');
            return of(null);
        }

        return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointAdress).pipe(
            switchMap(() => {
                this.flowsDataService.setSilentRenewRunning();

                if (this.flowHelper.isCurrentFlowCodeFlowWithRefeshTokens()) {
                    // Refresh Session using Refresh tokens
                    return this.refreshSessionWithRefreshTokens();
                }

                return this.refreshSessionIframeService.refreshSessionWithIframe();
            })
        );
    }
}
