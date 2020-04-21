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
import { filter, tap } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
    title = 'app';

    constructor(public oidcSecurityService: OidcSecurityService, private router: Router, private readonly eventsService: EventsService) {}

    ngOnInit() {
        this.eventsService
            .registerForEvents()
            .pipe(filter((notification: OidcClientNotification<any>) => notification.type === EventTypes.NewAuthorizationResult))
            .subscribe((authorizationResult) => this.onAuthorizationResultComplete(authorizationResult.value));

        this.oidcSecurityService
            .checkAuth()
            .pipe(tap(() => this.onOidcModuleSetup()))
            .subscribe((isAuthenticated) => console.log('i am ', isAuthenticated));
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
            console.warn('AppComponent:onOidcModuleSetup false' + window.location.pathname);
            this.oidcSecurityService.isAuthenticated$.subscribe((authorized: boolean) => {
                if (!authorized) {
                    this.router.navigate(['/autologin']);
                }
            });
        }
    }

    private onAuthorizationResultComplete(authorizationResult: AuthorizationResult) {
        const path = this.read('redirect');
        console.log('AppComponent:onAuthorizationResultComplete path: ' + path);
        if (authorizationResult.authorizationState === AuthorizedState.Authorized) {
            if (path) {
                console.log('AppComponent:onAuthorizationResultComplete go to path ' + path);
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
