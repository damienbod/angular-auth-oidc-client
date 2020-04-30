import { HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { oneLineTrim } from 'common-tags';
import { ConfigurationProvider } from '../../config/config.provider';
import { FlowsDataService } from '../../flows/flows-data.service';
import { LoggerService } from '../../logging/logger.service';
import { TokenValidationService } from '../../validation/token-validation.service';
import { FlowHelper } from '../flowHelper/flow-helper.service';
import { WindowToken } from '../window/window.reference';
import { UriEncoder } from './uri-encoder';

@Injectable()
export class UrlService {
    private CALLBACK_PARAMS_TO_CHECK = ['code', 'state', 'token', 'id_token'];

    constructor(
        private readonly configurationProvider: ConfigurationProvider,
        private readonly loggerService: LoggerService,
        private readonly flowsDataService: FlowsDataService,
        private readonly flowHelper: FlowHelper,
        private tokenValidationService: TokenValidationService,
        @Inject(WindowToken) private window: Window
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

    isCallbackFromSts() {
        const anyParameterIsGiven = this.CALLBACK_PARAMS_TO_CHECK.some((x) => !!this.getUrlParameter(this.window.location.toString(), x));
        return anyParameterIsGiven;
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

    createEndSessionUrl(idTokenHint: string) {
        const endSessionEndpoint = this.configurationProvider.wellKnownEndpoints?.endSessionEndpoint;

        if (!endSessionEndpoint) {
            return null;
        }

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
    createRevocationEndpointBodyAccessToken(token: any) {
        return `client_id=${this.configurationProvider.openIDConfiguration.clientId}&token=${token}&token_type_hint=access_token`;
    }

    createRevocationEndpointBodyRefreshToken(token: any) {
        return `client_id=${this.configurationProvider.openIDConfiguration.clientId}&token=${token}&token_type_hint=refresh_token`;
    }

    getRevocationEndpointUrl() {
        const endSessionEndpoint = this.configurationProvider.wellKnownEndpoints?.revocationEndpoint;

        if (!endSessionEndpoint) {
            return null;
        }

        const urlParts = endSessionEndpoint.split('?');

        const revocationEndpointUrl = urlParts[0];
        return revocationEndpointUrl;
    }

    createBodyForCodeFlowCodeRequest(code: string): string {
        const codeVerifier = this.flowsDataService.getCodeVerifier();
        if (!codeVerifier) {
            this.loggerService.logWarning(`CodeVerifier is not set `, codeVerifier);
            return null;
        }

        const url = oneLineTrim`grant_type=authorization_code
            &client_id=${this.configurationProvider.openIDConfiguration.clientId}
            &code_verifier=${codeVerifier}
            &code=${code}`;

        if (this.flowsDataService.isSilentRenewRunning()) {
            return oneLineTrim`${url}&redirect_uri=${this.configurationProvider.openIDConfiguration.silentRenewUrl}`;
        }

        return oneLineTrim`${url}&redirect_uri=${this.configurationProvider.openIDConfiguration.redirectUrl}`;
    }

    createBodyForCodeFlowRefreshTokensRequest(refreshtoken: string): string {
        return oneLineTrim`grant_type=refresh_token
          &client_id=${this.configurationProvider.openIDConfiguration.clientId}
          &refresh_token=${refreshtoken}`;
    }

    private createAuthorizeUrl(codeChallenge: string, redirectUrl: string, nonce: string, state: string, prompt?: string): string {
        const authorizationEndpoint = this.configurationProvider?.wellKnownEndpoints?.authorizationEndpoint;

        if (!authorizationEndpoint) {
            this.loggerService.logError(`Can not create an authorize url when authorizationEndpoint is '${authorizationEndpoint}'`);
            return '';
        }

        const urlParts = authorizationEndpoint.split('?');
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

        if (this.flowHelper.isCurrentFlowCodeFlow()) {
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

    private createUrlImplicitFlowWithSilentRenew(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();
        const silentRenewUrl = this.configurationProvider.openIDConfiguration.silentRenewUrl;

        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + state);

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl('', silentRenewUrl, nonce, state, 'none');
        }

        this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        return '';
    }

    private createUrlCodeFlowWithSilentRenew(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();

        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + state);

        // code_challenge with "S256"
        const codeVerifier = this.flowsDataService.createCodeVerifier();
        const codeChallenge = this.tokenValidationService.generateCodeVerifier(codeVerifier);
        const silentRenewUrl = this.configurationProvider.openIDConfiguration.silentRenewUrl;

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl(codeChallenge, silentRenewUrl, nonce, state, 'none');
        }

        this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        return '';
    }

    private createUrlImplicitFlowAuthorize(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();
        this.loggerService.logDebug('Authorize created. adding myautostate: ' + state);
        const redirectUrl = this.configurationProvider.openIDConfiguration.redirectUrl;

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl('', redirectUrl, nonce, state);
        }

        this.loggerService.logError('authWellKnownEndpoints is undefined');
        return '';
    }

    private createUrlCodeFlowAuthorize(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();
        this.loggerService.logDebug('Authorize created. adding myautostate: ' + state);
        const redirectUrl = this.configurationProvider.openIDConfiguration.redirectUrl;

        // code_challenge with "S256"
        const codeVerifier = this.flowsDataService.createCodeVerifier();
        const codeChallenge = this.tokenValidationService.generateCodeVerifier(codeVerifier);

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl(codeChallenge, redirectUrl, nonce, state);
        }

        this.loggerService.logError('authWellKnownEndpoints is undefined');
        return '';
    }
}
