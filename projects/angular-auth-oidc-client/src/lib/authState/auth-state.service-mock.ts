import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthorizationResult } from './authorization-result';

@Injectable()
export class AuthStateServiceMock {
    // event which contains the state
    private authorizedInternal$ = new BehaviorSubject<boolean>(false);

    get authorized$() {
        return this.authorizedInternal$.asObservable();
    }

    setAuthorizedAndFireEvent(): void {}

    setUnauthorizedAndFireEvent(): void {}

    initStateFromStorage(): void {}

    updateAndPublishAuthState(authorizationResult: AuthorizationResult) {}

    setAuthorizationData(accessToken: any, idToken: any) {}

    getAccessToken(): string {
        return '';
    }

    getIdToken(): string {
        return '';
    }

    getRefreshToken(): string {
        return '';
    }

    areAuthStorageTokensValid() {
        return true;
    }

    setAuthResultInStorage(authResult: any) {}

    hasIdTokenExpired() {
        return true;
    }

    hasAccessTokenExpiredIfExpiryExists() {
        return true;
    }
}
