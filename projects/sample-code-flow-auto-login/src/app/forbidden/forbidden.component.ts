import { Component, inject, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-forbidden',
  templateUrl: 'forbidden.component.html',
  standalone: false,
})
export class ForbiddenComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  public isAuthenticated = false;

  ngOnInit(): void {
    this.oidcSecurityService.isAuthenticated$.subscribe(
      ({ isAuthenticated }) => {
        this.isAuthenticated = isAuthenticated;

        console.warn('authenticated: ', isAuthenticated);
      }
    );
  }
}
