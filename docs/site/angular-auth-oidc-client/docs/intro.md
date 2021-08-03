---
sidebar_label: Quickstart
sidebar_position: 1
---

# Quickstart

## Installation

You can either use the schematics with `ng add` or install the lib and add the needed files manually.

### ng Add

You can use the schematics and `ng add` the library.

```
ng add angular-auth-oidc-client
```

Step through the wizard and select the appropriate configuration options for you environment. Once the wizard is complete, a module will be created to encapsulate your OIDC configuration. Many of the configured values are placeholders and will need to be adjusted for your individual use case. Once you've confirmed your configuration, the library is ready to use.

### Npm / Yarn

Navigate to the level of your `package.json` and type

```ts
 npm install angular-auth-oidc-client
```

or with yarn

```ts
 yarn add angular-auth-oidc-client
```

After installing the library you can get started with the lib like below.

## Using a local configuration

Import the module and services in your module.

```ts
import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';
// ...

@NgModule({
  // ...
  imports: [
    // ...
    AuthModule.forRoot({
      config: {
        authority: '<your authority address here>',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: '<your clientId>',
        scope: 'openid profile email offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        logLevel: LogLevel.Debug,
      },
    }),
  ],
  // ...
})
export class AppModule {}
```

## Login and Logout

Make sure the login is checked at the beginning of your app (for example in the `app.component.ts`). The `OidcSecurityService` provides everything you need to login/logout your users.

```ts
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  /* ... */
})
export class AppComponent implements OnInit {
  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData}) => /* ... */);
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    this.oidcSecurityService.logoff();
  }
}
```
