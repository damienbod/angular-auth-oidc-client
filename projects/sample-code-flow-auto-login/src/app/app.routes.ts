import { RouterModule, Routes } from '@angular/router';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

const appRoutes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'autologin', component: AutoLoginComponent },
    { path: 'forbidden', component: ForbiddenComponent },
    { path: 'Uunauthorized', component: UnauthorizedComponent },
];

export const routing = RouterModule.forRoot(appRoutes);
