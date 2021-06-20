import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AutoLoginGuard } from 'angular-auth-oidc-client';
import { CallbackComponent } from './callback/callback.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent, canActivate: [AutoLoginGuard] },
  { path: 'protected', component: ProtectedComponent, canActivate: [AutoLoginGuard] },
  { path: 'forbidden', component: ForbiddenComponent, canActivate: [AutoLoginGuard] },
  {
    path: 'customers',
    loadChildren: () => import('./customers/customers.module').then((m) => m.CustomersModule),
    canLoad: [AutoLoginGuard],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'callback', component: CallbackComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
