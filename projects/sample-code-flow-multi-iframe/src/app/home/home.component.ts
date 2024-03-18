import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
})
export class HomeComponent implements OnInit {
  configurations = this.oidcSecurityService.getConfigurations();
  userData$ = this.oidcSecurityService.userData$;
  isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;

  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {}

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
}
