import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-auto-component',
  templateUrl: './auto-login.component.html',
})
export class AutoLoginComponent implements OnInit {
  lang: any;

  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.oidcSecurityService
      .checkAuth()
      .subscribe(() => this.oidcSecurityService.authorize());
  }
}
