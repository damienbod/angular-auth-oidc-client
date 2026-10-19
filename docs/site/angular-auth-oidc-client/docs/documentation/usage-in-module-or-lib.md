---
sidebar_label: Usage in module or Angular lib
sidebar_position: 13
---

# Usage in module or Angular lib

This example shows how you could set the configuration in a feature module or a library module. The module must be imported eagerly (directly or indirectly) by the root `AppModule`, because the services of the library are provided in root. Calling `AuthModule.forRoot()` only in a lazy loaded module does not work.

> This is not recommended. Please use the initialization on root level.

```ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

@NgModule({
  declarations: [
    /*  */
  ],
  imports: [
    AuthModule.forRoot({
      config: {
        authority: '<your authority address here>',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'angularClient',
        scope: 'openid profile email',
        responseType: 'code',
        silentRenew: true,
        silentRenewUrl: `${window.location.origin}/silent-renew.html`,
        renewTimeBeforeTokenExpiresInSeconds: 10,
        logLevel: LogLevel.Debug,
      },
    }),
    CommonModule,
    RouterModule,
  ],
  exports: [
    /* */
  ],
})
export class ChildModule {}
```

The components code is the same then as using it in the main or any other module.
