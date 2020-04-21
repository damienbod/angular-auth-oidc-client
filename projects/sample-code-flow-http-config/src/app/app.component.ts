import { Component, OnInit } from '@angular/core';
import { EventsService, EventTypes, OidcClientNotification, OidcSecurityService, PublicConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
    configuration: PublicConfiguration;
    isModuleSetUp$: Observable<boolean>;
    userDataChanged$: Observable<OidcClientNotification<any>>;
    userData$: Observable<any>;
    isAuthenticated$: Observable<boolean>;

    checkSessionChanged: any;

    constructor(public oidcSecurityService: OidcSecurityService, private readonly eventsService: EventsService) {}

    ngOnInit() {
        this.configuration = this.oidcSecurityService.configuration;
        this.userData$ = this.oidcSecurityService.userData$;
        this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
        this.isModuleSetUp$ = this.oidcSecurityService.moduleSetup$;
        // this.checkSessionChanged$ = this.oidcSecurityService.checkSessionChanged$;

        this.userDataChanged$ = this.eventsService
            .registerForEvents()
            .pipe(filter((notification) => notification.type === EventTypes.UserDataChanged));

        this.eventsService
            .registerForEvents()
            .pipe(filter((notification) => notification.type === EventTypes.CheckSessionChanged))
            .subscribe((checkSessionChanged) => (this.checkSessionChanged = checkSessionChanged));

        this.oidcSecurityService
            .checkAuth()
            .pipe(tap(() => this.doCallbackLogicIfRequired()))
            .subscribe((isAuthenticated) => console.log('app authenticated', isAuthenticated));
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
