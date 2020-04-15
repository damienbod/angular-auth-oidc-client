import { Component, OnInit, OnDestroy } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-auto-component',
  templateUrl: './auto-login.component.html'
})

export class AutoLoginComponent implements OnInit, OnDestroy {
  lang: any;

  constructor(public oidcSecurityService: OidcSecurityService
  ) {
    this.oidcSecurityService.onModuleSetup.subscribe(() => { this.onModuleSetup(); });
  }

  ngOnInit() {
    if (this.oidcSecurityService.moduleSetup) {
      this.onModuleSetup();
    }
  }

  ngOnDestroy(): void {
  }

  private onModuleSetup() {
    this.oidcSecurityService.authorize();
  }
}
