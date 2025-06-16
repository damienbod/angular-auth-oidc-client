import { Component, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  standalone: false,
})
export class HomeComponent {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  configurations = this.oidcSecurityService.getConfigurations();

  userData$ = this.oidcSecurityService.userData$;

  isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;

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
