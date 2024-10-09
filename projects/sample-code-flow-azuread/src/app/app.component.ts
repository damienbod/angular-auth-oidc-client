import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { NavMenuComponent } from './nav-menu/nav-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [RouterOutlet, NavMenuComponent],
  standalone: true,
})
export class AppComponent {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  login(): void {
    console.log('start login');
    this.oidcSecurityService.authorize();
  }

  refreshSession(): void {
    console.log('start refreshSession');
    this.oidcSecurityService.authorize();
  }

  logout(): void {
    console.log('start logoff');
    this.oidcSecurityService
      .logoff()
      .subscribe((result) => console.log(result));
  }
}
