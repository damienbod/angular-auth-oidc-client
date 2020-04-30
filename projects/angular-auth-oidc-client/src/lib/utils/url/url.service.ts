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

        const postLogoutRedirectUri = this.getPostLogoutRedirectUrl();

        if (postLogoutRedirectUri) {
            params = params.append('post_logout_redirect_uri', postLogoutRedirectUri);
        }

        return `${authorizationEndsessionUrl}?${params}`;
    }

    createRevocationEndpointBodyAccessToken(token: any) {
        const clientId = this.getClientId();

        if (!clientId) {
            return null;
        }

        return `client_id=${clientId}&token=${token}&token_type_hint=access_token`;
    }

    createRevocationEndpointBodyRefreshToken(token: any) {
        const clientId = this.getClientId();

        if (!clientId) {
            return null;
        }

        return `client_id=${clientId}&token=${token}&token_type_hint=refresh_token`;
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
            this.loggerService.logError(`CodeVerifier is not set `, codeVerifier);
            return null;
        }

        const clientId = this.getClientId();

        if (!clientId) {
            return null;
        }

        const dataForBody = oneLineTrim`grant_type=authorization_code
            &client_id=${clientId}
            &code_verifier=${codeVerifier}
            &code=${code}`;

        const silentRenewUrl = this.getSilentRenewUrl();

        if (this.flowsDataService.isSilentRenewRunning() && silentRenewUrl) {
            return oneLineTrim`${dataForBody}&redirect_uri=${silentRenewUrl}`;
        }

        const redirectUrl = this.getRedirectUrl();

        if (!redirectUrl) {
            return null;
        }

        return oneLineTrim`${dataForBody}&redirect_uri=${redirectUrl}`;
    }

    createBodyForCodeFlowRefreshTokensRequest(refreshtoken: string): string {
        const clientId = this.getClientId();

        if (!clientId) {
            return null;
        }

        return oneLineTrim`grant_type=refresh_token
          &client_id=${clientId}
          &refresh_token=${refreshtoken}`;
    }

    private createAuthorizeUrl(codeChallenge: string, redirectUrl: string, nonce: string, state: string, prompt?: string): string {
        const authorizationEndpoint = this.configurationProvider?.wellKnownEndpoints?.authorizationEndpoint;

        if (!authorizationEndpoint) {
            this.loggerService.logError(`Can not create an authorize url when authorizationEndpoint is '${authorizationEndpoint}'`);
            return null;
        }

        const { clientId, responseType, scope, hdParam, customParams } = this.configurationProvider.openIDConfiguration;

        if (!clientId) {
            this.loggerService.logError(`createAuthorizeUrl could not add clientId because it was: `, clientId);
            return null;
        }

        if (!responseType) {
            this.loggerService.logError(`createAuthorizeUrl could not add responseType because it was: `, responseType);
            return null;
        }

        if (!scope) {
            this.loggerService.logError(`createAuthorizeUrl could not add scope because it was: `, scope);
            return null;
        }

        const urlParts = authorizationEndpoint.split('?');
        const authorizationUrl = urlParts[0];

        let params = new HttpParams({
            fromString: urlParts[1],
            encoder: new UriEncoder(),
        });

        params = params.set('client_id', clientId);
        params = params.append('redirect_uri', redirectUrl);
        params = params.append('response_type', responseType);
        params = params.append('scope', scope);
        params = params.append('nonce', nonce);
        params = params.append('state', state);

        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            params = params.append('code_challenge', codeChallenge);
            params = params.append('code_challenge_method', 'S256');
        }

        if (prompt) {
            params = params.append('prompt', prompt);
        }

        if (hdParam) {
            params = params.append('hd', hdParam);
        }

        if (customParams) {
            for (const [key, value] of Object.entries(customParams)) {
                params = params.append(key, value.toString());
            }
        }

        return `${authorizationUrl}?${params}`;
    }

    private createUrlImplicitFlowWithSilentRenew(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();

        const silentRenewUrl = this.getSilentRenewUrl();

        if (!silentRenewUrl) {
            return null;
        }

        this.loggerService.logDebug('RefreshSession created. adding myautostate: ', state);

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl('', silentRenewUrl, nonce, state, 'none');
        }

        this.loggerService.logError('authWellKnownEndpoints is undefined');
        return null;
    }

    private createUrlCodeFlowWithSilentRenew(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();

        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + state);

        // code_challenge with "S256"
        const codeVerifier = this.flowsDataService.createCodeVerifier();
        const codeChallenge = this.tokenValidationService.generateCodeVerifier(codeVerifier);

        const silentRenewUrl = this.getSilentRenewUrl();

        if (!silentRenewUrl) {
            return null;
        }

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl(codeChallenge, silentRenewUrl, nonce, state, 'none');
        }

        this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        return null;
    }

    private createUrlImplicitFlowAuthorize(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();
        this.loggerService.logDebug('Authorize created. adding myautostate: ' + state);

        const redirectUrl = this.getRedirectUrl();

        if (!redirectUrl) {
            return null;
        }

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl('', redirectUrl, nonce, state);
        }

        this.loggerService.logError('authWellKnownEndpoints is undefined');
        return null;
    }

    private createUrlCodeFlowAuthorize(): string {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        const nonce = this.flowsDataService.createNonce();
        this.loggerService.logDebug('Authorize created. adding myautostate: ' + state);

        const redirectUrl = this.getRedirectUrl();

        if (!redirectUrl) {
            return null;
        }

        // code_challenge with "S256"
        const codeVerifier = this.flowsDataService.createCodeVerifier();
        const codeChallenge = this.tokenValidationService.generateCodeVerifier(codeVerifier);

        if (this.configurationProvider.wellKnownEndpoints) {
            return this.createAuthorizeUrl(codeChallenge, redirectUrl, nonce, state);
        }

        this.loggerService.logError('authWellKnownEndpoints is undefined');
        return '';
    }

    private getRedirectUrl() {
        const redirectUrl = this.configurationProvider.openIDConfiguration?.redirectUrl;

        if (!redirectUrl) {
            this.loggerService.logError(`could not get redirectUrl, was: `, redirectUrl);
            return null;
        }

        return redirectUrl;
    }

    private getSilentRenewUrl() {
        const silentRenewUrl = this.configurationProvider.openIDConfiguration?.silentRenewUrl;

        if (!silentRenewUrl) {
            this.loggerService.logError(`could not get silentRenewUrl, was: `, silentRenewUrl);
            return null;
        }

        return silentRenewUrl;
    }

    private getPostLogoutRedirectUrl() {
        const postLogoutRedirectUri = this.configurationProvider.openIDConfiguration?.postLogoutRedirectUri;
        if (!postLogoutRedirectUri) {
            this.loggerService.logError(`createEndSessionUrl could not add postLogoutRedirectUri because it was: `, postLogoutRedirectUri);
            return null;
        }

        return postLogoutRedirectUri;
    }

    private getClientId() {
        const clientId = this.configurationProvider.openIDConfiguration?.clientId;
        if (!clientId) {
            this.loggerService.logError(`createRevocationEndpointBodyAccessToken could not add clientId because it was: `, clientId);
            return null;
        }

        return clientId;
    }
}
