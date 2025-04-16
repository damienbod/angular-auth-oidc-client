---
sidebar_label: Http Interceptor
sidebar_position: 11
---

# Http Interceptor

The `HttpClient` allows you to implement [HTTP interceptors](https://angular.dev/guide/http/interceptors#interceptors) to tap into requests and responses. A common use case would be to intercept any outgoing HTTP request and add an authorization header.

:::warn

Do not send the access token with requests for which the access token is not intended!

:::

The lib provides its own interceptor implementation, which you can register like any other HTTP interceptor using `withInterceptors`:

```ts
import { authInterceptor } from 'angular-auth-oidc-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor()])),
    provideAuth({
      config: {
        // ...
      },
    }),
  ],
};
```

Using the configuration (via the `secureRoutes` property) you can define the routes to which the token will be added as the authorization header's value.

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor()])),
    provideAuth({
      config: {
        // ...
        secureRoutes: ['https://my-secure-url.com/', 'https://my-second-secure-url.com/'],
      },
    }),
  ],
};
```

If you configured a route to be protected, every child route underneath is protected, too. So if you configure `https://example.org/api` the token is also added to a request to the route `https://example.org/api/users`. It is also possible to configure wildcard routes by using `*`. If you configure `https://example.org/api/*/token` all requests to the resource `api`, ending with an access to `token` will be treated as a secured route, e.g. `https://example.org/api/applications/token` or `https://example.org/api/applications/example/token`.

In case you are running multiple configurations all the configured routes over all configurations are collected and compared against the currently requested route. If a match is made, the token for the configuration you added the secure route to is being taken and applied in the Authorization header.

Keep in mind that you always can implement your own interceptor as [described in the Angular documentation](https://angular.dev/guide/http/interceptors#interceptors).

## NgModule

To use configure the interceptors in an `NgModule` see the following example, which:

- Imports the `AuthModule`, and sets the `secureRoutes`.
- Registers the `AuthInterceptor` to `HTTP_INTERCEPTORS`.

```ts
import { AuthInterceptor, AuthModule } from 'angular-auth-oidc-client';

@NgModule({
  // ...
  imports: [
    // ...
    AuthModule.forRoot({
      // ...
      secureRoutes: ['https://my-secure-url.com/', 'https://my-second-secure-url.com/'],
    }),
    HttpClientModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    // ...
  ],
})
export class AppModule {}
```
