---
sidebar_label: Quickstart
sidebar_position: 1
---

# Quickstart

## Installation

You can either use the schematics with `ng add` or install the lib and adding the needed files manually.

### Ng Add

You can use the schematics and `ng add` the library.

```
ng add angular-auth-oidc-client
```

And answer the questions. A module will be created which encapsulates your configuration. Check the values being configured and replace them by your needs. Then you are ready to use the library.

### Npm / Yarn

Navigate to the level of your `package.json` and type

```typescript
 npm install angular-auth-oidc-client
```

or with yarn

```typescript
 yarn add angular-auth-oidc-client
```

After installing the library you can get started with the lib like below.

### Silent Renew with the Angular CLI

Make sure you add the `silent-renew.html` file to the `angular.json` assets configuration

```json
"assets": [
    "projects/sample-code-flow-multi-iframe/src/silent-renew.html",
    "projects/sample-code-flow-multi-iframe/src/favicon.ico",
    "projects/sample-code-flow-multi-iframe/src/assets"
  ],
```

## Using a local configuration

Import the module and services in your module.

```typescript
import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';
// ...

@NgModule({
  // ...
  imports: [
    // ...
    AuthModule.forRoot({
      config: {
        stsServer: '<your sts address here>',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'angularClient',
        scope: 'openid profile email',
        responseType: 'code',
        silentRenew: true,
        silentRenewUrl: `${window.location.origin}/silent-renew.html`,
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
