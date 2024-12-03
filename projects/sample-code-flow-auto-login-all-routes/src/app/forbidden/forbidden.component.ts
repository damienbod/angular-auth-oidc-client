import { Component, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-forbidden',
    templateUrl: 'forbidden.component.html',
    standalone: false
})
export class ForbiddenComponent {
  public isAuthenticated$ = inject(OidcSecurityService).isAuthenticated$;
}
