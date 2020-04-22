import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { oneLineTrim } from 'common-tags';
import { ConfigurationProvider } from '../../config/config.provider';
import { FlowsDataService } from '../../flows/flows-data.service';
import { LoggerService } from '../../logging/logger.service';
import { TokenValidationService } from '../../validation/token-validation.service';
import { FlowHelper } from '../flowHelper/flow-helper.service';
import { UriEncoder } from './uri-encoder';

@Injectable()
export class UrlService {
    constructor(
        private readonly configurationProvider: ConfigurationProvider,
        private readonly loggerService: LoggerService,
        private readonly flowsDataService: FlowsDataService,
        private readonly flowHelper: FlowHelper,
        private tokenValidationService: TokenValidationService
    ) {}

    getUrlParameter(urlToCheck: any, name: any): string {
        if (!urlToCheck) {
            return '';
        }

        if (!name) {
            return '';
        }

        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(urlToCheck);
        return results === null ? '' : decodeURIComponent(results[1]);
    }

    getRefreshSessionSilentRenewUrl(): string {
        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            return this.createUrlCodeFlowWithSilentRenew();
        }

        return this.createUrlImplicitFlowWithSilentRenew() || '';
    }

    getAuthorizeUrl(): string {
        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            return this.createUrlCodeFlowAuthorize();
        }

        return this.createUrlImplicitFlowAuthorize() || '';
    }

    createEndSessionUrl(endSessionEndpoint: string, idTokenHint: string) {
        const urlParts = endSessionEndpoint.split('?');

        const authorizationEndsessionUrl = urlParts[0];

        let params = new HttpParams({
            fromString: urlParts[1],
            encoder: new UriEncoder(),
        });
        params = params.set('id_token_hint', idTokenHint);
        params = params.append('post_logout_redirect_uri', this.configurationProvider.openIDConfiguration.postLogoutRedirectUri);

        return `${authorizationEndsessionUrl}?${params}`;
    }

    createBodyForCodeFlowCodeRequest(code: string): string {
        const codeVerifier = this.flowsDataService.getCodeVerifier();
        if (!codeVerifier) {
            this.loggerService.logWarning(`CodeVerifier is not set `, codeVerifier);
        }

        let data = oneLineTrim`grant_type=authorization_code&client_id=${this.configurationProvider.openIDConfiguration.clientId}
            &code_verifier=${codeVerifier}
            &code=${code}&redirect_uri=${this.configurationProvider.openIDConfiguration.redirectUrl}`;

        if (this.flowsDataService.isSilentRenewRunning()) {
            data = oneLineTrim`grant_type=authorization_code&client_id=${this.configurationProvider.openIDConfiguration.clientId}
                &code_verifier=${codeVerifier}
                &code=${code}
                &redirect_uri=${this.configurationProvider.openIDConfiguration.silentRenewUrl}`;
        }

        return data;
    }

    private createAuthorizeUrl(codeChallenge: string, redirectUrl: string, nonce: string, state: string, prompt?: string): string {
        const authorizationEndpoint = this.getAuthorizationEndpoint();

        if (!authorizationEndpoint) {
            this.loggerService.logError(`Can not create an authorize url when authorizationEndpoint is '${authorizationEndpoint}'`);
            return '';
        }

        const urlParts = this.getAuthorizationEndpoint().split('?');
        const authorizationUrl = urlParts[0];

        let params = new HttpParams({
            fromString: urlParts[1],
            encoder: new UriEncoder(),
        });

        params = params.set('client_id', this.configurationProvider.openIDConfiguration.clientId);
        params = params.append('redirect_uri', redirectUrl);
        params = params.append('response_type', this.configurationProvider.openIDConfiguration.responseType);
        params = params.append('scope', this.configurationProvider.openIDConfiguration.scope);
        params = params.append('nonce', nonce);
        params = params.append('state', state);

        if (this.isCodeFlow()) {
            params = params.append('code_challenge', codeChallenge);
            params = params.append('code_challenge_method', 'S256');
        }

        if (prompt) {
            params = params.append('prompt', prompt);
        }

        if (this.configurationProvider.openIDConfiguration.hdParam) {
            params = params.append('hd', this.configurationProvider.openIDConfiguration.hdParam);
        }

        const customParams = { ...this.configurationProvider.openIDConfiguration.customParams };

        for (const [key, value] of Object.entries(customParams)) {
            params = params.append(key, value.toString());
        }

        return `${authorizationUrl}?${params}`;
    }

    private isCodeFlow() {
        return this.configurationProvider.openIDConfiguration.responseType === 'code';
    }

    private getAuthorizationEndpoint() {
        // this.configurationProvider.wellKnownEndpoints.authorizationEndpoint
        return this.configurationProvider?.wellKnownEndpoints?.authorizationEndpoint;
    }

    private createUrlImplicitFlowWithSilentRenew(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + state);
        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl('', this.configurationProvider.openIDConfiguration.silentRenewUrl, nonce, state, 'none');
        } else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        }
        return '';
    }

    private createUrlCodeFlowWithSilentRenew(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + state);
        // code_challenge with "S256"
        const codeVerifier = this.flowsDataService.createCodeVerifier();
        const codeChallenge = this.tokenValidationService.generateCodeVerifier(codeVerifier);

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl(
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

    private createUrlImplicitFlowAuthorize(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();
        this.loggerService.logDebug('Authorize created. adding myautostate: ' + state);

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl('', this.configurationProvider.openIDConfiguration.redirectUrl, nonce, state);
        } else {
            this.loggerService.logError('authWellKnownEndpoints is undefined');
        }

        return '';
    }
    private createUrlCodeFlowAuthorize(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();
        this.loggerService.logDebug('Authorize created. adding myautostate: ' + state);
        // code_challenge with "S256"
        const codeVerifier = this.flowsDataService.createCodeVerifier();
        const codeChallenge = this.tokenValidationService.generateCodeVerifier(codeVerifier);

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl(codeChallenge, this.configurationProvider.openIDConfiguration.redirectUrl, nonce, state);
        } else {
            this.loggerService.logError('authWellKnownEndpoints is undefined');
        }
        return '';
    }
}
