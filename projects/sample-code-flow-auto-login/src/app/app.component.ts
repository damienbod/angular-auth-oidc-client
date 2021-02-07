import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {}

  ngOnInit() {
    this.oidcSecurityService
      .checkAuth()

      .subscribe((isAuthenticated) => {
        if (!isAuthenticated) {
          if ('/autologin' !== window.location.pathname) {
            this.write('redirect', window.location.pathname);
            this.router.navigate(['/autologin']);
          }
        }
        if (isAuthenticated) {
          this.navigateToStoredEndpoint();
        }
      });
  }

  login() {
    console.log('start login');
    this.oidcSecurityService.authorize();
  }

  refreshSession() {
    console.log('start refreshSession');
    this.oidcSecurityService.authorize();
  }

  logout() {
    console.log('start logoff');
    this.oidcSecurityService.logoff();
  }

  private navigateToStoredEndpoint() {
    const path = this.read('redirect');

    if (this.router.url === path) {
      return;
    }

    if (path.toString().includes('/unauthorized')) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate([path]);
    }
  }

  private read(key: string): any {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }

    return;
  }

  private write(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
