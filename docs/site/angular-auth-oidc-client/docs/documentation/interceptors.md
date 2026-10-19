---
sidebar_label: Http Interceptor
sidebar_position: 11
---

# Http Interceptor

The `HttpClient` allows you to implement [HTTP interceptors](https://angular.dev/guide/http/interceptors#interceptors) to tap into requests and responses. A common use case would be to intercept any outgoing HTTP request and add an authorization header.

:::warning

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

A request is treated as secured if its URL starts with a configured route (a plain string prefix check). So if you configure `https://example.org/api` the token is also added to a request to the route `https://example.org/api/users`, but also to `https://example.org/api-internal`. End the route with a `/` to avoid this.

It is also possible to configure wildcard routes by using `*`. A route containing a wildcard has to match the whole request URL, and `*` matches any characters, including `/`. If you configure `https://example.org/api/*/token`, requests like `https://example.org/api/applications/token` or `https://example.org/api/applications/example/token` are treated as secured routes, but `https://example.org/api/applications/token?x=1` is not.

The URLs are compared as they are passed to the `HttpClient`. If you use relative URLs in your requests, configure relative `secureRoutes` as well.

The token is added as `Authorization: Bearer <token>` header, replacing an existing `Authorization` header. If the matching configuration is not authenticated, the request is sent unchanged.

In case you are running multiple configurations, the configurations are checked in the order they were provided, and the first configuration with a matching secure route wins (first match, not the most specific match). The access token of that configuration is applied in the Authorization header.

Keep in mind that you always can implement your own interceptor as [described in the Angular documentation](https://angular.dev/guide/http/interceptors#interceptors).

## NgModule

To configure the interceptor in an `NgModule` see the following example, which:

- Imports the `AuthModule`, and sets the `secureRoutes` in the `config`.
- Registers the `AuthInterceptor` to `HTTP_INTERCEPTORS`.

```ts
import { AuthInterceptor, AuthModule } from 'angular-auth-oidc-client';

@NgModule({
  // ...
  imports: [
    // ...
    AuthModule.forRoot({
      config: {
        // ...
        secureRoutes: ['https://my-secure-url.com/', 'https://my-second-secure-url.com/'],
      },
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    // ...
  ],
})
export class AppModule {}
```

The `AuthModule` already provides the `HttpClient` with `provideHttpClient(withInterceptorsFromDi())`, so interceptors registered with `HTTP_INTERCEPTORS` are picked up and importing the deprecated `HttpClientModule` is not needed.
