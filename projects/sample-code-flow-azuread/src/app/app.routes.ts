import { RouterModule, Routes } from '@angular/router';
import { AutoLoginGuard } from 'angular-auth-oidc-client';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

const appRoutes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [AutoLoginGuard] },
  { path: 'forbidden', component: ForbiddenComponent, canActivate: [AutoLoginGuard] },
  { path: 'protected', component: ProtectedComponent, canActivate: [AutoLoginGuard] },
  { path: 'unauthorized', component: UnauthorizedComponent },
];

export const routing = RouterModule.forRoot(appRoutes);
