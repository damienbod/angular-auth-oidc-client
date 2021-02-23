import { Component, OnInit } from '@angular/core';
import { OidcClientNotification, OidcSecurityService, PublicConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
})
export class HomeComponent implements OnInit {
  configuration: PublicConfiguration;
  userDataChanged$: Observable<OidcClientNotification<any>>;
  userData$: Observable<any>;
  isAuthenticated = false;
  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.configuration = this.oidcSecurityService.configuration;
    this.userData$ = this.oidcSecurityService.userData$;

    this.oidcSecurityService.isAuthenticated$.subscribe((authenticated) => {
      this.isAuthenticated = authenticated;

      console.warn('authenticated: ', authenticated);
    });
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  loginWithPopup() {
    this.oidcSecurityService.authorizeWithPopUp().subscribe(({ isAuthenticated, userData, accessToken }) => {
      console.log(isAuthenticated);
      console.log(userData);
      console.log(accessToken);
    });
  }

  refreshSession() {
    this.oidcSecurityService.forceRefreshSession().subscribe((result) => console.log(result));
  }

  logout() {
    this.oidcSecurityService.logoff();
  }

  logoffAndRevokeTokens() {
    this.oidcSecurityService.logoffAndRevokeTokens().subscribe((result) => console.log(result));
  }

  revokeRefreshToken() {
    this.oidcSecurityService.revokeRefreshToken().subscribe((result) => console.log(result));
  }

  revokeAccessToken() {
    this.oidcSecurityService.revokeAccessToken().subscribe((result) => console.log(result));
  }
}
