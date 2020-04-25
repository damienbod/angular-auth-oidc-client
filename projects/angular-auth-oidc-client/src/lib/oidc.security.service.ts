import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthStateService } from './authState/auth-state.service';
import { CallbackService } from './callback/callback.service';
import { ConfigurationProvider } from './config';
import { EventTypes } from './events';
import { EventsService } from './events/events.service';
import { FlowsDataService } from './flows/flows-data.service';
import { FlowsService } from './flows/flows.service';
import { CheckSessionService, SilentRenewService } from './iframe';
import { LoggerService } from './logging/logger.service';
import { StoragePersistanceService } from './storage';
import { UserService } from './userData/user-service';
import { UrlService } from './utils';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';
import { TokenValidationService } from './validation/token-validation.service';

@Injectable()
export class OidcSecurityService {
    private isModuleSetupInternal$ = new BehaviorSubject<boolean>(false);

    get configuration() {
        return this.configurationProvider.configuration;
    }

    get userData$() {
        return this.userService.userData$;
    }

    get isAuthenticated$() {
        return this.authStateService.authorized$;
    }

    get checkSessionChanged$() {
        return this.checkSessionService.checkSessionChanged$;
    }

    get moduleSetup$() {
        return this.isModuleSetupInternal$.asObservable();
    }

    get stsCallback$() {
        return this.callbackService.stsCallback$;
    }

    constructor(
        private checkSessionService: CheckSessionService,
        private silentRenewService: SilentRenewService,
        private userService: UserService,
        private storagePersistanceService: StoragePersistanceService,
        private tokenValidationService: TokenValidationService,
        private tokenHelperService: TokenHelperService,
        private loggerService: LoggerService,
        private configurationProvider: ConfigurationProvider,
        private eventsService: EventsService,
        private urlService: UrlService,
        private authStateService: AuthStateService,
        private flowsDataService: FlowsDataService,
        private flowsService: FlowsService,
        private callbackService: CallbackService
    ) {}

    checkAuth(): Observable<boolean> {
        if (!this.configurationProvider.hasValidConfig()) {
            this.loggerService.logError('Please provide a configuration before setting up the module');
            return;
        }
        this.loggerService.logDebug('STS server: ' + this.configurationProvider.openIDConfiguration.stsServer);

        const isAuthenticated = this.authStateService.isAuthStorageTokenValid();
        // validate storage and @@set authorized@@ if true
        if (isAuthenticated) {
            this.authStateService.setAuthorizedAndFireEvent();
            this.userService.publishUserdataIfExists();

            this.callbackService.startTokenValidationPeriodically();

            if (this.checkSessionService.isCheckSessionConfigured()) {
                this.checkSessionService.start();
            }

            if (this.silentRenewService.isSilentRenewConfigured()) {
                this.silentRenewService.getOrCreateIframe();
            }
        }

        this.loggerService.logDebug('checkAuth completed fire events, auth: ' + isAuthenticated);

        // TODO EXTRACT THIS IN SERVICE LATER
        this.eventsService.fireEvent(EventTypes.ModuleSetup, true);
        this.isModuleSetupInternal$.next(true);

        const callback$ = this.callbackService.handlePossibleStsCallback(window.location.toString());

        return callback$.pipe(switchMap(() => of(isAuthenticated)));
    }

    getToken(): string {
        return this.authStateService.getAccessToken();
    }

    getIdToken(): string {
        return this.authStateService.getIdToken();
    }

    getRefreshToken(): string {
        return this.authStateService.getRefreshToken();
    }

    getPayloadFromIdToken(encode = false): any {
        const token = this.getIdToken();
        return this.tokenHelperService.getPayloadFromToken(token, encode);
    }

    setState(state: string): void {
        this.flowsDataService.setAuthStateControl(state);
    }

    getState(): string {
        return this.flowsDataService.getAuthStateControl();
    }

    // Code Flow with PCKE or Implicit Flow
    authorize(urlHandler?: (url: string) => any) {
        if (!this.configurationProvider.hasValidConfig()) {
            this.loggerService.logError('Well known endpoints must be loaded before user can login!');
            return;
        }

        if (!this.tokenValidationService.configValidateResponseType(this.configurationProvider.openIDConfiguration.responseType)) {
            // invalid response_type
            return;
        }

        this.flowsService.resetAuthorizationData();

        this.loggerService.logDebug('BEGIN Authorize OIDC Flow, no auth data');

        const url = this.urlService.getAuthorizeUrl();

        if (urlHandler) {
            urlHandler(url);
        } else {
            this.redirectTo(url);
        }
    }

    logoff(urlHandler?: (url: string) => any) {
        // /connect/endsession?id_token_hint=...&post_logout_redirect_uri=https://myapp.com
        this.loggerService.logDebug('BEGIN Authorize, no auth data');

        if (this.configurationProvider.wellKnownEndpoints) {
            this.flowsService.resetAuthorizationData();
            if (this.configurationProvider.wellKnownEndpoints.endSessionEndpoint) {
                const endSessionEndpoint = this.configurationProvider.wellKnownEndpoints.endSessionEndpoint;
                const idTokenHint = this.storagePersistanceService.idToken;
                const url = this.urlService.createEndSessionUrl(endSessionEndpoint, idTokenHint);

                if (this.checkSessionService.serverStateChanged()) {
                    this.loggerService.logDebug('only local login cleaned up, server session has changed');
                } else if (urlHandler) {
                    urlHandler(url);
                } else {
                    this.redirectTo(url);
                }
            } else {
                this.loggerService.logDebug('only local login cleaned up, no end_session_endpoint');
            }
        } else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        }
    }

    getEndSessionUrl(): string | undefined {
        if (this.configurationProvider.wellKnownEndpoints) {
            if (this.configurationProvider.wellKnownEndpoints.endSessionEndpoint) {
                const endSessionEndpoint = this.configurationProvider.wellKnownEndpoints.endSessionEndpoint;
                const idTokenHint = this.storagePersistanceService.idToken;
                return this.urlService.createEndSessionUrl(endSessionEndpoint, idTokenHint);
            }
        }
    }

    doPeriodicallTokenCheck(): void {
        this.callbackService.startTokenValidationPeriodically();
    }

    stopPeriodicallTokenCheck(): void {
        this.callbackService.stopPeriodicallTokenCheck();
    }

    private redirectTo(url: string) {
        window.location.href = url;
    }
}
