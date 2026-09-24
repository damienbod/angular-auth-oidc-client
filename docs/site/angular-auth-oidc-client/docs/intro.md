---
sidebar_label: Quickstart
sidebar_position: 1
---

# Quickstart

## Installation

You can either use the schematics with `ng add` or install the lib and add the needed files manually.

### ng Add

You can use the schematics and `ng add` the library.

```bash
ng add angular-auth-oidc-client
```

Step through the wizard and select the appropriate configuration options for your environment. Many of the configured values are placeholders and will need to be adjusted for your individual use case. Once you've confirmed your configuration, the library is ready to use.

#### Standalone or NgModule setup

By default, the schematic detects how your application is bootstrapped:

| Application | Created file | Registered in |
| --- | --- | --- |
| Standalone (`bootstrapApplication`) | `src/app/auth/auth.config.ts` | `provideAuth(authConfig)` in the providers of `app.config.ts` |
| NgModule (`bootstrapModule`) | `src/app/auth/auth-config.module.ts` | `AuthConfigModule` in the imports of the `AppModule` |

If you choose the flow that loads the configuration over HTTP, the files are named `auth-http.config.ts` and `auth-http-config.module.ts` instead.

To choose the setup explicitly, pass one of these options:

```bash
# Standalone setup with provideAuth()
ng add angular-auth-oidc-client --standalone

# NgModule setup with an AuthConfigModule
ng add angular-auth-oidc-client --legacy-modules
```

- `--standalone` also works in NgModule applications. `provideAuth(authConfig)` is then added to the `providers` of the `AppModule` and no `AuthConfigModule` is created.
- `--legacy-modules` requires an `AppModule` (`app.module.ts` or `app-module.ts`). In a standalone application the schematic stops with an error.
- The two options cannot be combined.

In NgModule applications the schematic also imports the `AppModule` into the `TestBed` of the root component spec (`app.spec.ts`), so the test compiles the component with its module and gets the auth configuration. Components declared by the `AppModule` are removed from the `TestBed` `declarations`, because a component can only be declared in one NgModule. If the spec has a different shape, it is left unchanged.

### Npm / Yarn / pnpm

Navigate to the level of your `package.json` and type

```bash npm2yarn
npm install angular-auth-oidc-client
```

After installing the library you can get started with the lib like below.

## Using a local configuration

### Standalone

Use the `provideAuth` function to configure the library.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAuth, LogLevel } from 'angular-auth-oidc-client';
// ...

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth({
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
    // ...
  ],
};
```

### NgModule

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

The library distinguishes between two operations that are called at very different moments. Knowing which one to call when is the most important thing to understand:

- **`checkAuth()`** — call **once on every app load** (typically from your root component's `ngOnInit`). It bootstraps the library: processes the callback if the user has just returned from the identity provider, restores any existing session from storage so a page refresh keeps the user signed in, and starts silent token renewal if configured. It does **not** redirect the user. The returned `Observable<LoginResponse>` tells you whether the user is authenticated.

- **`authorize()`** — call when the user *initiates* a login (clicks a "Sign in" button, or an auth guard demands authentication). It redirects the browser to the identity provider's login page.

A typical app shape:

```ts
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  /* ... */
})
export class AppComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  ngOnInit() {
    // Bootstrap on every page load. Handles the IdP callback,
    // restores stored sessions, and starts silent renewal.
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData}) => /* ... */);
  }

  login() {
    // User clicked sign-in: redirect to the identity provider.
    this.oidcSecurityService.authorize();
  }

  logout() {
    this.oidcSecurityService.logoff().subscribe((result) => console.log(result));
  }
}
```

> **Multiple configs:** if you registered more than one `provideAuth` configuration, use `checkAuthMultiple()` instead of `checkAuth()`. See the [Public API](documentation/public-api.md) reference for both methods.

> **Single Sign-On scenario:** if you want the app to detect an existing session at the identity provider that hasn't been observed by this app yet (e.g. the user signed in to another app on the same IdP), use `checkAuthIncludingServer()`. It performs the same local bootstrap as `checkAuth()` plus an iframe silent renew against the IdP.
