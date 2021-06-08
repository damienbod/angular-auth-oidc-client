---
sidebar_label: Using Guards
sidebar_position: 7
---

# Using Guards

> The guard should only be applied to protected URLs. The guard should not be active on the default route, where the authorization request is processed.

```ts
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthorizationGuard implements CanActivate {
  constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.oidcSecurityService.isAuthenticated$.pipe(
      map((isAuthorized: boolean) => {
        console.log('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);

        if (!isAuthorized) {
          this.router.navigateByUrl('/unauthorized');
          return false;
        }

        return true;
      })
    );
  }
}
```

Do not forget to add the guard to your routes with `canActivate`, `canLoad`, etc.

```ts
const appRoutes: Routes = [
  // ...
  { path: 'protected', component: <yourComponent>, canActivate: [AuthorizationGuard] }
];
```
