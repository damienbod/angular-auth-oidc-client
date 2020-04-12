import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-auto-login',
  templateUrl: './auto-login.component.html',
  styleUrls: ['./auto-login.component.css']
})
export class AutoLoginComponent implements OnInit {

    constructor(public oidcSecurityService: OidcSecurityService
    ) {
        this.oidcSecurityService.onModuleSetup.subscribe(() => { this.onModuleSetup(); });
    }

    ngOnInit() {
        if (this.oidcSecurityService.moduleSetup) {
            this.onModuleSetup();
        }
    }

    private onModuleSetup() {
        this.oidcSecurityService.authorize();
    }
}
