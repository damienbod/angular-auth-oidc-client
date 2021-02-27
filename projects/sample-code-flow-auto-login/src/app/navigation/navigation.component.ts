import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navigation',
  templateUrl: 'navigation.component.html',
  styleUrls: ['navigation.component.css'],
})
export class NavigationComponent implements OnInit {
  isAuthenticated$: Observable<boolean>;

  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  refreshSession() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    this.oidcSecurityService.logoff();
  }
}
