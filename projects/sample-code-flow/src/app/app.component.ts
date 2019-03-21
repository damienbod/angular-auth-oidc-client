import { Component, OnDestroy, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { filter, take } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
    isAuthenticated: boolean;
    userData: any;

    constructor(public oidcSecurityService: OidcSecurityService) {
        this.oidcSecurityService
            .getIsModuleSetup()
            .pipe(
                filter((isModuleSetup: boolean) => !!isModuleSetup),
                take(1)
            )
            .subscribe((isModuleSetup: boolean) => {
                this.doCallbackLogicIfRequired();
            });
    }

    ngOnInit() {
        this.oidcSecurityService.getIsAuthorized().subscribe(auth => {
            this.isAuthenticated = auth;
        });

        this.oidcSecurityService.getUserData().subscribe(userData => {
            this.userData = userData;
        });
    }

    ngOnDestroy(): void {}

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }

    private doCallbackLogicIfRequired() {
        // Will do a callback, if the url has a code and state parameter.
        this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString());
    }
}
