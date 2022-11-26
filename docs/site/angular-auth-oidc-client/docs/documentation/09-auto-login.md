---
sidebar_label: Auto Login
sidebar_position: 9
---

# Auto Login

The library supports route-based automatic login thanks to the route guard: `AutoLoginPartialRoutesGuard`. The guard implements the necessary handlers for both `canActivate` and `canLoad`, and will preserve the route upon completing a successful login.

:::info

If you are using multiple configurations, the guards currently select the first provided configuration to perform the login.\_

:::

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

:::caution

Please do not use the `AutoLoginAllRoutesGuard` anymore as it is not recommended anymore, deprecated and will be removed in future versions of this library.

More information [Why is AutoLoginAllRoutesGuard not recommended?](https://github.com/damienbod/angular-auth-oidc-client/issues/1549)

:::

If you want to protect your complete application, every route in your app, we recommend having one public route, e.g. `/callback` where your identity provider can redirect to. In this route you can set up the authentication and then redirect to the route you wanted to go to initially. This would be the "normal" behaviour of a SPA. You have to call `checkAuth()` in this `CallbackComponent` so that the url can be processed and set up, then redirect. Also think of calling `checkAuth()` in the AppComponent

```ts
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent, canActivate: [AutoLoginPartialRoutesGuard] },
  { path: 'callback', component: CallbackComponent }, // does nothing but setting up auth
];
```
