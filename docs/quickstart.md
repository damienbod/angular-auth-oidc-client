# Quickstart

You can either use the schematics with `ng add` or install the lib and adding the needed files manually.

## Ng Add

You can use the schematics and `ng add` the library.

```
ng add angular-auth-oidc-client
```

And answer the questions. A module will be created which encapsulates your configuration.

## Npm / Yarn

Navigate to the level of your `package.json` and type

```typescript
 npm install angular-auth-oidc-client
```

or with yarn

```typescript
 yarn add angular-auth-oidc-client
```

After installing the library you can get started with the lib like below.

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

### Silent Renew with the Angular CLI

Add the `silent-renew.html` file to the `angular.json` assets configuration

```json
"assets": [
    "projects/sample-code-flow/src/silent-renew.html",
    "projects/sample-code-flow/src/favicon.ico",
    "projects/sample-code-flow/src/assets"
  ],
```

### Silent Renew Code Flow with PKCE

```javascript
<script>
	window.onload = function () {
		/* The parent window hosts the Angular application */
		var parent = window.parent;
		/* Send the id_token information to the oidc message handler */
		var event = new CustomEvent('oidc-silent-renew-message', { detail: window.location });
		parent.dispatchEvent(event);
	};
</script>
```
