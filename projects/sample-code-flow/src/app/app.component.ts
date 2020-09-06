import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.oidcSecurityService.checkAuth().subscribe((isAuthenticated) => {
            console.warn('app authenticated', isAuthenticated);
            const at = this.oidcSecurityService.getToken();
            console.warn(at);
        });
    }
}
