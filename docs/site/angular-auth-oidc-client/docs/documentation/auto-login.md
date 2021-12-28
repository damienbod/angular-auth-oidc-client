---
sidebar_label: Auto Login
sidebar_position: 8
---

# Auto Login

The library supports route-based automatic login thanks to the two included route guards: `AutoLoginPartialRoutesGuard` and `AutoLoginAllRoutesGuard`. The guards implement the necessary handlers for both `canActivate` and `canLoad`, and they will preserve the route upon completing a successful login.

_IMPORTANT: If you are using multiple configurations, the guards currently select the first provided configuration to perform the login._

## Common Scenarios

Here are a couple of the common use cases.

### Auto Login when default route is not guarded

In this use case, some of your routes should be freely accessible, while others should be protected by a login, and the login should start when the user enters the protected route.

```ts
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

const routes: Routes = [
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

In this case, the `/home` and `/unauthorized` routes are not protected, and they are accessible without a login.
Please make sure to call `checkAuth()` like normal in your `app.component.ts`.

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

If all your routes are guarded please use the `AutoLoginAllRoutesGuard` instead of the `AutoLoginPartialRoutesGuard`. This guard ensures that `checkAuth()` is being called and that you do not need to call it in `app.component.ts`.

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

[Source Code](../../../../../projects/sample-code-flow-auto-login)
