import { Component, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-forbidden',
  templateUrl: 'forbidden.component.html',
  standalone: true,
})
export class ForbiddenComponent {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  protected readonly authenticated = this.oidcSecurityService.authenticated;
}
