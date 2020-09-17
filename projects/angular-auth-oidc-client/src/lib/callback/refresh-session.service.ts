import { Injectable } from '@angular/core';
import { forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { ConfigurationProvider } from '../config/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionService {
    constructor(
        private flowHelper: FlowHelper,
        private configurationProvider: ConfigurationProvider,
        private flowsDataService: FlowsDataService,
        private loggerService: LoggerService,
        private silentRenewService: SilentRenewService,
        private authStateService: AuthStateService,
        private authWellKnownService: AuthWellKnownService,
        private refreshSessionIframeService: RefreshSessionIframeService,
        private refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService
    ) {}

    forceRefreshSession() {
        if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens()) {
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

        return forkJoin([this.startRefreshSession(), this.silentRenewService.refreshSessionWithIFrameCompleted$.pipe(take(1))]).pipe(
            map(([_, callbackContext]) => {
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
    private startRefreshSession() {
        const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning();
        this.loggerService.logDebug(`Checking: silentRenewRunning: ${isSilentRenewRunning}`);
        const shouldBeExecuted = !isSilentRenewRunning;

        if (!shouldBeExecuted) {
            return of(null);
        }

        const authWellknownEndpointAddress = this.configurationProvider.openIDConfiguration?.authWellknownEndpoint;

        if (!authWellknownEndpointAddress) {
            this.loggerService.logError('no authwellknownendpoint given!');
            return of(null);
        }

        return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointAddress).pipe(
            switchMap(() => {
                this.flowsDataService.setSilentRenewRunning();

                if (this.flowHelper.isCurrentFlowCodeFlowWithRefreshTokens()) {
                    // Refresh Session using Refresh tokens
                    return this.refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens();
                }

                return this.refreshSessionIframeService.refreshSessionWithIframe();
            }),
            catchError(() => {
                this.flowsDataService.resetSilentRenewRunning();
                return throwError('startRefreshSession -> getAuthWellKnownEndPoints failed');
            })
        );
    }
}
