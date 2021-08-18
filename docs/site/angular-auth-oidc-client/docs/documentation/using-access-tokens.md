---
sidebar_label: Using Access Tokens
sidebar_position: 8
---

# Using Access Tokens

The access token can be used by calling the `getAccessToken()` method.

## Accessing the access token

You can get the access token by calling the method `getAccessToken()` on the `OidcSecurityService`

```ts
const token = this.oidcSecurityService.getAccessToken();
```

or for a specific config:

```ts
const token = this.oidcSecurityService.getAccessToken('configId');
```

You can then manually use the token within `HttpHeaders` when performing an HTTP request with Angular's `HttpClient`:

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

The `HttpClient` allows you to implement [HTTP interceptors](https://angular.io/guide/http#intercepting-requests-and-responses) to tap into requests and responses. A common use case would be to intercept any outgoing HTTP request and add an authorization header.

**Note:** Do not send the access token with requests for which the access token is not intended!

You can configure the routes you want to send a token with in the configuration:

```ts
AuthModule.forRoot({
  config: {
    // ...
    secureRoutes: ['https://my-secure-url.com/', 'https://my-second-secure-url.com/'],
  },
}),
```

The lib provides an own interceptor implementation which you can register like any other HTTP interceptor:
and use the interceptor the lib provides you

```ts
import { AuthInterceptor, AuthModule } from 'angular-auth-oidc-client';

@NgModule({
  // ...
  imports: [
    // ...
    AuthModule.forRoot(),
    HttpClientModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    // ...
  ],
})
export class AppModule {}
```

If you configured a route to be protected, every child route underneath is protected, too. So if you configure `https://example.org/api` the token is also added to a request to the route `https://example.org/api/users`.

In case you are running multiple configurations all the configured routes over all configurations are collected and compared against the currently requested route. If a match is made, the token for the configuration you added the secure route to is being taken and applied in the Authorization header.

Keep in mind that you always can implement your own interceptor as [described in the Angular documentation](https://angular.io/guide/http#intercepting-requests-and-responses).

## Revoke the access token

Access tokens can be revoked using the `revokeAccessToken()` method. If you provide the access token as a parameter, any access token from the same Security Token Service can be revoked, if the Security Token Service supports the revocation endpoint.

```ts
revokeAccessToken() {
  this.oidcSecurityService.revokeAccessToken()
      .subscribe((result) => console.log(result));
}
```
