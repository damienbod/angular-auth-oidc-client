import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  imports: [AsyncPipe, JsonPipe],
  standalone: true,
})
export class HomeComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  userData$ = this.oidcSecurityService.userData$;

  isAuthenticated = false;

  ngOnInit(): void {
    this.oidcSecurityService.isAuthenticated$.subscribe(
      ({ isAuthenticated }) => {
        this.isAuthenticated = isAuthenticated;

        console.warn('authenticated: ', isAuthenticated);
      }
    );
  }
}
