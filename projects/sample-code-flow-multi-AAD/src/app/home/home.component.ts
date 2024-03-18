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

  login(configId: string | undefined): void {
    this.oidcSecurityService.authorize(configId);
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

  refreshSession(configId: string | undefined): void {
    this.oidcSecurityService
      .forceRefreshSession(undefined, configId)
      .subscribe((result) => console.log(result));
  }
}
