import { Component, inject, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  standalone: false,
})
export class HomeComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  configuration$ = this.oidcSecurityService.getConfiguration();

  userData$ = this.oidcSecurityService.userData$;

  isAuthenticated = false;

  checkSessionChanged$ = this.oidcSecurityService.checkSessionChanged$;

  ngOnInit(): void {
    this.oidcSecurityService.isAuthenticated$.subscribe(
      ({ isAuthenticated }) => {
        this.isAuthenticated = isAuthenticated;

        console.warn('authenticated: ', isAuthenticated);
      }
    );
  }

  login(): void {
    this.oidcSecurityService.authorize();
  }

  refreshSession(): void {
    this.oidcSecurityService
      .forceRefreshSession()
      .subscribe((result) => console.log(result));
  }

  logout(): void {
    this.oidcSecurityService
      .logoff()
      .subscribe((result) => console.log(result));
  }

  logoffLocal(): void {
    this.oidcSecurityService.logoffLocal();
  }
}
