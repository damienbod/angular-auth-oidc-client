import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../../config/config.provider';
import { FlowsDataService } from '../../flows/flows-data.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
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
    private storagePersistenceService: StoragePersistenceService
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
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints');

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
    const existingParams = urlParts[1];
    let params = this.createHttpParams(existingParams);

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

  createEndSessionUrl(idTokenHint: string, customParams?: { [p: string]: string | number | boolean }): string {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints');
    const endSessionEndpoint = authWellKnownEndPoints?.endSessionEndpoint;

    if (!endSessionEndpoint) {
      return null;
    }

    const urlParts = endSessionEndpoint.split('?');
    const authorizationEndsessionUrl = urlParts[0];
    const existingParams = urlParts[1];
    let params = this.createHttpParams(existingParams);

    params = params.set('id_token_hint', idTokenHint);

    const postLogoutRedirectUri = this.getPostLogoutRedirectUrl();

    if (postLogoutRedirectUri) {
      params = params.append('post_logout_redirect_uri', postLogoutRedirectUri);
    }

    if (customParams) {
      params = this.appendCustomParams({ ...customParams }, params);
    }

    return `${authorizationEndsessionUrl}?${params}`;
  }

  createRevocationEndpointBodyAccessToken(token: any): string {
    const clientId = this.getClientId();

    if (!clientId) {
      return null;
    }

    let params = this.createHttpParams();
    params = params.set('client_id', clientId);
    params = params.set('token', token);
    params = params.set('token_type_hint', 'access_token');

    return params.toString();
  }

  createRevocationEndpointBodyRefreshToken(token: any): string {
    const clientId = this.getClientId();

    if (!clientId) {
      return null;
    }

    let params = this.createHttpParams();
    params = params.set('client_id', clientId);
    params = params.set('token', token);
    params = params.set('token_type_hint', 'refresh_token');

    return params.toString();
  }

  getRevocationEndpointUrl(): string {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints');
    const revocationEndpoint = authWellKnownEndPoints?.revocationEndpoint;

    if (!revocationEndpoint) {
      return null;
    }

    const urlParts = revocationEndpoint.split('?');

    const revocationEndpointUrl = urlParts[0];
    return revocationEndpointUrl;
  }

  createBodyForCodeFlowCodeRequest(code: string, customTokenParams?: { [p: string]: string | number | boolean }): string {
    const codeVerifier = this.flowsDataService.getCodeVerifier();
    if (!codeVerifier) {
      this.loggerService.logError(`CodeVerifier is not set `, codeVerifier);
      return null;
    }

    const clientId = this.getClientId();

    if (!clientId) {
      return null;
    }

    let params = this.createHttpParams();
    params = params.set('grant_type', 'authorization_code');
    params = params.set('client_id', clientId);
    params = params.set('code_verifier', codeVerifier);
    params = params.set('code', code);

    if (customTokenParams) {
      params = this.appendCustomParams({ ...customTokenParams }, params);
    }

    const silentRenewUrl = this.getSilentRenewUrl();

    if (this.flowsDataService.isSilentRenewRunning() && silentRenewUrl) {
      params = params.set('redirect_uri', silentRenewUrl);
      return params.toString();
    }

    const redirectUrl = this.getRedirectUrl();

    if (!redirectUrl) {
      return null;
    }

    params = params.set('redirect_uri', redirectUrl);
    return params.toString();
  }

  createBodyForCodeFlowRefreshTokensRequest(refreshToken: string, customParams?: { [key: string]: string | number | boolean }): string {
    const clientId = this.getClientId();

    if (!clientId) {
      return null;
    }

    let params = this.createHttpParams();
    params = params.set('grant_type', 'refresh_token');
    params = params.set('client_id', clientId);
    params = params.set('refresh_token', refreshToken);

    if (customParams) {
      params = this.appendCustomParams({ ...customParams }, params);
    }

    return params.toString();
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

    let params = this.createHttpParams('');
    params = params.set('client_id', clientId);
    params = params.append('redirect_uri', redirectUrl);
    params = params.append('response_type', responseType);
    params = params.append('scope', scope);
    params = params.append('nonce', nonce);
    params = params.append('state', state);
    params = params.append('code_challenge', codeChallenge);
    params = params.append('code_challenge_method', 'S256');

    if (hdParam) {
      params = params.append('hd', hdParam);
    }

    if (customParams) {
      params = this.appendCustomParams({ ...customParams }, params);
    }

    if (customParamsRequest) {
      params = this.appendCustomParams({ ...customParamsRequest }, params);
    }

    return params.toString();
  }

  private createAuthorizeUrl(
    codeChallenge: string,
    redirectUrl: string,
    nonce: string,
    state: string,
    prompt?: string,
    customRequestParams?: { [key: string]: string | number | boolean }
  ): string {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints');
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
    const existingParams = urlParts[1];
    let params = this.createHttpParams(existingParams);

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

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints');
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

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints');
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

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints');
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

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints');
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

  private appendCustomParams(customParams: { [key: string]: string | number | boolean }, params: HttpParams): HttpParams {
    for (const [key, value] of Object.entries({ ...customParams })) {
      params = params.append(key, value.toString());
    }

    return params;
  }

  private createHttpParams(existingParams?: string): HttpParams {
    existingParams = existingParams ?? '';

    const params = new HttpParams({
      fromString: existingParams,
      encoder: new UriEncoder(),
    });

    return params;
  }
}
