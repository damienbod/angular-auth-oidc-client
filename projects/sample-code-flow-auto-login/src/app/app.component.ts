import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
    AuthorizationResult,
    AuthorizedState,
    EventsService,
    EventTypes,
    OidcClientNotification,
    OidcSecurityService,
} from 'angular-auth-oidc-client';
import { filter, tap } from 'rxjs/operators';
import './app.component.css';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent {
    constructor(public oidcSecurityService: OidcSecurityService, private router: Router, private readonly eventsService: EventsService) {
        this.oidcSecurityService
            .checkAuth()
            .pipe(tap(() => this.onOidcModuleSetup()))
            .subscribe((isAuthenticated) => console.log('i am ', isAuthenticated));

        this.eventsService
            .registerForEvents()
            .pipe(filter((notification: OidcClientNotification) => notification.type === EventTypes.NewAuthorizationResult))
            .subscribe((authorizationResult) => this.onAuthorizationResultComplete(authorizationResult.value));
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
        if (window.location.toString().includes('?code')) {
            this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString());
        } else {
            if ('/autologin' !== window.location.pathname) {
                this.write('redirect', window.location.pathname);
            }
            console.log('AppComponent:onOidcModuleSetup false');
            this.oidcSecurityService.isAuthenticated$.subscribe((authorized: boolean) => {
                if (!authorized) {
                    this.router.navigate(['/autologin']);
                }
            });
        }
    }

    private onAuthorizationResultComplete(authorizationResult: AuthorizationResult) {
        const path = this.read('redirect');
        console.log(
            'Auth result received AuthorizationState:' +
                authorizationResult.authorizationState +
                ' validationResult:' +
                authorizationResult.validationResult
        );

        if (authorizationResult.authorizationState === AuthorizedState.Authorized) {
            if (path.toString().includes('/unauthorized')) {
                this.router.navigate(['/']);
            } else {
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
