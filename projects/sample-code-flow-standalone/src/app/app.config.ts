import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { AutoLoginPartialRoutesGuard, LogLevel, provideAuth } from 'angular-auth-oidc-client';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
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
        { path: 'protected', component: ProtectedComponent, canActivate: [AutoLoginPartialRoutesGuard] },
        { path: 'forbidden', component: ForbiddenComponent, canActivate: [AutoLoginPartialRoutesGuard] },
        {
          path: 'customers',
          loadChildren: () => import('./customers/customers.routes').then((m) => m.routes),
          canLoad: [AutoLoginPartialRoutesGuard],
        },
        { path: 'unauthorized', component: UnauthorizedComponent },
      ],
      withEnabledBlockingInitialNavigation()
    ),
  ],
};
