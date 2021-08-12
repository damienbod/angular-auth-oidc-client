---
sidebar_label: Auto Login
sidebar_position: 8
---

# Auto Login

If you want to have your app being redirected to the secure token server automatically without the user clicking any login button only by accessing a specific route, you can use the `AutoLoginPartialRoutesGuard` or the `AutoLoginAllRoutesGuard` provided by the lib. In case you are using multiple configs the guard currently uses the first config fix to perform a login! The guard handles `canActivate` and `canLoad` for you. It also saves the route you wanted to visit before the login and redirects you to that route after the successful login.

Here are two use cases to distinguish:

### Auto Login when default route is not guarded

You have this case when you have some routes in your configuration publicly accessible and some routes should be protected by a login. The login should start when the user enters the route.

For example

```ts
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent },
  { path: 'protected', component: ProtectedComponent, canActivate: [AutoLoginPartialRoutesGuard] },
  {
    path: 'customers',
    loadChildren: () => import('./customers/customers.module').then((m) => m.CustomersModule),
    canLoad: [AutoLoginPartialRoutesGuard],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
];
```

In this case the `/home` and the `/unauthorized` are not protected and accessible without a login.

Please make sure to call `checkAuth()` like normal in your `app.component.ts`

```ts
export class AppComponent implements OnInit {
  constructor(private oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData, accessToken }) => {
      // ...
    });
  }
}
```

### Auto Login when all routes are guarded

If all your routes are guarded please use the `AutoLoginAllRoutesGuard` instead of the `AutoLoginPartialRoutesGuard`. This guard ensures that `checkAuth` is being called for you and you do not have to call it in your `app.component.ts` then.

```ts
export class AppComponent implements OnInit {
  constructor(/* ... */) {}

  ngOnInit() {
    // No need to call checkAuth()
  }
}
```

```ts
import { AutoLoginAllRoutesGuard } from 'angular-auth-oidc-client';

const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent, canActivate: [AutoLoginAllRoutesGuard] },
  { path: 'protected', component: ProtectedComponent, canActivate: [AutoLoginAllRoutesGuard] },
  { path: 'forbidden', component: ForbiddenComponent, canActivate: [AutoLoginAllRoutesGuard] },
  {
    path: 'customers',
    loadChildren: () => import('./customers/customers.module').then((m) => m.CustomersModule),
    canLoad: [AutoLoginAllRoutesGuard],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
];
```

[src code](../projects/sample-code-flow-auto-login)
