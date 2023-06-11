import { Component, OnInit } from '@angular/core';
import {
  AuthenticatedResult,
  OidcClientNotification,
  OidcSecurityService,
  OpenIdConfiguration,
  UserDataResult,
} from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
})
export class HomeComponent implements OnInit {
  configurations: OpenIdConfiguration[];
  userDataChanged$: Observable<OidcClientNotification<any>>;
  userData$: Observable<UserDataResult>;
  isAuthenticated$: Observable<AuthenticatedResult>;

  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.configurations = this.oidcSecurityService.getConfigurations();
    this.userData$ = this.oidcSecurityService.userData$;
    this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
  }

  login(configId: string) {
    this.oidcSecurityService.authorize(configId);
  }

  forceRefreshSession() {
    this.oidcSecurityService
      .forceRefreshSession()
      .subscribe((result) => console.warn(result));
  }

  logout(configId: string) {
    this.oidcSecurityService.logoff(configId);
  }

  refreshSession(configId: string) {
    this.oidcSecurityService
      .forceRefreshSession(null, configId)
      .subscribe((result) => console.log(result));
  }
}
