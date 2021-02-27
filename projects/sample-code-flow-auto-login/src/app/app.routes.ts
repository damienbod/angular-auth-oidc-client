import { RouterModule, Routes } from '@angular/router';
import { AuthorizationGuard } from './authorization.guard';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent, canActivate: [AuthorizationGuard] },
  { path: 'protected', component: ProtectedComponent, canActivate: [AuthorizationGuard] },
  { path: 'forbidden', component: ForbiddenComponent, canActivate: [AuthorizationGuard] },
  { path: 'unauthorized', component: UnauthorizedComponent },
];

export const routing = RouterModule.forRoot(appRoutes);
