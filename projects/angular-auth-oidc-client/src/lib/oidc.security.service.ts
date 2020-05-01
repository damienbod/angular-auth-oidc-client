import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthStateService } from './authState/auth-state.service';
import { CallbackService } from './callback/callback.service';
import { ConfigurationProvider } from './config';
import { FlowsDataService } from './flows/flows-data.service';
import { FlowsService } from './flows/flows.service';
import { CheckSessionService, SilentRenewService } from './iframe';
import { LoggerService } from './logging/logger.service';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { EventTypes } from './public-events';
import { PublicEventsService } from './public-events/public-events.service';
import { UserService } from './userData/user-service';
import { RedirectService, UrlService } from './utils';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';
import { TokenValidationService } from './validation/token-validation.service';

@Injectable()
export class OidcSecurityService {
    private TOKEN_REFRESH_INTERVALL_IN_SECONDS = 3;

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
        private tokenValidationService: TokenValidationService,
        private tokenHelperService: TokenHelperService,
        private loggerService: LoggerService,
        private configurationProvider: ConfigurationProvider,
        private publicEventsService: PublicEventsService,
        private urlService: UrlService,
        private authStateService: AuthStateService,
        private flowsDataService: FlowsDataService,
        private flowsService: FlowsService,
        private callbackService: CallbackService,
        private logoffRevocationService: LogoffRevocationService,
        private redirectService: RedirectService
    ) {}

    checkAuth(): Observable<boolean> {
        if (!this.configurationProvider.hasValidConfig()) {
            this.loggerService.logError('Please provide a configuration before setting up the module');
            return of(false);
        }

        this.loggerService.logDebug('STS server: ' + this.configurationProvider.openIDConfiguration.stsServer);

        const currentUrl = window.location.toString();

        return this.callbackService.handlePossibleStsCallback(currentUrl).pipe(
            map(() => {
                const isAuthenticated = this.authStateService.areAuthStorageTokensValid();
                // validate storage and @@set authorized@@ if true
                if (isAuthenticated) {
                    this.authStateService.setAuthorizedAndFireEvent();
                    this.userService.publishUserdataIfExists();

                    if (this.checkSessionService.isCheckSessionConfigured()) {
                        this.checkSessionService.start();
                    }

                    this.callbackService.startTokenValidationPeriodically(this.TOKEN_REFRESH_INTERVALL_IN_SECONDS);

                    if (this.silentRenewService.isSilentRenewConfigured()) {
                        this.silentRenewService.getOrCreateIframe();
                    }
                }

                this.loggerService.logDebug('checkAuth completed fire events, auth: ' + isAuthenticated);

                // TODO EXTRACT THIS IN SERVICE LATER
                this.publicEventsService.fireEvent(EventTypes.ModuleSetup, true);
                this.isModuleSetupInternal$.next(true);

                return isAuthenticated;
            })
        );
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
    authorize(urlHandler?: (url: string) => any, customParams?: { [key: string]: string | number | boolean }) {
        if (!this.configurationProvider.hasValidConfig()) {
            this.loggerService.logError('Well known endpoints must be loaded before user can login!');
            return;
        }

        if (!this.tokenValidationService.configValidateResponseType(this.configurationProvider.openIDConfiguration.responseType)) {
            this.loggerService.logError('Invalid response type!');
            return;
        }

        this.flowsService.resetAuthorizationData();

        this.loggerService.logDebug('BEGIN Authorize OIDC Flow, no auth data');

        const url = this.urlService.getAuthorizeUrl(customParams);

        if (urlHandler) {
            urlHandler(url);
        } else {
            this.redirectService.redirectTo(url);
        }
    }

    // The refresh token and and the access token are revoked on the server. If the refresh token does not exist
    // only the access token is revoked. Then the logout run.
    logoffAndRevokeTokens(urlHandler?: (url: string) => any) {
        return this.logoffRevocationService.logoffAndRevokeTokens(urlHandler);
    }

    // Logs out on the server and the local client.
    // If the server state has changed, checksession, then only a local logout.
    logoff(urlHandler?: (url: string) => any) {
        return this.logoffRevocationService.logoff(urlHandler);
    }

    logoffLocal() {
        return this.logoffRevocationService.logoffLocal();
    }

    // https://tools.ietf.org/html/rfc7009
    // revokes an access token on the STS. This is only required in the code flow with refresh tokens.
    // If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
    // This makes it possible to manage your own tokens.
    revokeAccessToken(accessToken?: any) {
        return this.logoffRevocationService.revokeAccessToken(accessToken);
    }

    // https://tools.ietf.org/html/rfc7009
    // revokes a refresh token on the STS. This is only required in the code flow with refresh tokens.
    // If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
    // This makes it possible to manage your own tokens.
    revokeRefreshToken(refreshToken?: any) {
        return this.logoffRevocationService.revokeRefreshToken(refreshToken);
    }

    getEndSessionUrl(): string | null {
        return this.logoffRevocationService.getEndSessionUrl();
    }
}
