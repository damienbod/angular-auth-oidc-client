import { Component, OnInit, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
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

        console.warn('isAuthenticated: ', isAuthenticated);
      }
    );
  }

  login(): void {
    console.log('start login');
    this.oidcSecurityService.authorize();
  }

  refreshSessionCheckSession(): void {
    console.log('start refreshSession');
    this.oidcSecurityService.authorize();
  }

  forceRefreshSession(): void {
    this.oidcSecurityService
      .forceRefreshSession()
      .subscribe((result) => console.log(result));
  }

  logout(): void {
    console.log('start logoff');
    this.oidcSecurityService
      .logoff()
      .subscribe((result) => console.log(result));
  }
}
