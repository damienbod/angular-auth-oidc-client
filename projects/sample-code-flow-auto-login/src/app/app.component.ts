import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
    AuthorizationResult,
    AuthorizedState,
    EventsService,
    EventTypes,
    OidcClientNotification,
    OidcSecurityService,
} from 'angular-auth-oidc-client';
import { filter, switchMap, tap } from 'rxjs/operators';
import './app.component.css';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
    constructor(public oidcSecurityService: OidcSecurityService, private router: Router, private readonly eventsService: EventsService) {}

    ngOnInit() {
        this.eventsService
            .registerForEvents()
            .pipe(filter((notification: OidcClientNotification<any>) => notification.type === EventTypes.NewAuthorizationResult))
            .subscribe((authorizationResult) => this.onAuthorizationResultComplete(authorizationResult.value));

        this.oidcSecurityService
            .checkAuth()

            .pipe(
                tap((isAuthenticated) => {
                    if (!isAuthenticated && '/autologin' !== window.location.pathname) {
                        this.write('redirect', window.location.pathname);
                    }

                    console.log('AppComponent:onOidcModuleSetup false');
                }),
                tap((isAuthenticated) => {
                    if (!isAuthenticated && !this.isCallback()) {
                        this.router.navigate(['/autologin']);
                    }
                }),
                switchMap(() => {
                    if (this.isCallback()) {
                        return this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString());
                    }
                })
            )
            .subscribe((result) => {
                console.log('result', result);
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

    private isCallback() {
        return window.location.toString().includes('?code');
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
