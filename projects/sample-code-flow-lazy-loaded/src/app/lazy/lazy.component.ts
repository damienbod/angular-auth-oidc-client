import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-lazy',
    templateUrl: './lazy.component.html',
    styleUrls: ['./lazy.component.css'],
})
export class LazyComponent implements OnInit {
    isAuthenticated$: Observable<boolean>;
    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit(): void {
        this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
    }

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }
}
