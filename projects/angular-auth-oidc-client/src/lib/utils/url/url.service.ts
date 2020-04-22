import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { UriEncoder } from './uri-encoder';

@Injectable()
export class UrlService {
    constructor(private readonly configurationProvider: ConfigurationProvider, private readonly loggerService: LoggerService) {}

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

    createAuthorizeUrl(codeChallenge: string, redirectUrl: string, nonce: string, state: string, prompt?: string): string {
        const authorizationEndpoint = this.getAuthorizationEndpoint();

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

    private isCodeFlow() {
        return this.configurationProvider.openIDConfiguration.responseType === 'code';
    }

    private getAuthorizationEndpoint() {
        return this.configurationProvider?.wellKnownEndpoints?.authorizationEndpoint;
    }
}
