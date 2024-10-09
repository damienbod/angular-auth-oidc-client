import { Routes } from '@angular/router';
import { autoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [autoLoginPartialRoutesGuard],
  },
  {
    path: 'forbidden',
    component: ForbiddenComponent,
    canActivate: [autoLoginPartialRoutesGuard],
  },
  {
    path: 'protected',
    component: ProtectedComponent,
    canActivate: [autoLoginPartialRoutesGuard],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
];
