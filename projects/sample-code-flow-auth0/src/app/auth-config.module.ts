import { Injectable, NgModule } from '@angular/core';
import { AbstractSecurityStorage, AuthModule, LogLevel } from 'angular-auth-oidc-client';

@Injectable()
export class CustomStorage implements AbstractSecurityStorage {
  read(key: string) {
    localStorage.getItem(key);
  }
  write(key: string, value: any): void {
    localStorage.setItem(key, value);
  }
  remove(key: string): void {
    localStorage.removeItem(key);
  }
  clear(): void {
    localStorage.clear();
  }
}

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        authority: 'https://dev-damienbod.eu.auth0.com',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'Ujh5oSBAFr1BuilgkZPcMWEgnuREgrwU',
        scope: 'openid profile offline_access auth0-user-api-spa',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        logLevel: LogLevel.Debug,
        customParamsAuthRequest: {
          audience: 'https://auth0-api-spa',
        },
        customParamsRefreshTokenRequest: {
          scope: 'openid profile offline_access auth0-user-api-spa',
        },
        storage: new CustomStorage(),
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
