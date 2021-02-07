import { Routes, RouterModule } from '@angular/router';

import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ProtectedComponent } from './protected/protected.component';
import { AuthorizationGuard } from './authorization.guard';

const appRoutes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [AuthorizationGuard] },
  { path: 'autologin', component: AutoLoginComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'protected', component: ProtectedComponent, canActivate: [AuthorizationGuard] },
];

export const routing = RouterModule.forRoot(appRoutes);
