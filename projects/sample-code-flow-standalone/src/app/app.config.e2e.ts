import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import {
  LogLevel,
  authInterceptor,
  autoLoginPartialRoutesGuard,
  provideAuth,
} from 'angular-auth-oidc-client';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

// Swapped in for app.config.ts by the "e2e" build configuration.
// Points the sample at the local test IdP (projects/integration-tests/test-idp-server)
// so the end-to-end tests in /e2e can run without an external identity provider.
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor()])),
    provideAuth({
      config: {
        triggerAuthorizationResultEvent: true,
        postLoginRoute: '/home',
        forbiddenRoute: '/forbidden',
        unauthorizedRoute: '/unauthorized',
        logLevel: LogLevel.Debug,
        historyCleanupOff: true,
        authority: 'http://localhost:8081/idp1',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'client-idp1',
        scope: 'openid profile email offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        // The test IdP issues tokens valid for 300 seconds. Renewing 290 seconds
        // before expiry makes the refresh-token renew kick in after ~10 seconds.
        renewTimeBeforeTokenExpiresInSeconds: 290,
      },
    }),
    provideRouter(
      [
        { path: '', pathMatch: 'full', redirectTo: 'home' },
        { path: 'home', component: HomeComponent },
        {
          path: 'protected',
          component: ProtectedComponent,
          canActivate: [autoLoginPartialRoutesGuard],
        },
        {
          path: 'forbidden',
          component: ForbiddenComponent,
          canActivate: [autoLoginPartialRoutesGuard],
        },
        {
          path: 'customers',
          loadChildren: () =>
            import('./customers/customers.routes').then((m) => m.routes),
          canMatch: [autoLoginPartialRoutesGuard],
        },
        { path: 'unauthorized', component: UnauthorizedComponent },
      ],
      withEnabledBlockingInitialNavigation()
    ),
  ],
};
