import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { AuthResult } from '../flows/callback-context';
import { AuthStateResult } from './auth-state';

@Injectable()
export class AuthStateServiceMock {
  // event which contains the state
  private authenticatedInternal$ = new BehaviorSubject<boolean>(false);

  get authenticated$() {
    return this.authenticatedInternal$.asObservable();
  }

  setAuthenticatedAndFireEvent(allConfigs: OpenIdConfiguration[]): void {}

  setUnauthenticatedAndFireEvent(currentConfig: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {}

  updateAndPublishAuthState(authenticationResult: AuthStateResult): void {}

  setAuthorizationData(
    accessToken: string,
    authResult: AuthResult,
    currentConfig: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): void {}

  getAccessToken(configuration: OpenIdConfiguration): string {
    return null;
  }

  getIdToken(configuration: OpenIdConfiguration): string {
    return null;
  }

  getRefreshToken(configuration: OpenIdConfiguration): string {
    return null;
  }

  getAuthenticationResult(configuration: OpenIdConfiguration): any {
    return null;
  }

  areAuthStorageTokensValid(configuration: OpenIdConfiguration): boolean {
    return null;
  }

  hasIdTokenExpiredAndRenewCheckIsEnabled(configuration: OpenIdConfiguration): boolean {
    return null;
  }

  hasAccessTokenExpiredIfExpiryExists(configuration: OpenIdConfiguration): boolean {
    return null;
  }

  isAuthenticated(configuration: OpenIdConfiguration): boolean {
    return null;
  }
}
