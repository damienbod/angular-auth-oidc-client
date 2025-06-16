import { Component, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  userData$ = this.oidcSecurityService.userData$;

  configuration$ = this.oidcSecurityService.getConfiguration();

  isAuthenticated = false;

  ngOnInit() {
    this.oidcSecurityService.isAuthenticated$.subscribe(
      ({ isAuthenticated }) => {
        this.isAuthenticated = isAuthenticated;

        console.info('authenticated: ', isAuthenticated);
      }
    );

    this.oidcSecurityService
      .checkAuth()
      .subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
        console.log(isAuthenticated);
        console.log(userData);
        console.log(accessToken);
        console.log(errorMessage);
      });
  }

  loginWithPopup() {
    this.oidcSecurityService
      .authorizeWithPopUp()
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
    this.oidcSecurityService
      .forceRefreshSession()
      .subscribe((result) => console.warn(result));
  }

  logout() {
    this.oidcSecurityService
      .logoff()
      .subscribe((result) => console.log(result));
  }
}
