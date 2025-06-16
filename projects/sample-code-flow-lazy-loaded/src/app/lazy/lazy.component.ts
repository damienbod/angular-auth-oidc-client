import { Component, inject, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-lazy',
  templateUrl: './lazy.component.html',
  styleUrls: ['./lazy.component.css'],
  standalone: false,
})
export class LazyComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  isAuthenticated = false;

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

  logout(): void {
    this.oidcSecurityService
      .logoff()
      .subscribe((result) => console.log(result));
  }
}
