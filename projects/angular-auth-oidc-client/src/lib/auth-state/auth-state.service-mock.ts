import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthenticatedResult } from './auth-result';

@Injectable()
export class AuthStateServiceMock {
  // event which contains the state
  private authenticatedInternal$ = new BehaviorSubject<boolean>(false);

  get authenticated$() {
    return this.authenticatedInternal$.asObservable();
  }

  setAuthenticatedAndFireEvent(): void {}

  setUnauthenticatedAndFireEvent(): void {}

  initStateFromStorage(): void {}

  updateAndPublishAuthState(authorizationResult: AuthenticatedResult) {}

  setAuthorizationData(accessToken: any, idToken: any) {}

  getAccessToken(): string {
    return null;
  }

  getIdToken(): string {
    return null;
  }

  getRefreshToken(): string {
    return null;
  }

  areAuthStorageTokensValid() {
    return true;
  }

  setAuthResultInStorage(authResult: any) {}

  hasIdTokenExpiredAndRenewCheckIsEnabled() {
    return true;
  }

  hasAccessTokenExpiredIfExpiryExists() {
    return true;
  }

  isAuthenticated(configId: string): boolean {
    return true;
  }

  getAuthenticationResult(configId?: string): any {
    return null;
  }
}
