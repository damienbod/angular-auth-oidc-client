import { Component, OnInit } from '@angular/core';
import { OidcClientNotification, OidcSecurityService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
})
export class HomeComponent implements OnInit {
  configurations: OpenIdConfiguration[];
  userDataChanged$: Observable<OidcClientNotification<any>>;
  userData$: Observable<any>;
  isAuthenticated$: Observable<any>;

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
    this.oidcSecurityService.forceRefreshSession().subscribe((result) => console.warn(result));
  }

  logout(configId: string) {
    this.oidcSecurityService.logoff(configId);
  }
}
