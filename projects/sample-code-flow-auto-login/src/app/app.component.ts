import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthorizationResult, AuthorizedState, EventsService, OidcSecurityService } from 'angular-auth-oidc-client';
import { switchMap, tap } from 'rxjs/operators';
import './app.component.css';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
    constructor(public oidcSecurityService: OidcSecurityService, private router: Router, private readonly eventsService: EventsService) {}

    ngOnInit() {
        // Until the library is not doing this for itself, you have to do this here
        this.oidcSecurityService.stsCallback$
            .pipe(switchMap(() => this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString())))
            .subscribe((callbackContext) => this.onAuthorizationResultComplete(callbackContext.authResult));

        this.oidcSecurityService
            .checkAuth()

            .pipe(
                tap((isAuthenticated) => {
                    if (!isAuthenticated) {
                        if ('/autologin' !== window.location.pathname && !this.isCallback()) {
                            alert('write ' + window.location.pathname);
                            this.write('redirect', window.location.pathname);
                            this.router.navigate(['/autologin']);
                        }
                    }

                    console.log('AppComponent:onOidcModuleSetup false');
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

    private onAuthorizationResultComplete(authorizationResult: AuthorizationResult) {
        const path = this.read('redirect');
        alert('read ' + path);
        console.log(
            'Auth result received AuthorizationState:' +
                authorizationResult.authorizationState +
                ' validationResult:' +
                authorizationResult.validationResult
        );

        if (authorizationResult.authorizationState !== AuthorizedState.Authorized) {
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
