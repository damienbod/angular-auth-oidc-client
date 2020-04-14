import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthorizationResult, AuthorizationState, OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent {
    title = 'app';

    constructor(public oidcSecurityService: OidcSecurityService, private router: Router) {
        if (this.oidcSecurityService.moduleSetup) {
            this.onOidcModuleSetup();
        } else {
            this.oidcSecurityService.onModuleSetup.subscribe(() => {
                this.onOidcModuleSetup();
            });
        }

        this.oidcSecurityService.onAuthorizationResult.subscribe((authorizationResult: AuthorizationResult) => {
            this.onAuthorizationResultComplete(authorizationResult);
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

    private onOidcModuleSetup() {
        console.log('AppComponent:onAuthorizationResultComplete');
        if (window.location.hash) {
            this.oidcSecurityService.authorizedImplicitFlowCallback();
        } else {
            if ('/autologin' !== window.location.pathname) {
                this.write('redirect', window.location.pathname);
            }
            console.log('AppComponent:onModuleSetup');
        }
    }

    private onAuthorizationResultComplete(authorizationResult: AuthorizationResult) {
        console.log('AppComponent:onAuthorizationResultComplete');
        const path = this.read('redirect');
        if (authorizationResult.authorizationState === AuthorizationState.authorized) {
            if (path) {
                this.router.navigate([path]);
            }
        } else {
            this.router.navigate(['/unauthorized']);
        }
    }

    private read(key: string): any {
        const data = localStorage.getItem(key);
        if (data != null) {
            return JSON.parse(data);
        }

        return;
    }

    private write(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
    }
}
