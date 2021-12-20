import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    //this.oidcSecurityService.preloadAuthWellKnownDocument().subscribe();
    this.oidcSecurityService.checkAuthMultiple().subscribe(([{ isAuthenticated, userData, accessToken }]) => {
      console.log('Authenticated', isAuthenticated);
      console.log('Received Userdata', userData);
      console.log(`Current access token is '${accessToken}'`);
    });
  }
}
