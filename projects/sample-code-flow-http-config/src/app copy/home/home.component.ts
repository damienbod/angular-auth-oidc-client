import { Component, OnInit } from '@angular/core';
import { OidcClientNotification, OidcSecurityService, PublicConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
})
export class HomeComponent implements OnInit {
    configuration: PublicConfiguration;
    userDataChanged$: Observable<OidcClientNotification<any>>;
    userData$: Observable<any>;
    isAuthenticated$: Observable<boolean>;

    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.configuration = this.oidcSecurityService.configuration;
        this.userData$ = this.oidcSecurityService.userData$;
        this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
        this.oidcSecurityService.checkAuth().subscribe((isAuthenticated) => console.log('app authenticated', isAuthenticated));
    }

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }
}
