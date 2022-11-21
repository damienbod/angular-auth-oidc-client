import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthOptions } from '../../auth-options';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { FlowsDataService } from '../../flows/flows-data.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { JwtWindowCryptoService } from '../../validation/jwt-window-crypto.service';
import { FlowHelper } from '../flowHelper/flow-helper.service';
import { UriEncoder } from './uri-encoder';

const CALLBACK_PARAMS_TO_CHECK = ['code', 'state', 'token', 'id_token'];
const AUTH0_ENDPOINT = 'auth0.com';

@Injectable()
export class UrlService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly flowsDataService: FlowsDataService,
    private readonly flowHelper: FlowHelper,
    private readonly storagePersistenceService: StoragePersistenceService,
    private readonly jwtWindowCryptoService: JwtWindowCryptoService
  ) {}

  getUrlParameter(urlToCheck: string, name: string): string {
    if (!urlToCheck) {
      return '';
    }

    if (!name) {
      return '';
    }

    name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&#]' + name + '=([^&#]*)');
    const results = regex.exec(urlToCheck);

    return results === null ? '' : decodeURIComponent(results[1]);
  }

  isCallbackFromSts(currentUrl: string): boolean {
    return CALLBACK_PARAMS_TO_CHECK.some((x) => !!this.getUrlParameter(currentUrl, x));
  }

  getRefreshSessionSilentRenewUrl(
    config: OpenIdConfiguration,
    customParams?: { [key: string]: string | number | boolean }
  ): Observable<string> {
    if (this.flowHelper.isCurrentFlowCodeFlow(config)) {
      return this.createUrlCodeFlowWithSilentRenew(config, customParams);
    }

    return of(this.createUrlImplicitFlowWithSilentRenew(config, customParams) || '');
  }

  getAuthorizeParUrl(requestUri: string, configuration: OpenIdConfiguration): string {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configuration);

    if (!authWellKnownEndPoints) {
      this.loggerService.logError(configuration, 'authWellKnownEndpoints is undefined');

      return null;
    }

    const authorizationEndpoint = authWellKnownEndPoints.authorizationEndpoint;

    if (!authorizationEndpoint) {
      this.loggerService.logError(
        configuration,
        `Can not create an authorize URL when authorizationEndpoint is '${authorizationEndpoint}'`
      );

      return null;
    }

    const { clientId } = configuration;

    if (!clientId) {
      this.loggerService.logError(configuration, `getAuthorizeParUrl could not add clientId because it was: `, clientId);

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

  getAuthorizeUrl(config: OpenIdConfiguration, authOptions?: AuthOptions): Observable<string> {
    if (this.flowHelper.isCurrentFlowCodeFlow(config)) {
      return this.createUrlCodeFlowAuthorize(config, authOptions);
    }

    return of(this.createUrlImplicitFlowAuthorize(config, authOptions) || '');
  }

  getEndSessionEndpoint(configuration: OpenIdConfiguration): { url: string; existingParams: string } {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configuration);
    const endSessionEndpoint = authWellKnownEndPoints?.endSessionEndpoint;

    if (!endSessionEndpoint) {
      return {
        url: '',
        existingParams: '',
      };
    }

    const urlParts = endSessionEndpoint.split('?');
    const url = urlParts[0];
    const existingParams = urlParts[1] ?? '';

    return {
      url,
      existingParams,
    };
  }

  getEndSessionUrl(configuration: OpenIdConfiguration, customParams?: { [p: string]: string | number | boolean }): string | null {
    const idToken = this.storagePersistenceService.getIdToken(configuration);
    const { customParamsEndSessionRequest } = configuration;
    const mergedParams = { ...customParamsEndSessionRequest, ...customParams };

    return this.createEndSessionUrl(idToken, configuration, mergedParams);
  }

  createRevocationEndpointBodyAccessToken(token: any, configuration: OpenIdConfiguration): string {
    const clientId = this.getClientId(configuration);

    if (!clientId) {
      return null;
    }

    let params = this.createHttpParams();

    params = params.set('client_id', clientId);
    params = params.set('token', token);
    params = params.set('token_type_hint', 'access_token');

    return params.toString();
  }

  createRevocationEndpointBodyRefreshToken(token: any, configuration: OpenIdConfiguration): string {
    const clientId = this.getClientId(configuration);

    if (!clientId) {
      return null;
    }

    let params = this.createHttpParams();

    params = params.set('client_id', clientId);
    params = params.set('token', token);
    params = params.set('token_type_hint', 'refresh_token');

    return params.toString();
  }

  getRevocationEndpointUrl(configuration: OpenIdConfiguration): string {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configuration);
    const revocationEndpoint = authWellKnownEndPoints?.revocationEndpoint;

    if (!revocationEndpoint) {
      return null;
    }

    const urlParts = revocationEndpoint.split('?');

    const revocationEndpointUrl = urlParts[0];

    return revocationEndpointUrl;
  }

  createBodyForCodeFlowCodeRequest(
    code: string,
    configuration: OpenIdConfiguration,
    customTokenParams?: { [p: string]: string | number | boolean }
  ): string {
    const clientId = this.getClientId(configuration);

    if (!clientId) {
      return null;
    }

    let params = this.createHttpParams();

    params = params.set('grant_type', 'authorization_code');
    params = params.set('client_id', clientId);

    if (!configuration.disablePkce) {
      const codeVerifier = this.flowsDataService.getCodeVerifier(configuration);

      if (!codeVerifier) {
        this.loggerService.logError(configuration, `CodeVerifier is not set `, codeVerifier);

        return null;
      }

      params = params.set('code_verifier', codeVerifier);
    }

    params = params.set('code', code);

    if (customTokenParams) {
      params = this.appendCustomParams({ ...customTokenParams }, params);
    }

    const silentRenewUrl = this.getSilentRenewUrl(configuration);

    if (this.flowsDataService.isSilentRenewRunning(configuration) && silentRenewUrl) {
      params = params.set('redirect_uri', silentRenewUrl);

      return params.toString();
    }

    const redirectUrl = this.getRedirectUrl(configuration);

    if (!redirectUrl) {
      return null;
    }

    params = params.set('redirect_uri', redirectUrl);

    return params.toString();
  }

  createBodyForCodeFlowRefreshTokensRequest(
    refreshToken: string,
    configuration: OpenIdConfiguration,
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): string {
    const clientId = this.getClientId(configuration);

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

  createBodyForParCodeFlowRequest(
    configuration: OpenIdConfiguration,
    customParamsRequest?: { [key: string]: string | number | boolean }
  ): Observable<string> {
    const redirectUrl = this.getRedirectUrl(configuration);

    if (!redirectUrl) {
      return of(null);
    }

    const state = this.flowsDataService.getExistingOrCreateAuthStateControl(configuration);
    const nonce = this.flowsDataService.createNonce(configuration);

    this.loggerService.logDebug(configuration, 'Authorize created. adding myautostate: ' + state);

    // code_challenge with "S256"
    const codeVerifier = this.flowsDataService.createCodeVerifier(configuration);

    return this.jwtWindowCryptoService.generateCodeChallenge(codeVerifier).pipe(
      map((codeChallenge: string) => {
        const { clientId, responseType, scope, hdParam, customParamsAuthRequest } = configuration;
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
      })
    );
  }

  getPostLogoutRedirectUrl(configuration: OpenIdConfiguration): string {
    const { postLogoutRedirectUri } = configuration;

    if (!postLogoutRedirectUri) {
      this.loggerService.logError(configuration, `could not get postLogoutRedirectUri, was: `, postLogoutRedirectUri);

      return null;
    }

    return postLogoutRedirectUri;
  }

  private createEndSessionUrl(
    idTokenHint: string,
    configuration: OpenIdConfiguration,
    customParamsEndSession?: { [p: string]: string | number | boolean }
  ): string | null {
    // Auth0 needs a special logout url
    // See https://auth0.com/docs/api/authentication#logout

    if (this.isAuth0Endpoint(configuration)) {
      return this.composeAuth0Endpoint(configuration);
    }

    const { url, existingParams } = this.getEndSessionEndpoint(configuration);

    if (!url) {
      return null;
    }

    let params = this.createHttpParams(existingParams);

    if (!!idTokenHint) {
      params = params.set('id_token_hint', idTokenHint);
    }

    const postLogoutRedirectUri = this.getPostLogoutRedirectUrl(configuration);

    if (postLogoutRedirectUri) {
      params = params.append('post_logout_redirect_uri', postLogoutRedirectUri);
    }

    if (customParamsEndSession) {
      params = this.appendCustomParams({ ...customParamsEndSession }, params);
    }

    return `${url}?${params}`;
  }

  private createAuthorizeUrl(
    codeChallenge: string,
    redirectUrl: string,
    nonce: string,
    state: string,
    configuration: OpenIdConfiguration,
    prompt?: string,
    customRequestParams?: { [key: string]: string | number | boolean }
  ): string {
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configuration);
    const authorizationEndpoint = authWellKnownEndPoints?.authorizationEndpoint;

    if (!authorizationEndpoint) {
      this.loggerService.logError(
        configuration,
        `Can not create an authorize URL when authorizationEndpoint is '${authorizationEndpoint}'`
      );

      return null;
    }

    const { clientId, responseType, scope, hdParam, customParamsAuthRequest } = configuration;

    if (!clientId) {
      this.loggerService.logError(configuration, `createAuthorizeUrl could not add clientId because it was: `, clientId);

      return null;
    }

    if (!responseType) {
      this.loggerService.logError(configuration, `createAuthorizeUrl could not add responseType because it was: `, responseType);

      return null;
    }

    if (!scope) {
      this.loggerService.logError(configuration, `createAuthorizeUrl could not add scope because it was: `, scope);

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

    if (this.flowHelper.isCurrentFlowCodeFlow(configuration) && codeChallenge !== null) {
      params = params.append('code_challenge', codeChallenge);
      params = params.append('code_challenge_method', 'S256');
    }

    const mergedParams = { ...customParamsAuthRequest, ...customRequestParams };

    if (Object.keys(mergedParams).length > 0) {
      params = this.appendCustomParams({ ...mergedParams }, params);
    }

    if (prompt) {
      params = this.overWriteParam(params, 'prompt', prompt);
    }

    if (hdParam) {
      params = params.append('hd', hdParam);
    }

    return `${authorizationUrl}?${params}`;
  }

  private createUrlImplicitFlowWithSilentRenew(
    configuration: OpenIdConfiguration,
    customParams?: { [key: string]: string | number | boolean }
  ): string {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl(configuration);
    const nonce = this.flowsDataService.createNonce(configuration);
    const silentRenewUrl = this.getSilentRenewUrl(configuration);

    if (!silentRenewUrl) {
      return null;
    }

    this.loggerService.logDebug(configuration, 'RefreshSession created. adding myautostate: ', state);

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configuration);

    if (authWellKnownEndPoints) {
      return this.createAuthorizeUrl('', silentRenewUrl, nonce, state, configuration, 'none', customParams);
    }

    this.loggerService.logError(configuration, 'authWellKnownEndpoints is undefined');

    return null;
  }

  private createUrlCodeFlowWithSilentRenew(
    configuration: OpenIdConfiguration,
    customParams?: { [key: string]: string | number | boolean }
  ): Observable<string> {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl(configuration);
    const nonce = this.flowsDataService.createNonce(configuration);

    this.loggerService.logDebug(configuration, 'RefreshSession created. adding myautostate: ' + state);

    // code_challenge with "S256"
    const codeVerifier = this.flowsDataService.createCodeVerifier(configuration);

    return this.jwtWindowCryptoService.generateCodeChallenge(codeVerifier).pipe(
      map((codeChallenge: string) => {
        const silentRenewUrl = this.getSilentRenewUrl(configuration);

        if (!silentRenewUrl) {
          return '';
        }

        const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configuration);

        if (authWellKnownEndPoints) {
          return this.createAuthorizeUrl(codeChallenge, silentRenewUrl, nonce, state, configuration, 'none', customParams);
        }

        this.loggerService.logWarning(configuration, 'authWellKnownEndpoints is undefined');

        return null;
      })
    );
  }

  private createUrlImplicitFlowAuthorize(configuration: OpenIdConfiguration, authOptions?: AuthOptions): string {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl(configuration);
    const nonce = this.flowsDataService.createNonce(configuration);

    this.loggerService.logDebug(configuration, 'Authorize created. adding myautostate: ' + state);

    const redirectUrl = this.getRedirectUrl(configuration, authOptions);

    if (!redirectUrl) {
      return null;
    }

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configuration);

    if (authWellKnownEndPoints) {
      const { customParams } = authOptions || {};

      return this.createAuthorizeUrl('', redirectUrl, nonce, state, configuration, null, customParams);
    }

    this.loggerService.logError(configuration, 'authWellKnownEndpoints is undefined');

    return null;
  }

  private createUrlCodeFlowAuthorize(config: OpenIdConfiguration, authOptions?: AuthOptions): Observable<string> {
    const state = this.flowsDataService.getExistingOrCreateAuthStateControl(config);
    const nonce = this.flowsDataService.createNonce(config);

    this.loggerService.logDebug(config, 'Authorize created. adding myautostate: ' + state);

    const redirectUrl = this.getRedirectUrl(config, authOptions);

    if (!redirectUrl) {
      return of(null);
    }

    return this.getCodeChallenge(config).pipe(
      map((codeChallenge: string) => {
        const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', config);

        if (authWellKnownEndPoints) {
          const { customParams } = authOptions || {};

          return this.createAuthorizeUrl(codeChallenge, redirectUrl, nonce, state, config, null, customParams);
        }

        this.loggerService.logError(config, 'authWellKnownEndpoints is undefined');

        return '';
      })
    );
  }

  private getCodeChallenge(config: OpenIdConfiguration): Observable<string> {
    if (config.disablePkce) {
      return of(null);
    }

    // code_challenge with "S256"
    const codeVerifier = this.flowsDataService.createCodeVerifier(config);

    return this.jwtWindowCryptoService.generateCodeChallenge(codeVerifier);
  }

  private getRedirectUrl(configuration: OpenIdConfiguration, authOptions?: AuthOptions): string {
    let { redirectUrl } = configuration;

    if (authOptions?.redirectUrl) {
      // override by redirectUrl from authOptions
      redirectUrl = authOptions.redirectUrl;
    }

    if (!redirectUrl) {
      this.loggerService.logError(configuration, `could not get redirectUrl, was: `, redirectUrl);

      return null;
    }

    return redirectUrl;
  }

  private getSilentRenewUrl(configuration: OpenIdConfiguration): string {
    const { silentRenewUrl } = configuration;

    if (!silentRenewUrl) {
      this.loggerService.logError(configuration, `could not get silentRenewUrl, was: `, silentRenewUrl);

      return null;
    }

    return silentRenewUrl;
  }

  private getClientId(configuration: OpenIdConfiguration): string {
    const { clientId } = configuration;

    if (!clientId) {
      this.loggerService.logError(configuration, `could not get clientId, was: `, clientId);

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

  private overWriteParam(params: HttpParams, key: string, value: string | number | boolean): HttpParams {
    return params.set(key, value);
  }

  private createHttpParams(existingParams?: string): HttpParams {
    existingParams = existingParams ?? '';

    const params = new HttpParams({
      fromString: existingParams,
      encoder: new UriEncoder(),
    });

    return params;
  }

  private isAuth0Endpoint(configuration: OpenIdConfiguration): boolean {
    const { authority } = configuration;

    if (!authority) {
      return false;
    }

    return authority.endsWith(AUTH0_ENDPOINT);
  }

  private composeAuth0Endpoint(configuration: OpenIdConfiguration): string {
    // format: https://YOUR_DOMAIN/v2/logout?client_id=YOUR_CLIENT_ID&returnTo=LOGOUT_URL
    const { authority, clientId } = configuration;
    const postLogoutRedirectUrl = this.getPostLogoutRedirectUrl(configuration);

    return `${authority}/v2/logout?client_id=${clientId}&returnTo=${postLogoutRedirectUrl}`;
  }
}
