# Using Guards

```typescript
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthorizationGuard implements CanActivate {
    constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        // return checkAuth() again should be possible
        return this.oidcSecurityService.isAuthenticated$.pipe(
            map((isAuthorized: boolean) => {
                console.log('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);

                if (!isAuthorized) {
                    this.router.navigate(['/unauthorized']);
                    return false;
                }

                return true;
            })
        );
    }
}
```

Do not forget to add the guard to your routes with `canActivate`, `canLoad`, etc.

```typescript
const appRoutes: Routes = [
  // ...
  { path: 'protected', component: <yourComponent>, canActivate: [AuthorizationGuard] }
];
```

> The guard should only be applied to protected URLs. The guard should not be active on the default route, where the authorization request is processed.
