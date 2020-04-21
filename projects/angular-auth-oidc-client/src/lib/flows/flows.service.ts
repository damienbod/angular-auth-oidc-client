import { Injectable } from '@angular/core';
import { LoggerService, TokenValidationService } from '../../public-api';
import { ConfigurationProvider } from '../config';
import { StoragePersistanceService } from '../storage';
import { RandomService, UrlService } from '../utils';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';

@Injectable()
export class FlowsService {
    constructor(
        private storagePersistanceService: StoragePersistanceService,
        private readonly randomService: RandomService,
        private readonly urlService: UrlService,
        private readonly flowHelper: FlowHelper,
        private loggerService: LoggerService,
        private readonly configurationProvider: ConfigurationProvider,
        private tokenValidationService: TokenValidationService
    ) {}

    createNonce(): string {
        const nonce = this.randomService.createRandom(40);
        this.storagePersistanceService.authNonce = nonce;
        return nonce;
    }

    setNonce(nonce: string) {
        this.storagePersistanceService.authNonce = nonce;
    }

    getAuthStateControl(): any {
        return this.storagePersistanceService.authStateControl;
    }
    setAuthStateControl(authStateControl: string) {
        this.storagePersistanceService.authStateControl = authStateControl;
    }

    getExistingOrCreateAuthStateControl(): any {
        let state = this.storagePersistanceService.authStateControl;
        if (!state) {
            state = this.randomService.createRandom(40);
            this.storagePersistanceService.authStateControl = state;
        }
    }

    setSessionState(sessionState: any) {
        this.storagePersistanceService.sessionState = sessionState;
    }

    resetStorageFlowData() {
        this.storagePersistanceService.resetStorageFlowData();
    }

    getCodeVerifier() {
        return this.storagePersistanceService.codeVerifier;
    }

    createCodeVerifier() {
        const codeVerifier = this.randomService.createRandom(67);
        this.storagePersistanceService.codeVerifier = codeVerifier;
        return codeVerifier;
    }

    public getRefreshSessionSilentRenewUrl(): string {
        let url = '';
        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            url = this.createUrlCodeFlowWithSilentRenew();
        } else {
            url = this.createUrlImplicitFlowWithSilentRenew();
        }

        return url;
    }
    private createUrlImplicitFlowWithSilentRenew(): string {
        const state = this.getExistingOrCreateAuthStateControl();
        const nonce = this.createNonce();
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + state);
        if (this.configurationProvider.wellKnownEndpoints) {
            return this.urlService.createAuthorizeUrl(
                '',
                this.configurationProvider.openIDConfiguration.silentRenewUrl,
                nonce,
                state,
                'none'
            );
        } else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        }
        return '';
    }

    private createUrlCodeFlowWithSilentRenew(): string {
        const state = this.getExistingOrCreateAuthStateControl();
        const nonce = this.createNonce();
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + state);
        // code_challenge with "S256"
        const codeVerifier = this.createCodeVerifier;
        const codeChallenge = this.tokenValidationService.generateCodeVerifier(codeVerifier);

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.urlService.createAuthorizeUrl(
                codeChallenge,
                this.configurationProvider.openIDConfiguration.silentRenewUrl,
                nonce,
                state,
                'none'
            );
        } else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        }
        return '';
    }
}
