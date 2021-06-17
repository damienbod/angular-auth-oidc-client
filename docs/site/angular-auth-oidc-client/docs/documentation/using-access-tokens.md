---
sidebar_label: Using Access Tokens
sidebar_position: 8
---

# Using Access Tokens

The access token can be used by calling the `getAccessToken()` function.

## Accessing the access token

You can get the access token by calling the method `getAccessToken()` on the `OidcSecurityService`

```ts
const token = this.oidcSecurityService.getAccessToken();
```

or

```ts
const token = this.oidcSecurityService.getAccessToken('configId');
```

And then you can use it in the HttpHeaders

```ts
import { HttpHeaders } from '@angular/common/http';

const token = this.oidcSecurityServices.getAccessToken();

const httpOptions = {
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + token,
  }),
};
```

## Http Interceptor

The `HttpClient` allows you to write [interceptors](https://angular.io/guide/http#intercepting-requests-and-responses). A common use case would be to intercept any outgoing HTTP request and add an authorization header.

**Note** Do not send the access token with requests for which the access token is not intended!

You can configure the routes you want to send a token with in the configuration

```ts
AuthModule.forRoot({
  config: {
    // ...
    secureRoutes: ['https://my-secure-url.com/', 'https://my-second-secure-url.com/'],
  },
}),
```

and use the interceptor the lib provides you

```ts
import { AuthInterceptor /*, ... */ } from 'angular-auth-oidc-client';

@NgModule({
    declarations: [...],
    imports: [
        //...
        AuthModule.forRoot(...),
        HttpClientModule,
    ],
    providers: [
        // ...
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }
```

## Revoke the access token

Access tokens can be revoked using the `revokeAccessToken()` function. If you provide the access token in the param, any access token from the same STS can be revoked, if the STS supports the revocation endpoint.

```ts
revokeAccessToken() {
    this.oidcSecurityService.revokeAccessToken()
        .subscribe((result) => console.log(result));
}
```
