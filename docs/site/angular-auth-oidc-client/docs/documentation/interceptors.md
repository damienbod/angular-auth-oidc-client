---
sidebar_label: Http Interceptor
sidebar_position: 11
---

# Http Interceptor

The `HttpClient` allows you to implement [HTTP interceptors](https://angular.io/guide/http#intercepting-requests-and-responses) to tap into requests and responses. A common use case would be to intercept any outgoing HTTP request and add an authorization header.

**Note:** Do not send the access token with requests for which the access token is not intended!

You can configure the routes you want to send a token within the configuration:

```ts
AuthModule.forRoot({
  config: {
    // ...
    secureRoutes: ['https://my-secure-url.com/', 'https://my-second-secure-url.com/'],
  },
}),
```

The lib provides its own interceptor implementation which you can register like any other HTTP interceptor:
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

## Functional API

To use the functional API use the `authInterceptor` method

```ts
import { ApplicationConfig } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth, authInterceptor } from 'angular-auth-oidc-client';
import { AppComponent } from './app/app.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor()])),
    provideAuth({
      config: {
        /* Your config here */
      },
    }),
  ],
};

bootstrapApplication(AppComponent, appConfig);
```
