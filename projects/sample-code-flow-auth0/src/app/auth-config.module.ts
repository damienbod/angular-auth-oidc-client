import { NgModule } from '@angular/core';
import { AbstractSecurityStorage, AuthModule, LogLevel } from 'angular-auth-oidc-client';

export class MyStorageService extends AbstractSecurityStorage {
  read(key: string) {
    throw new Error('Method not implemented.');
  }
  write(key: string, value: any): void {
    throw new Error('Method not implemented.');
  }
  remove(key: string): void {
    throw new Error('Method not implemented.');
  }
  clear(): void {
    throw new Error('Method not implemented.');
  }
  constructor() {
    super();
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
      },
    }),
  ],
  providers: [
    // { provide: AbstractSecurityStorage, useClass: MyStorageService },
    //{ provide: LoggerService, useClass: MyLoggerService },
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
