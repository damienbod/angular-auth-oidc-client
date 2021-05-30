import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
})
export class HomeComponent implements OnInit {
  userData$: Observable<any>;
  isAuthenticated: false;

  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.oidcSecurityService.isAuthenticated$.subscribe((authenticated: boolean) => {
      this.isAuthenticated = authenticated;

      console.warn('authenticated: ', authenticated);
    });
    this.userData$ = this.oidcSecurityService.userData$;
  }
}
