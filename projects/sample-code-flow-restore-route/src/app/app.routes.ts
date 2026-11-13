import { Routes } from '@angular/router';
import { RouteOneComponent } from './route-one.component';
import { RouteTwoComponent } from './route-two.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'one' },
  { path: 'one', component: RouteOneComponent },
  { path: 'two', component: RouteTwoComponent },
];
