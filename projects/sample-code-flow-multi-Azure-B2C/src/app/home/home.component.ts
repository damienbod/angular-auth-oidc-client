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

  login(configId: string | undefined) {
    this.oidcSecurityService.authorize(configId);
  }

  forceRefreshSession() {
    this.oidcSecurityService
      .forceRefreshSession()
      .subscribe((result) => console.warn(result));
  }

  logout(configId: string | undefined) {
    this.oidcSecurityService.logoff(configId);
  }

  refreshSession(configId: string | undefined) {
    this.oidcSecurityService
      .forceRefreshSession(undefined, configId)
      .subscribe((result) => console.log(result));
  }
}
