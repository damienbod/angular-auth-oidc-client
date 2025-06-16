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

  title = 'sample-code-flow-auto-login-all-routes';

  ngOnInit() {
    this.oidcSecurityService
      .checkAuth()
      .subscribe(
        ({ isAuthenticated, userData, accessToken, idToken, configId }) => {
          console.log('callback authenticated', isAuthenticated);
        }
      );
  }
}
