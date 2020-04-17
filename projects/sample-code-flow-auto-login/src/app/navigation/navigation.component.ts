import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-navigation',
    templateUrl: 'navigation.component.html',
})
export class NavigationComponent implements OnInit {
    isAuthenticated: boolean;

    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.oidcSecurityService.getIsAuthorized().subscribe((auth) => {
            this.isAuthenticated = auth;
        });
    }

    login() {
        this.oidcSecurityService.authorize();
    }

    refreshSession() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }
}
