import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { OidcSecurityService,
  AuthorizationResult,
  AuthorizationState} from 'angular-auth-oidc-client';

import './app.component.css';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

    constructor(public oidcSecurityService: OidcSecurityService,
                private router: Router
    ) {
        if (this.oidcSecurityService.moduleSetup) {
            this.onOidcModuleSetup();
        } else {
            this.oidcSecurityService.onModuleSetup.subscribe(() => {
                this.onOidcModuleSetup();
            });
        }

        this.oidcSecurityService.onAuthorizationResult.subscribe(
            (authorizationResult: AuthorizationResult) => {
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
        if (window.location.hash) {
            this.oidcSecurityService.authorizedImplicitFlowCallback();
        } else {
            if ('/autologin' !== window.location.pathname) {
                this.write('redirect', window.location.pathname);
            }
            console.log('AppComponent:onModuleSetup');
            this.oidcSecurityService.getIsAuthorized().subscribe((authorized: boolean) => {
                if (!authorized) {
                    this.router.navigate(['/autologin']);
                }
            });
        }
    }

    private onAuthorizationResultComplete(authorizationResult: AuthorizationResult) {

        const path = this.read('redirect');
        console.log('Auth result received AuthorizationState:'
            + authorizationResult.authorizationState
            + ' validationResult:' + authorizationResult.validationResult);

        if (authorizationResult.authorizationState === AuthorizationState.authorized) {
            this.router.navigate([path]);
        } else {
            this.router.navigate(['/Unauthorized']);
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
