import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../../config/provider/config.provider';
import { FlowsDataService } from '../../flows/flows-data.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { JsrsAsignReducedService } from '../../validation/jsrsasign-reduced.service';
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
    private storagePersistenceService: StoragePersistenceService,
    private jsrsAsignReducedService: JsrsAsignReducedService
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

  getRefreshSessionSilentRenewUrl(configId: string, customParams?: { [key: string]: string | number | boolean }): string {
    if (this.flowHelper.isCurrentFlowCodeFlow(configId)) {
      return this.createUrlCodeFlowWithSilentRenew(configId, customParams);
    }

    return this.createUrlImplicitFlowWithSilentRenew(configId, customParams) || '';
  }

  getAuthorizeParUrl(requestUri: string, configId: string): string {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);

    if (!authWellKnownEndPoints) {
      this.loggerService.logError(configId, 'authWellKnownEndpoints is undefined');
      return null;
    }

    const authorizationEndpoint = authWellKnownEndPoints.authorizationEndpoint;

    if (!authorizationEndpoint) {
      this.loggerService.logError(configId, `Can not create an authorize url when authorizationEndpoint is '${authorizationEndpoint}'`);
      return null;
    }

    const { clientId } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!clientId) {
      this.loggerService.logError(configId, `getAuthorizeParUrl could not add clientId because it was: `, clientId);
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

  getAuthorizeUrl(configId: string, customParams?: { [key: string]: string | number | boolean }): string {
    if (this.flowHelper.isCurrentFlowCodeFlow(configId)) {
      return this.createUrlCodeFlowAuthorize(configId, customParams);
    }

    return this.createUrlImplicitFlowAuthorize(configId, customParams) || '';
  }

  createEndSessionUrl(idTokenHint: string, configId: string, customParamsEndSession?: { [p: string]: string | number | boolean }): string {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    const endSessionEndpoint = authWellKnownEndPoints?.endSessionEndpoint;

    if (!endSessionEndpoint) {
      return null;
    }

    const urlParts = endSessionEndpoint.split('?');
    const authorizationEndSessionUrl = urlParts[0];
    const existingParams = urlParts[1];
    let params = this.createHttpParams(existingParams);

    params = params.set('id_token_hint', idTokenHint);

    const postLogoutRedirectUri = this.getPostLogoutRedirectUrl(configId);

    if (postLogoutRedirectUri) {
      params = params.append('post_logout_redirect_uri', postLogoutRedirectUri);
    }

    if (customParamsEndSession) {
      params = this.appendCustomParams({ ...customParamsEndSession }, params);
    }

    return `${authorizationEndSessionUrl}?${params}`;
  }

  createRevocationEndpointBodyAccessToken(token: any, configId: string): string {
    const clientId = this.getClientId(configId);

    if (!clientId) {
      return null;
    }

    let params = this.createHttpParams();
    params = params.set('client_id', clientId);
    params = params.set('token', token);
    params = params.set('token_type_hint', 'access_token');

    return params.toString();
  }

  createRevocationEndpointBodyRefreshToken(token: any, configId: string): string {
    const clientId = this.getClientId(configId);

    if (!clientId) {
      return null;
    }

    let params = this.createHttpParams();
    params = params.set('client_id', clientId);
    params = params.set('token', token);
    params = params.set('token_type_hint', 'refresh_token');

    return params.toString();
  }

  getRevocationEndpointUrl(configId: string): string {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    const revocationEndpoint = authWellKnownEndPoints?.revocationEndpoint;

    if (!revocationEndpoint) {
      return null;
    }

    const urlParts = revocationEndpoint.split('?');

    const revocationEndpointUrl = urlParts[0];
    return revocationEndpointUrl;
  }

  createBodyForCodeFlowCodeRequest(code: string, configId: string, customTokenParams?: { [p: string]: string | number | boolean }): string {
    const codeVerifier = this.flowsDataService.getCodeVerifier(configId);
    if (!codeVerifier) {
      this.loggerService.logError(configId, `CodeVerifier is not set `, codeVerifier);
      return null;
    }

    const clientId = this.getClientId(configId);

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

    const silentRenewUrl = this.getSilentRenewUrl(configId);

    if (this.flowsDataService.isSilentRenewRunning(configId) && silentRenewUrl) {
      params = params.set('redirect_uri', silentRenewUrl);
      return params.toString();
    }

    const redirectUrl = this.getRedirectUrl(configId);

    if (!redirectUrl) {
      return null;
    }

    params = params.set('redirect_uri', redirectUrl);
    return params.toString();
  }

  createBodyForCodeFlowRefreshTokensRequest(
    refreshToken: string,
    configId: string,
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): string {
    const clientId = this.getClientId(configId);

    if (!clientId) {
      return null;
    }

    let params = this.createHttpParams();
    params = params.set('grant_type', 'refresh_token');
    params = params.set('client_id', clientId);
    params = params.set('refresh_token', refreshToken);

    if (customParamsRefresh) {
      params = this.appendCustomParams({ ...customParamsRefresh }, params);
    }

    return params.toString();
  }

  createBodyForParCodeFlowRequest(configId: string, customParamsRequest?: { [key: string]: string | number | boolean }): string {
    const redirectUrl = this.getRedirectUrl(configId);

    if (!redirectUrl) {
      return null;
    }

    const state = this.flowsDataService.getExistingOrCreateAuthStateControl(configId);
    const nonce = this.flowsDataService.createNonce(configId);
    this.loggerService.logDebug(configId, 'Authorize created. adding myautostate: ' + state);

    // code_challenge with "S256"
    const codeVerifier = this.flowsDataService.createCodeVerifier(configId);
    const codeChallenge = this.jsrsAsignReducedService.generateCodeChallenge(codeVerifier);

    const { clientId, responseType, scope, hdParam, customParamsAuthRequest } = this.configurationProvider.getOpenIDConfiguration(configId);

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

    if (customParamsAuthRequest) {
      params = this.appendCustomParams({ ...customParamsAuthRequest }, params);
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
    configId: string,
    prompt?: string,
    customRequestParams?: { [key: string]: string | number | boolean }
  ): string {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    const authorizationEndpoint = authWellKnownEndPoints?.authorizationEndpoint;

    if (!authorizationEndpoint) {
      this.loggerService.logError(configId, `Can not create an authorize url when authorizationEndpoint is '${authorizationEndpoint}'`);
      return null;
    }

    const { clientId, responseType, scope, hdParam, customParamsAuthRequest } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!clientId) {
      this.loggerService.logError(configId, `createAuthorizeUrl could not add clientId because it was: `, clientId);
      return null;
    }

    if (!responseType) {
      this.loggerService.logError(configId, `createAuthorizeUrl could not add responseType because it was: `, responseType);
      return null;
    }

    if (!scope) {
      this.loggerService.logError(configId, `createAuthorizeUrl could not add scope because it was: `, scope);
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

    if (this.flowHelper.isCurrentFlowCodeFlow(configId)) {
      params = params.append('code_challenge', codeChallenge);
      params = params.append('code_challenge_method', 'S256');
    }

    if (prompt) {
      params = params.append('prompt', prompt);
    }

    if (hdParam) {
      params = params.append('hd', hdParam);
    }

    const mergedParams = { ...customParamsAuthRequest, ...customRequestParams };

    if (Object.keys(mergedParams).length > 0) {
      params = this.appendCustomParams({ ...mergedParams }, params);
    }

    return `${authorizationUrl}?${params}`;
  }

  private createUrlImplicitFlowWithSilentRenew(configId: string, customParams?: { [key: string]: string | number | boolean }): string {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl(configId);
    const nonce = this.flowsDataService.createNonce(configId);

    const silentRenewUrl = this.getSilentRenewUrl(configId);

    if (!silentRenewUrl) {
      return null;
    }

    this.loggerService.logDebug(configId, 'RefreshSession created. adding myautostate: ', state);

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    if (authWellKnownEndPoints) {
      return this.createAuthorizeUrl('', silentRenewUrl, nonce, state, configId, 'none', customParams);
    }

    this.loggerService.logError(configId, 'authWellKnownEndpoints is undefined');
    return null;
  }

  private createUrlCodeFlowWithSilentRenew(configId: string, customParams?: { [key: string]: string | number | boolean }): string {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl(configId);
    const nonce = this.flowsDataService.createNonce(configId);

    this.loggerService.logDebug(configId, 'RefreshSession created. adding myautostate: ' + state);

    // code_challenge with "S256"
    const codeVerifier = this.flowsDataService.createCodeVerifier(configId);
    const codeChallenge = this.jsrsAsignReducedService.generateCodeChallenge(codeVerifier);

    const silentRenewUrl = this.getSilentRenewUrl(configId);

    if (!silentRenewUrl) {
      return null;
    }

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    if (authWellKnownEndPoints) {
      return this.createAuthorizeUrl(codeChallenge, silentRenewUrl, nonce, state, configId, 'none', customParams);
    }

    this.loggerService.logWarning(configId, 'authWellKnownEndpoints is undefined');
    return null;
  }

  private createUrlImplicitFlowAuthorize(configId: string, customParams?: { [key: string]: string | number | boolean }): string {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl(configId);
    const nonce = this.flowsDataService.createNonce(configId);
    this.loggerService.logDebug(configId, 'Authorize created. adding myautostate: ' + state);

    const redirectUrl = this.getRedirectUrl(configId);

    if (!redirectUrl) {
      return null;
    }

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    if (authWellKnownEndPoints) {
      return this.createAuthorizeUrl('', redirectUrl, nonce, state, configId, null, customParams);
    }

    this.loggerService.logError(configId, 'authWellKnownEndpoints is undefined');
    return null;
  }

  private createUrlCodeFlowAuthorize(configId: string, customParams?: { [key: string]: string | number | boolean }): string {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl(configId);
    const nonce = this.flowsDataService.createNonce(configId);
    this.loggerService.logDebug(configId, 'Authorize created. adding myautostate: ' + state);

    const redirectUrl = this.getRedirectUrl(configId);

    if (!redirectUrl) {
      return null;
    }

    // code_challenge with "S256"
    const codeVerifier = this.flowsDataService.createCodeVerifier(configId);
    const codeChallenge = this.jsrsAsignReducedService.generateCodeChallenge(codeVerifier);

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    if (authWellKnownEndPoints) {
      return this.createAuthorizeUrl(codeChallenge, redirectUrl, nonce, state, configId, null, customParams);
    }

    this.loggerService.logError(configId, 'authWellKnownEndpoints is undefined');
    return null;
  }

  private getRedirectUrl(configId: string): string {
    const { redirectUrl } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!redirectUrl) {
      this.loggerService.logError(configId, `could not get redirectUrl, was: `, redirectUrl);
      return null;
    }

    return redirectUrl;
  }

  private getSilentRenewUrl(configId: string): string {
    const { silentRenewUrl } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!silentRenewUrl) {
      this.loggerService.logError(configId, `could not get silentRenewUrl, was: `, silentRenewUrl);
      return null;
    }

    return silentRenewUrl;
  }

  private getPostLogoutRedirectUrl(configId: string): string {
    const { postLogoutRedirectUri } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!postLogoutRedirectUri) {
      this.loggerService.logError(configId, `could not get postLogoutRedirectUri, was: `, postLogoutRedirectUri);
      return null;
    }

    return postLogoutRedirectUri;
  }

  private getClientId(configId: string): string {
    const { clientId } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!clientId) {
      this.loggerService.logError(configId, `could not get clientId, was: `, clientId);
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
