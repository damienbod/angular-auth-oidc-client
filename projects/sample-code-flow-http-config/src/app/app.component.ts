import { Component, OnInit } from '@angular/core';
import { EventsService, EventTypes, OidcClientNotification, OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
    isConfigurationLoaded$: Observable<OidcClientNotification>;
    isModuleSetUp$: Observable<OidcClientNotification>;
    checkSessionChanged$: Observable<OidcClientNotification>;
    userData: any;
    isAuthenticated: boolean;
    checkSessionChanged: boolean;

    constructor(public oidcSecurityService: OidcSecurityService, public eventsService: EventsService) {
        this.oidcSecurityService.setupModule();

        if (this.oidcSecurityService.moduleSetup) {
            this.doCallbackLogicIfRequired();
        } else {
            this.oidcSecurityService.onModuleSetup.subscribe(() => {
                this.doCallbackLogicIfRequired();
            });
        }
    }

    ngOnInit() {
        this.isModuleSetUp$ = this.eventsService
            .registerForEvents()
            .pipe(filter((notification: OidcClientNotification) => notification.type === EventTypes.ModuleSetup));

        this.isConfigurationLoaded$ = this.eventsService
            .registerForEvents()
            .pipe(filter((notification: OidcClientNotification) => notification.type === EventTypes.ConfigLoaded));

        this.checkSessionChanged$ = this.eventsService.registerForEvents().pipe(
            filter((notification: OidcClientNotification) => notification.type === EventTypes.CheckSessionChanged),
            tap((item) => (this.checkSessionChanged = item.value === 'changed'))
        );

        this.oidcSecurityService.getIsAuthorized().subscribe((auth) => {
            this.isAuthenticated = auth;
        });

        this.oidcSecurityService.getUserData().subscribe((userData) => {
            this.userData = userData;
        });
    }

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
