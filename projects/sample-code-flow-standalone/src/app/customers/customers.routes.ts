import {  Routes } from '@angular/router';
import { CustomersComponent } from './customers.component';

export const routes: Routes = [
  { path: '', component: CustomersComponent },
  { path: 'details', component: CustomersComponent },
];

