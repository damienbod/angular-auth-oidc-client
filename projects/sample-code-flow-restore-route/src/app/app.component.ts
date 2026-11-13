import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe, RouterLink, RouterOutlet],
  template: `
    <h1>Restore the current public route after login</h1>
    <nav>
      <a routerLink="/one">Route one</a>
      <a routerLink="/two">Route two</a>
    </nav>
    <p>Is Authenticated: {{ authenticated().isAuthenticated }}</p>
    @if (!authenticated().isAuthenticated) {
      <button (click)="login()">Login and return here</button>
    } @else {
      <button (click)="logout()">Logout</button>
      <pre>{{ userData() | json }}</pre>
    }
    <router-outlet />
  `,
})
export class AppComponent {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  protected readonly authenticated = this.oidcSecurityService.authenticated;
  protected readonly userData = this.oidcSecurityService.userData;

  login(): void {
    this.oidcSecurityService.authorize(undefined, { restoreRoute: true });
  }

  logout(): void {
    this.oidcSecurityService.logoff().subscribe();
  }
}
