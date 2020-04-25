import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
    constructor(public oidcSecurityService: OidcSecurityService, private router: Router) {}

    ngOnInit() {
        this.oidcSecurityService
            .checkAuth()

            .pipe(
                tap((isAuthenticated) => {
                    if (!isAuthenticated) {
                        if ('/autologin' !== window.location.pathname && !this.isCallback()) {
                            this.write('redirect', window.location.pathname);
                            this.router.navigate(['/autologin']);
                        }
                    }
                    if (isAuthenticated) {
                        this.onAuthorizationResultComplete(isAuthenticated);
                    }
                })
            )
            .subscribe((result) => console.log('result', result));
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

    private isCallback() {
        return window.location.toString().includes('?code');
    }

    private onAuthorizationResultComplete(isAuthenticated: boolean) {
        const path = this.read('redirect');

        if (!isAuthenticated) {
            this.router.navigate(['/unauthorized']);
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
