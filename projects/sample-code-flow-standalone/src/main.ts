import {importProvidersFrom} from "@angular/core";
import {bootstrapApplication} from '@angular/platform-browser';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import {AutoLoginPartialRoutesGuard} from "angular-auth-oidc-client";

import { AppComponent } from './app/app.component';
import {HomeComponent} from "./app/home/home.component";
import {ProtectedComponent} from "./app/protected/protected.component";
import {ForbiddenComponent} from "./app/forbidden/forbidden.component";
import {UnauthorizedComponent} from "./app/unauthorized/unauthorized.component";
import {AuthConfigModule} from "./app/auth-config.module";

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(AuthConfigModule),
    provideRouter(
      [
        { path: '', pathMatch: 'full', redirectTo: 'home' },
        { path: 'home', component: HomeComponent },
        { path: 'protected', component: ProtectedComponent, canActivate: [AutoLoginPartialRoutesGuard] },
        { path: 'forbidden', component: ForbiddenComponent, canActivate: [AutoLoginPartialRoutesGuard] },
        {
          path: 'customers',
          loadChildren: () => import('./app/customers/customers.routes').then((m) => m.routes),
          canLoad: [AutoLoginPartialRoutesGuard],
        },
        { path: 'unauthorized', component: UnauthorizedComponent },
      ],
      withEnabledBlockingInitialNavigation()
    ),
  ],
});
