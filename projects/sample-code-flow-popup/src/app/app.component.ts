import { Component } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'sample-code-flow-popup';

  userData$: Observable<any>;

  isAuthenticated: boolean;

  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.oidcSecurityService.checkAuth().subscribe((isAuthenticated) => {
      console.log('app authenticated', isAuthenticated);
      const at = this.oidcSecurityService.getToken();
      console.log(`Current access token is '${at}'`);
    });
  }

  loginWithPopup() {
    this.oidcSecurityService.authorizeWithPopUp().subscribe(({ isAuthenticated, userData, accessToken }) => {
      console.log(isAuthenticated);
      console.log(userData);
      console.log(accessToken);
    });
  }
}
