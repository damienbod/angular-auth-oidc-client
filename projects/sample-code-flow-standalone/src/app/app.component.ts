import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterOutlet, NavigationComponent],
})
export class AppComponent implements OnInit {
  constructor(private oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.oidcSecurityService
      .checkAuth()
      .subscribe(({ isAuthenticated, userData, accessToken }) => {
        console.log('app authenticated', isAuthenticated);
        console.log(`Current access token is '${accessToken}'`);
      });
  }

  login() {
    console.log('start login');
    this.oidcSecurityService.authorize();
  }

  refreshSession() {
    console.log('start refreshSession');
    this.oidcSecurityService.authorize();
  }

  logout() {
    console.log('start logoff');
    this.oidcSecurityService
      .logoff()
      .subscribe((result) => console.log(result));
  }
}
