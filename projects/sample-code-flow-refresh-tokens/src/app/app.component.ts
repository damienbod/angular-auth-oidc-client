import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventsService, EventTypes, OidcClientNotification, OidcSecurityService, PublicConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
    configuration: PublicConfiguration;
    isModuleSetUp$: Observable<boolean>;
    userDataChanged$: Observable<OidcClientNotification<any>>;
    userData$: Observable<any>;
    isAuthenticated$: Observable<boolean>;
    constructor(public oidcSecurityService: OidcSecurityService, private readonly eventsService: EventsService) {}

    ngOnInit() {
        this.configuration = this.oidcSecurityService.configuration;
        this.userData$ = this.oidcSecurityService.userData$;
        this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
        this.isModuleSetUp$ = this.oidcSecurityService.moduleSetup$;

        // Until the library is not doing this for itself, you have to do this here
        this.oidcSecurityService.stsCallback$
            .pipe(switchMap(() => this.doCallbackLogicIfRequired()))
            .subscribe((callbackContext) => console.log(callbackContext));

        this.userDataChanged$ = this.eventsService
            .registerForEvents()
            .pipe(filter((notification: OidcClientNotification<any>) => notification.type === EventTypes.UserDataChanged));

        this.oidcSecurityService.checkAuth().subscribe((isAuthenticated) => console.log('app authenticated', isAuthenticated));
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
        return this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString());
    }
}
