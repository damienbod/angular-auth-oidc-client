import { RouterModule, Routes } from '@angular/router';
import { AutoLoginAllRoutesGuard } from 'angular-auth-oidc-client';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent, canActivate: [AutoLoginAllRoutesGuard] },
  { path: 'forbidden', component: ForbiddenComponent, canActivate: [AutoLoginAllRoutesGuard] },
  { path: 'protected', component: ProtectedComponent, canActivate: [AutoLoginAllRoutesGuard] },
  { path: 'unauthorized', component: UnauthorizedComponent },
];

export const routing = RouterModule.forRoot(appRoutes);
