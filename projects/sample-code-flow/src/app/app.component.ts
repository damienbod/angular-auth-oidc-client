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
            console.log('app authenticated', isAuthenticated);
            if (!isAuthenticated) {
                console.log('run login without UI', !isAuthenticated);
                // const parameters = {
                //     customParams: {
                //         prompt: 'none',
                //     },
                //     scope: 'openid profile email',
                // };
                this.oidcSecurityService.forceRefreshSession();
            }
        });
    }
}
