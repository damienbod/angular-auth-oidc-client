---
sidebar_label: Auto Login
sidebar_position: 9
---

# Auto Login

The library supports route-based automatic login thanks to the functional route guard: `autoLoginPartialRoutesGuard`. The guard implements the necessary handlers for both `canActivate` and `canMatch`, and will preserve the route upon completing a successful login.

## Common Scenarios

Here are a couple of the common use cases.

### Auto Login when the default route is not guarded

In this use case, some of your routes should be freely accessible, while others should be protected by a login, which should start when the user enters the protected route.

```ts
import { autoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent },
  {
    path: 'protected',
    component: ProtectedComponent,
    canActivate: [autoLoginPartialRoutesGuard],
  },
  {
    path: 'customers',
    loadChildren: () => import('./customers/customers.routes').then((m) => m.customerRoutes),
    canLoad: [autoLoginPartialRoutesGuard],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
];
```

In this case, the `/home` and `/unauthorized` routes are not protected, and they are accessible without a login.
Please make sure to call [`checkAuth()`](./public-api#checkauthurl-string-configid-string) on the component that is bootstrapped (e.g. `app.component.ts`) to check the authentication status at the beginning of your application, or use the `withAppInitializerAuthCheck` function to automatically check the authentication status when the application starts.

### Custom Params for the guard

If you need to pass custom params to the login request you can use the [data](https://angular.dev/api/router/Route#data) attribute of the route.
These parameters will then be appended to the login request.

```ts
import { autoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [autoLoginPartialRoutesGuard],
    data: { custom: 'param' },
  },
  { path: 'callback', component: CallbackComponent }, // does nothing but setting up auth
];
```

### Guard for a specific configuration

To guard a route using a specific configuration, you can use the `autoLoginPartialRoutesGuardWithConfig` function.
This function takes the configuration ID as a parameter and will use the specified configuration to perform the login process.

```ts
import { autoLoginPartialRoutesGuardWithConfig } from 'angular-auth-oidc-client';

const routes: Routes = [
  {
    path: 'protected',
    component: ProtectedComponent,
    canActivate: [autoLoginPartialRoutesGuardWithConfig('config-id')],
  },
];
```

### NgModule (Guard classes)

Instead of the functional guards, you can also use the guard classes.

:::info

If you use multiple configurations, the AutoLoginPartialRoutesGuard class-based guard selects the first provided configuration to perform the login.

:::

```ts
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent },
  {
    path: 'protected',
    component: ProtectedComponent,
    canActivate: [AutoLoginPartialRoutesGuard],
  },
  {
    path: 'customers',
    loadChildren: () => import('./customers/customers.module').then((m) => m.CustomersModule),
    canLoad: [AutoLoginPartialRoutesGuard],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
];
```
