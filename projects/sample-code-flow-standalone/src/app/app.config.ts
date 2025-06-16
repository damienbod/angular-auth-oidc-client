import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import {
  authInterceptor,
  autoLoginPartialRoutesGuard,
  LogLevel,
  provideAuth,
} from 'angular-auth-oidc-client';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

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
        authority: 'https://offeringsolutions-sts.azurewebsites.net',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'angularCodeRefreshTokens',
        scope: 'openid profile email offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
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
