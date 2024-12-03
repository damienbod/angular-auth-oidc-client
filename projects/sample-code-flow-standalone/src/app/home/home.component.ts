import { JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
    imports: [JsonPipe]
})
export class HomeComponent {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  protected readonly userData = this.oidcSecurityService.userData;
  protected readonly authenticated = this.oidcSecurityService.authenticated;
}
