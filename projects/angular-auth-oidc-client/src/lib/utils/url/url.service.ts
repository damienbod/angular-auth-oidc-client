import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { oneLineTrim } from 'common-tags';
import { ConfigurationProvider } from '../../config/config.provider';
import { FlowsDataService } from '../../flows/flows-data.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistanceService } from '../../storage/storage-persistance.service';
import { TokenValidationService } from '../../validation/token-validation.service';
import { FlowHelper } from '../flowHelper/flow-helper.service';
import { UriEncoder } from './uri-encoder';

const CALLBACK_PARAMS_TO_CHECK = ['code', 'state', 'token', 'id_token'];
@Injectable()
export class UrlService {
  constructor(
    private readonly configurationProvider: ConfigurationProvider,
    private readonly loggerService: LoggerService,
    private readonly flowsDataService: FlowsDataService,
    private readonly flowHelper: FlowHelper,
    private tokenValidationService: TokenValidationService,
    private storagePersistanceService: StoragePersistanceService
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

  isCallbackFromSts(currentUrl: string): boolean {
    return CALLBACK_PARAMS_TO_CHECK.some((x) => !!this.getUrlParameter(currentUrl, x));
  }

  getRefreshSessionSilentRenewUrl(customParams?: { [key: string]: string | number | boolean }): string {
    if (this.flowHelper.isCurrentFlowCodeFlow()) {
      return this.createUrlCodeFlowWithSilentRenew(customParams);
    }

    return this.createUrlImplicitFlowWithSilentRenew(customParams) || '';
  }

  getAuthorizeParUrl(requestUri: string): string {
    const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');

    if (!authWellKnownEndPoints) {
      this.loggerService.logError('authWellKnownEndpoints is undefined');
      return null;
    }

    const authorizationEndpoint = authWellKnownEndPoints.authorizationEndpoint;

    if (!authorizationEndpoint) {
      this.loggerService.logError(`Can not create an authorize url when authorizationEndpoint is '${authorizationEndpoint}'`);
      return null;
    }

    const { clientId } = this.configurationProvider.getOpenIDConfiguration();

    if (!clientId) {
      this.loggerService.logError(`createAuthorizeUrl could not add clientId because it was: `, clientId);
      return null;
    }

    const urlParts = authorizationEndpoint.split('?');
    const authorizationUrl = urlParts[0];

    let params = new HttpParams({
      fromString: urlParts[1],
      encoder: new UriEncoder(),
    });

    params = params.set('request_uri', requestUri);
    params = params.append('client_id', clientId);

    return `${authorizationUrl}?${params}`;
  }

  getAuthorizeUrl(customParams?: { [key: string]: string | number | boolean }): string {
    if (this.flowHelper.isCurrentFlowCodeFlow()) {
      return this.createUrlCodeFlowAuthorize(customParams);
    }

    return this.createUrlImplicitFlowAuthorize(customParams) || '';
  }

  createEndSessionUrl(idTokenHint: string): string {
    const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');
    const endSessionEndpoint = authWellKnownEndPoints?.endSessionEndpoint;

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

  createRevocationEndpointBodyAccessToken(token: any): string {
    const clientId = this.getClientId();

    if (!clientId) {
      return null;
    }

    return `client_id=${clientId}&token=${token}&token_type_hint=access_token`;
  }

  createRevocationEndpointBodyRefreshToken(token: any): string {
    const clientId = this.getClientId();

    if (!clientId) {
      return null;
    }

    return `client_id=${clientId}&token=${token}&token_type_hint=refresh_token`;
  }

  getRevocationEndpointUrl(): string {
    const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');
    const revocationEndpoint = authWellKnownEndPoints?.revocationEndpoint;

    if (!revocationEndpoint) {
      return null;
    }

    const urlParts = revocationEndpoint.split('?');

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

  createBodyForCodeFlowRefreshTokensRequest(refreshToken: string, customParams?: { [key: string]: string | number | boolean }): string {
    const clientId = this.getClientId();

    if (!clientId) {
      return null;
    }

    let dataForBody = oneLineTrim`grant_type=refresh_token
            &client_id=${clientId}
            &refresh_token=${refreshToken}`;

    if (customParams) {
      const customParamText = this.composeCustomParams({ ...customParams });
      dataForBody = `${dataForBody}${customParamText}`;
    }

    return dataForBody;
  }

  createBodyForParCodeFlowRequest(customParamsRequest?: { [key: string]: string | number | boolean }): string {
    const redirectUrl = this.getRedirectUrl();

    if (!redirectUrl) {
      return null;
    }

    const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
    const nonce = this.flowsDataService.createNonce();
    this.loggerService.logDebug('Authorize created. adding myautostate: ' + state);

    // code_challenge with "S256"
    const codeVerifier = this.flowsDataService.createCodeVerifier();
    const codeChallenge = this.tokenValidationService.generateCodeChallenge(codeVerifier);

    const { clientId, responseType, scope, hdParam, customParams } = this.configurationProvider.getOpenIDConfiguration();

    let dataForBody = oneLineTrim`client_id=${clientId}
            &redirect_uri=${redirectUrl}
            &response_type=${responseType}
            &scope=${scope}
            &nonce=${nonce}
            &state=${state}
            &code_challenge=${codeChallenge}
            &code_challenge_method=S256`;

    if (hdParam) {
      dataForBody = `${dataForBody}&hd=${hdParam}`;
    }

    if (customParams) {
      const customParamText = this.composeCustomParams({ ...customParams });
      dataForBody = `${dataForBody}${customParamText}`;
    }

    if (customParamsRequest) {
      const customParamText = this.composeCustomParams({ ...customParamsRequest });
      dataForBody = `${dataForBody}${customParamText}`;
    }

    return dataForBody;
  }

  private createAuthorizeUrl(
    codeChallenge: string,
    redirectUrl: string,
    nonce: string,
    state: string,
    prompt?: string,
    customRequestParams?: { [key: string]: string | number | boolean }
  ): string {
    const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');
    const authorizationEndpoint = authWellKnownEndPoints?.authorizationEndpoint;

    if (!authorizationEndpoint) {
      this.loggerService.logError(`Can not create an authorize url when authorizationEndpoint is '${authorizationEndpoint}'`);
      return null;
    }

    const { clientId, responseType, scope, hdParam, customParams } = this.configurationProvider.getOpenIDConfiguration();

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
      for (const [key, value] of Object.entries({ ...customParams })) {
        params = params.append(key, value.toString());
      }
    }

    if (customRequestParams) {
      for (const [key, value] of Object.entries({ ...customRequestParams })) {
        params = params.append(key, value.toString());
      }
    }

    return `${authorizationUrl}?${params}`;
  }

  private createUrlImplicitFlowWithSilentRenew(customParams?: { [key: string]: string | number | boolean }): string {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
    const nonce = this.flowsDataService.createNonce();

    const silentRenewUrl = this.getSilentRenewUrl();

    if (!silentRenewUrl) {
      return null;
    }

    this.loggerService.logDebug('RefreshSession created. adding myautostate: ', state);

    const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');
    if (authWellKnownEndPoints) {
      return this.createAuthorizeUrl('', silentRenewUrl, nonce, state, 'none', customParams);
    }

    this.loggerService.logError('authWellKnownEndpoints is undefined');
    return null;
  }

  private createUrlCodeFlowWithSilentRenew(customParams?: { [key: string]: string | number | boolean }): string {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
    const nonce = this.flowsDataService.createNonce();

    this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + state);

    // code_challenge with "S256"
    const codeVerifier = this.flowsDataService.createCodeVerifier();
    const codeChallenge = this.tokenValidationService.generateCodeChallenge(codeVerifier);

    const silentRenewUrl = this.getSilentRenewUrl();

    if (!silentRenewUrl) {
      return null;
    }

    const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');
    if (authWellKnownEndPoints) {
      return this.createAuthorizeUrl(codeChallenge, silentRenewUrl, nonce, state, 'none', customParams);
    }

    this.loggerService.logWarning('authWellKnownEndpoints is undefined');
    return null;
  }

  private createUrlImplicitFlowAuthorize(customParams?: { [key: string]: string | number | boolean }): string {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
    const nonce = this.flowsDataService.createNonce();
    this.loggerService.logDebug('Authorize created. adding myautostate: ' + state);

    const redirectUrl = this.getRedirectUrl();

    if (!redirectUrl) {
      return null;
    }

    const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');
    if (authWellKnownEndPoints) {
      return this.createAuthorizeUrl('', redirectUrl, nonce, state, null, customParams);
    }

    this.loggerService.logError('authWellKnownEndpoints is undefined');
    return null;
  }

  private createUrlCodeFlowAuthorize(customParams?: { [key: string]: string | number | boolean }): string {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
    const nonce = this.flowsDataService.createNonce();
    this.loggerService.logDebug('Authorize created. adding myautostate: ' + state);

    const redirectUrl = this.getRedirectUrl();

    if (!redirectUrl) {
      return null;
    }

    // code_challenge with "S256"
    const codeVerifier = this.flowsDataService.createCodeVerifier();
    const codeChallenge = this.tokenValidationService.generateCodeChallenge(codeVerifier);

    const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');
    if (authWellKnownEndPoints) {
      return this.createAuthorizeUrl(codeChallenge, redirectUrl, nonce, state, null, customParams);
    }

    this.loggerService.logError('authWellKnownEndpoints is undefined');
    return null;
  }

  private getRedirectUrl(): string {
    const { redirectUrl } = this.configurationProvider.getOpenIDConfiguration();

    if (!redirectUrl) {
      this.loggerService.logError(`could not get redirectUrl, was: `, redirectUrl);
      return null;
    }

    return redirectUrl;
  }

  private getSilentRenewUrl(): string {
    const { silentRenewUrl } = this.configurationProvider.getOpenIDConfiguration();

    if (!silentRenewUrl) {
      this.loggerService.logError(`could not get silentRenewUrl, was: `, silentRenewUrl);
      return null;
    }

    return silentRenewUrl;
  }

  private getPostLogoutRedirectUrl(): string {
    const { postLogoutRedirectUri } = this.configurationProvider.getOpenIDConfiguration();

    if (!postLogoutRedirectUri) {
      this.loggerService.logError(`could not get postLogoutRedirectUri, was: `, postLogoutRedirectUri);
      return null;
    }

    return postLogoutRedirectUri;
  }

  private getClientId(): string {
    const { clientId } = this.configurationProvider.getOpenIDConfiguration();

    if (!clientId) {
      this.loggerService.logError(`could not get clientId, was: `, clientId);
      return null;
    }

    return clientId;
  }

  private composeCustomParams(customParams: { [key: string]: string | number | boolean }) {
    let customParamText = '';

    for (const [key, value] of Object.entries(customParams)) {
      customParamText = customParamText.concat(`&${key}=${value.toString()}`);
    }

    return customParamText;
  }
}
