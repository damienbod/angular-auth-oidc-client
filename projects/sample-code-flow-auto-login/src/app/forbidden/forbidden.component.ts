import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-forbidden',
  templateUrl: 'forbidden.component.html',
})
export class ForbiddenComponent implements OnInit {
  public isAuthenticated = false;

  constructor(private oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.oidcSecurityService.isAuthenticated$.subscribe((authenticated: boolean) => {
      this.isAuthenticated = authenticated;

      console.warn('authenticated: ', authenticated);
    });
  }
}
