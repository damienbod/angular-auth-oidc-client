import { Component, OnInit } from '@angular/core';
import {
  ConfigAuthenticatedResult,
  ConfigUserDataResult,
  OidcClientNotification,
  OidcSecurityService,
  OpenIdConfiguration,
} from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
})
export class HomeComponent implements OnInit {
  configurations: OpenIdConfiguration[];
  userDataChanged$: Observable<OidcClientNotification<any>>;
  userData$: Observable<ConfigUserDataResult>;
  isAuthenticated$: Observable<ConfigAuthenticatedResult>;

  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.configurations = this.oidcSecurityService.getConfigurations();
    this.userData$ = this.oidcSecurityService.userData$;
    this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
  }

  login(configId: string) {
    this.oidcSecurityService.authorize(configId);
  }

  loginWithPopup(configId: string) {
    this.oidcSecurityService
      .authorizeWithPopUp(null, null, configId)
      .subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
        console.log(isAuthenticated);
        console.log(userData);
        console.log(accessToken);
        console.log(errorMessage);
      });
  }

  openWindow() {
    window.open('/', '_blank');
  }

  forceRefreshSession() {
    this.oidcSecurityService.forceRefreshSession().subscribe((result) => console.warn(result));
  }

  logout(configId: string) {
    this.oidcSecurityService.logoff(configId);
  }

  refreshSessionId4(configId: string) {
    this.oidcSecurityService.forceRefreshSession(null, configId).subscribe((result) => console.log(result));
  }

  refreshSessionAuth0(configId: string) {
    this.oidcSecurityService
      .forceRefreshSession({ scope: 'openid profile offline_access auth0-user-api-spa' }, configId)
      .subscribe((result) => console.log(result));
  }

  logoffAndRevokeTokens(configId: string) {
    this.oidcSecurityService.logoffAndRevokeTokens(configId).subscribe((result) => console.log(result));
  }

  revokeRefreshToken(configId: string) {
    this.oidcSecurityService.revokeRefreshToken(null, configId).subscribe((result) => console.log(result));
  }
}
