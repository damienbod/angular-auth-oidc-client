import { Component } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
})
export class HomeComponent {
  configurations = this.oidcSecurityService.getConfigurations();

  userData$ = this.oidcSecurityService.userData$;

  isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;

  constructor(public oidcSecurityService: OidcSecurityService) {}

  login(configId: string): void {
    this.oidcSecurityService.authorize(configId);
  }

  loginWithPopup(configId: string | undefined): void {
    this.oidcSecurityService
      .authorizeWithPopUp(undefined, undefined, configId)
      .subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
        console.log(isAuthenticated);
        console.log(userData);
        console.log(accessToken);
        console.log(errorMessage);
      });
  }

  openWindow(): void {
    window.open('/', '_blank');
  }

  forceRefreshSession(): void {
    this.oidcSecurityService
      .forceRefreshSession()
      .subscribe((result) => console.warn(result));
  }

  logout(configId: string | undefined): void {
    this.oidcSecurityService
      .logoff(configId)
      .subscribe((result) => console.log(result));
  }

  refreshSessionId4(configId: string | undefined): void {
    this.oidcSecurityService
      .forceRefreshSession(undefined, configId)
      .subscribe((result) => console.log(result));
  }

  refreshSessionAuth0(configId: string | undefined): void {
    this.oidcSecurityService
      .forceRefreshSession(
        { scope: 'openid profile offline_access auth0-user-api-spa' },
        configId
      )
      .subscribe((result) => console.log(result));
  }

  logoffAndRevokeTokens(configId: string | undefined): void {
    this.oidcSecurityService
      .logoffAndRevokeTokens(configId)
      .subscribe((result) => console.log(result));
  }

  revokeRefreshToken(configId: string | undefined): void {
    this.oidcSecurityService
      .revokeRefreshToken(null, configId)
      .subscribe((result) => console.log(result));
  }
}
