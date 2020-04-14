import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventsService, EventTypes, OidcSecurityService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
    isAuthenticated: boolean;
    isModuleSetUp: any;
    userData: any;

    constructor(public oidcSecurityService: OidcSecurityService, private readonly eventService: EventsService) {
        if (this.oidcSecurityService.moduleSetup) {
            this.doCallbackLogicIfRequired();
        } else {
            this.oidcSecurityService.onModuleSetup.subscribe(() => {
                this.doCallbackLogicIfRequired();
            });
        }
    }

    ngOnInit() {
        this.eventService
            .registerForEvents()
            .pipe(filter((notification) => notification.type === EventTypes.ModuleSetup))
            .subscribe((notification) => (this.isModuleSetUp = notification.value));

        this.oidcSecurityService.setupModule();
        this.oidcSecurityService.getIsAuthorized().subscribe((auth) => {
            this.isAuthenticated = auth;
        });

        this.oidcSecurityService.getUserData().subscribe((userData) => {
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
